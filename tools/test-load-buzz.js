// Load + correctness test: 50 concurrent player connections.
//
// Verifies that the buzz feature stays correct under many simultaneous
// connections and repeated wrong answers:
//   - 50 players (spread across 10 teams) all connect and join.
//   - When a question opens, every connection can buzz.
//   - Each round, ALL 50 buzz simultaneously; the server must register
//     exactly ONE team as first (per-team lock, no double-registration).
//   - After the host marks that answer WRONG, buzzing reopens to EVERYONE
//     (including the team that just answered wrong), and a DIFFERENT team
//     can win the next round.
//   - This repeats for many wrong answers; no connection ever gets stuck.
//   - Finally, host marks an answer CORRECT and buzzing locks for all.
//
// Usage: PORT=39xx node tools/test-load-buzz.js  (server must be running)

const { io } = require('socket.io-client');
const fs = require('fs');
const URL = `http://localhost:${process.env.PORT || 3000}`;
const sleep = ms => new Promise(r => setTimeout(r, ms));

const NUM_PLAYERS = 50;
const NUM_TEAMS = 10;            // 5 players per team
const WRONG_ROUNDS = 8;          // how many wrong answers to cycle through

function teamFor(i) { return `Team${i % NUM_TEAMS}`; }

// Mirror player.html: track canBuzz from buzz:open/buzz:locked, auto-rejoin on
// connect, and only emit a buzz when allowed (respecting excludedTeams).
function makePlayer(i) {
  const name = `P${i}`;
  const team = teamFor(i);
  const s = io(URL, { forceNew: true, reconnection: false });
  let canBuzz = false;
  let connected = false;
  s.on('connect', () => { connected = true; s.emit('player:join', { name, team }); s.emit('request:state'); });
  s.on('buzz:open', (p = {}) => { canBuzz = !(p.excludedTeams || []).includes(team); });
  s.on('buzz:locked', () => { canBuzz = false; });
  return {
    socket: s, name, team,
    buzz: () => { if (canBuzz) s.emit('player:buzz'); },
    canBuzz: () => canBuzz,
    isConnected: () => connected,
  };
}

let failures = 0;
function check(cond, msg) {
  if (!cond) { failures++; console.log('  ✗ FAIL:', msg); }
  else console.log('  ✓', msg);
}

(async () => {
  const Q = JSON.parse(fs.readFileSync('questions.json', 'utf8'));
  // Need enough distinct questions to burn through (1 per wrong round + extras).
  const questions = Q.filter(q => q.media && q.media.type === 'audio');
  if (questions.length < WRONG_ROUNDS + 2) {
    console.log('FAIL: not enough audio questions to run the test'); process.exit(1);
  }

  // Host tracks who the server says buzzed first each round.
  const host = io(URL, { forceNew: true, reconnection: false });
  let firstBuzzTeam = null;
  let firstBuzzCount = 0;
  host.on('buzz:first', ({ team }) => { firstBuzzTeam = team; firstBuzzCount++; });
  await sleep(300);
  host.emit('host:startGame');
  await sleep(300);

  // Spin up 50 concurrent players.
  console.log(`Connecting ${NUM_PLAYERS} players across ${NUM_TEAMS} teams…`);
  const players = Array.from({ length: NUM_PLAYERS }, (_, i) => makePlayer(i));
  await sleep(2500); // give all sockets time to connect + join

  const connectedCount = players.filter(p => p.isConnected()).length;
  check(connectedCount === NUM_PLAYERS, `all ${NUM_PLAYERS} players connected (got ${connectedCount})`);

  const wonTeams = new Set();
  let qi = 0;

  for (let round = 1; round <= WRONG_ROUNDS; round++) {
    // Open a fresh question -> buzzing auto-opens for everyone.
    firstBuzzTeam = null;
    firstBuzzCount = 0;
    host.emit('host:selectQuestion', { id: questions[qi++].id });
    await sleep(600);

    const everyoneCanBuzz = players.every(p => p.canBuzz());
    check(everyoneCanBuzz, `round ${round}: all 50 connections can buzz when question opens`);

    // STAMPEDE: all 50 buzz "simultaneously". Shuffle the emit order each round
    // so we don't deterministically favor the same connection — this mirrors
    // real-world random network arrival and exercises whoever-arrives-first.
    const order = [...players];
    for (let k = order.length - 1; k > 0; k--) {
      const j = Math.floor(Math.random() * (k + 1));
      [order[k], order[j]] = [order[j], order[k]];
    }
    order.forEach(p => p.buzz());
    await sleep(700);

    // The server must register exactly ONE winning team.
    check(firstBuzzCount === 1,
      `round ${round}: exactly ONE buzz:first emitted under 50-way stampede (got ${firstBuzzCount})`);
    check(firstBuzzTeam !== null, `round ${round}: a team won the buzz (${firstBuzzTeam})`);
    wonTeams.add(firstBuzzTeam);

    // Host marks WRONG -> buzzing must reopen to everyone, including the winner.
    host.emit('host:wrong');
    await sleep(600);

    const allReopened = players.every(p => p.canBuzz());
    check(allReopened, `round ${round}: after WRONG, all 50 connections can buzz again`);

    // Move on (don't keep the same question open forever).
    host.emit('host:skip');
    await sleep(300);
  }

  // Over the rounds, more than one distinct team should have won (proves it's
  // not always the same connection winning / others aren't starved).
  check(wonTeams.size >= 2,
    `multiple distinct teams won across rounds (got ${wonTeams.size}: ${[...wonTeams].join(',')})`);

  // Final: open a question, someone buzzes, host marks CORRECT -> locked for all.
  firstBuzzTeam = null;
  host.emit('host:selectQuestion', { id: questions[qi++].id });
  await sleep(600);
  players.forEach(p => p.buzz());
  await sleep(600);
  check(firstBuzzTeam !== null, 'final round: a team buzzed');
  host.emit('host:correct');
  await sleep(600);
  const allLocked = players.every(p => !p.canBuzz());
  check(allLocked, 'after CORRECT, buzzing is locked for all 50 connections');

  // Cleanup.
  players.forEach(p => p.socket.close());
  host.close();

  console.log(failures === 0
    ? `\nPASS: buzz correct under ${NUM_PLAYERS} concurrent connections across ${WRONG_ROUNDS} wrong-answer rounds`
    : `\nFAIL: ${failures} assertion(s) failed`);
  process.exit(failures === 0 ? 0 : 1);
})();
