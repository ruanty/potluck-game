// Integration test: a player who reconnects with a NEW socket id (simulating a
// tunnel dropping the WebSocket) can still buzz, without manually rejoining.
const { io } = require('socket.io-client');
const fs = require('fs');
const URL = `http://localhost:${process.env.PORT || 3000}`;
const sleep = ms => new Promise(r => setTimeout(r, ms));

// Mimic player.html: remember identity, auto-rejoin + request state on connect.
function makePlayer(name, team) {
  const s = io(URL, { forceNew: true });
  let canBuzz = false;
  s.on('connect', () => { s.emit('player:join', { name, team }); s.emit('request:state'); });
  s.on('buzz:open', (p = {}) => { canBuzz = !(p.excludedTeams || []).includes(team); });
  s.on('buzz:locked', () => { canBuzz = false; });
  return { socket: s, buzz: () => { if (canBuzz) s.emit('player:buzz'); }, canBuzz: () => canBuzz };
}

(async () => {
  // Pick a real audio question (auto-opens buzz on select).
  const Q = JSON.parse(fs.readFileSync('questions.json', 'utf8'));
  const audioQ = Q.find(q => q.media && q.media.type === 'audio');

  const host = io(URL, { forceNew: true });
  let firstBuzzTeam = null;
  host.on('buzz:first', ({ team }) => { firstBuzzTeam = team; });
  await sleep(300);
  host.emit('host:startGame');
  await sleep(200);

  const p = makePlayer('Alice', 'TeamA');
  await sleep(400);

  // Simulate tunnel drop BEFORE the question: disconnect then reconnect (new id).
  p.socket.disconnect();
  await sleep(300);
  p.socket.connect();
  await sleep(500);

  // Now open an audio question -> buzz auto-opens.
  host.emit('host:selectQuestion', { id: audioQ.id });
  await sleep(500);

  console.log('after reconnect, canBuzz =', p.canBuzz());
  p.buzz();
  await sleep(500);

  const ok = firstBuzzTeam === 'TeamA';
  console.log('firstBuzzTeam =', firstBuzzTeam);
  console.log(ok ? 'PASS: reconnected player can buzz' : 'FAIL: reconnected player could not buzz');
  host.close(); p.socket.close();
  process.exit(ok ? 0 : 1);
})();
