// Tunnel load test: 50 concurrent connections THROUGH a public tunnel
// (cloudflared `npm run tunnel`, or ngrok `npm run tunnel:stable`).
//
// Unlike test-load-buzz.js (which hits localhost and proves buzz LOGIC), this
// exercises the real network path: it measures how long 50 sockets take to
// connect through the tunnel, the buzz round-trip latency, and whether any
// connection drops or gets starved. Run it FROM A MACHINE THAT CAN REACH THE
// TUNNEL (e.g. off the corporate network) while the game server runs behind
// the tunnel.
//
// Usage:
//   1) In one terminal:  npm run tunnel        (or npm run tunnel:stable)
//      It prints e.g. "Players join: https://xxxx.trycloudflare.com/player.html"
//   2) In another terminal, point this test at that base URL:
//        TUNNEL_URL="https://xxxx.trycloudflare.com" node tools/test-tunnel-load.js
//      Optional knobs:
//        PLAYERS=50 TEAMS=10 ROUNDS=8 TUNNEL_URL="https://…" node tools/test-tunnel-load.js
//
// NOTE: this makes the host actually advance through real questions, so run it
// before the event (it marks questions answered). Restart the server to reset.

const { io } = require('socket.io-client');
const fs = require('fs');

const BASE = (process.env.TUNNEL_URL || '').replace(/\/+$/, '');
if (!BASE) {
  console.error('ERROR: set TUNNEL_URL, e.g. TUNNEL_URL="https://xxxx.trycloudflare.com" node tools/test-tunnel-load.js');
  process.exit(2);
}
const NUM_PLAYERS = Number(process.env.PLAYERS || 50);
const NUM_TEAMS = Number(process.env.TEAMS || 10);
const WRONG_ROUNDS = Number(process.env.ROUNDS || 8);
const sleep = ms => new Promise(r => setTimeout(r, ms));

// cloudflared/ngrok free tiers sometimes inject a browser-warning interstitial
// on plain HTTP; this header skips it. Harmless on cloudflared.
const extraHeaders = { 'ngrok-skip-browser-warning': 'true' };
// Socket.IO options tuned for a higher-latency tunnel.
const sockOpts = {
  forceNew: true,
  reconnection: false,
  transports: ['websocket'],
  timeout: 20000,
  extraHeaders,
};

function teamFor(i) { return `Team${i % NUM_TEAMS}`; }

function makePlayer(i) {
  const name = `P${i}`;
  const team = teamFor(i);
  const s = io(BASE, sockOpts);
  let canBuzz = false, connected = false, connectMs = null, connectErr = null;
  const t0 = Date.now();
  s.on('connect', () => { connected = true; connectMs = Date.now() - t0; s.emit('player:join', { name, team }); s.emit('request:state'); });
  s.on('connect_error', e => { connectErr = e.message; });
  s.on('disconnect', () => { connected = false; });
  s.on('buzz:open', (p = {}) => { canBuzz = !(p.excludedTeams || []).includes(team); });
  s.on('buzz:locked', () => { canBuzz = false; });
  return {
    socket: s, name, team,
    buzz: () => { if (canBuzz) s.emit('player:buzz'); },
    canBuzz: () => canBuzz,
    isConnected: () => connected,
    connectMs: () => connectMs,
    connectErr: () => connectErr,
  };
}

let failures = 0;
const check = (cond, msg) => { if (!cond) { failures++; console.log('  ✗ FAIL:', msg); } else console.log('  ✓', msg); };
const pct = (arr, p) => { if (!arr.length) return null; const s = [...arr].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(p / 100 * s.length))]; };

(async () => {
  console.log(`Target tunnel: ${BASE}`);
  console.log(`Players: ${NUM_PLAYERS} | Teams: ${NUM_TEAMS} | Wrong rounds: ${WRONG_ROUNDS}\n`);

  // We need a list of question ids. Fetch questions.json THROUGH the tunnel so
  // we don't depend on a local copy matching the server.
  let Q;
  try {
    const res = await fetch(`${BASE}/questions.json`, { headers: extraHeaders });
    if (res.ok) Q = await res.json();
  } catch (e) { /* fall through */ }
  if (!Q) {
    try { Q = JSON.parse(fs.readFileSync('questions.json', 'utf8')); console.log('(using local questions.json — tunnel did not serve it)\n'); }
    catch (e) { console.error('Could not load questions from tunnel or disk:', e.message); process.exit(2); }
  }
  const questions = Q.filter(q => q.media && q.media.type === 'audio');
  if (questions.length < WRONG_ROUNDS + 2) { console.log('FAIL: not enough audio questions'); process.exit(1); }

  // Host connection through the tunnel.
  const host = io(BASE, sockOpts);
  let firstBuzzTeam = null, firstBuzzCount = 0;
  const buzzTimes = [];
  let buzzSentAt = 0;
  host.on('buzz:first', ({ team }) => {
    firstBuzzTeam = team; firstBuzzCount++;
    if (buzzSentAt) buzzTimes.push(Date.now() - buzzSentAt);
  });
  await sleep(500);
  check(host.connected, 'host connected through tunnel');
  host.emit('host:startGame');
  await sleep(500);

  // Connect 50 players concurrently; give the tunnel generous time.
  console.log(`Connecting ${NUM_PLAYERS} players through the tunnel…`);
  const players = Array.from({ length: NUM_PLAYERS }, (_, i) => makePlayer(i));
  for (let waited = 0; waited < 20000; waited += 500) {
    if (players.every(p => p.isConnected())) break;
    await sleep(500);
  }
  const connected = players.filter(p => p.isConnected());
  const connMs = connected.map(p => p.connectMs()).filter(x => x != null);
  check(connected.length === NUM_PLAYERS, `all ${NUM_PLAYERS} players connected (got ${connected.length})`);
  if (connected.length < NUM_PLAYERS) {
    const errs = players.filter(p => !p.isConnected()).map(p => p.connectErr()).filter(Boolean);
    if (errs.length) console.log('   connect errors (sample):', [...new Set(errs)].slice(0, 3).join(' | '));
  }
  console.log(`   connect latency: median ${pct(connMs, 50)}ms, p95 ${pct(connMs, 95)}ms, max ${Math.max(...connMs, 0)}ms`);

  const wonTeams = new Set();
  let qi = 0;

  for (let round = 1; round <= WRONG_ROUNDS; round++) {
    firstBuzzTeam = null; firstBuzzCount = 0;
    host.emit('host:selectQuestion', { id: questions[qi++].id });
    await sleep(1500); // tunnel latency: give buzz:open time to fan out

    const canCount = players.filter(p => p.canBuzz()).length;
    check(canCount === connected.length, `round ${round}: all ${connected.length} connected players can buzz (got ${canCount})`);

    // Stampede in shuffled order.
    const order = [...players];
    for (let k = order.length - 1; k > 0; k--) { const j = Math.floor(Math.random() * (k + 1)); [order[k], order[j]] = [order[j], order[k]]; }
    buzzSentAt = Date.now();
    order.forEach(p => p.buzz());
    await sleep(2000); // wait for round-trip through tunnel

    check(firstBuzzCount === 1, `round ${round}: exactly ONE buzz:first under stampede (got ${firstBuzzCount})`);
    if (firstBuzzTeam) wonTeams.add(firstBuzzTeam);

    host.emit('host:wrong');
    await sleep(1500);
    const reopened = players.filter(p => p.canBuzz()).length;
    check(reopened === connected.length, `round ${round}: after WRONG, all ${connected.length} can buzz again (got ${reopened})`);

    host.emit('host:skip');
    await sleep(800);
  }

  check(wonTeams.size >= 2, `multiple distinct teams won across rounds (got ${wonTeams.size}: ${[...wonTeams].join(',')})`);
  check(players.filter(p => p.isConnected()).length === connected.length,
    `no connections dropped during the test (${players.filter(p => p.isConnected()).length}/${connected.length} still up)`);

  if (buzzTimes.length) console.log(`\n   buzz round-trip (host saw buzz:first): median ${pct(buzzTimes, 50)}ms, p95 ${pct(buzzTimes, 95)}ms`);

  players.forEach(p => p.socket.close());
  host.close();
  console.log(failures === 0
    ? `\nPASS: ${connected.length} concurrent tunnel connections, buzz correct across ${WRONG_ROUNDS} wrong rounds`
    : `\nFAIL: ${failures} assertion(s) failed`);
  process.exit(failures === 0 ? 0 : 1);
})();
