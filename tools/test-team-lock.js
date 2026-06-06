// A player who joined a team cannot switch teams by rejoining with a
// different team. The server keeps them on their original team and echoes
// that team back.
const { io } = require('socket.io-client');
const URL = `http://localhost:${process.env.PORT || 3000}`;
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const s = io(URL, { forceNew: true });
  let joinedTeam = null;
  s.on('player:joined', ({ team }) => { joinedTeam = team; });
  await sleep(300);

  s.emit('player:join', { name: 'Alice', team: 'TeamA' });
  await sleep(300);
  const first = joinedTeam;

  // Attempt to switch to TeamB (e.g. tampering / rejoin with different team).
  s.emit('player:join', { name: 'Alice', team: 'TeamB' });
  await sleep(300);
  const afterSwitch = joinedTeam;

  console.log('first join team   =', first);
  console.log('after switch team =', afterSwitch);
  const ok = first === 'TeamA' && afterSwitch === 'TeamA';
  console.log(ok ? 'PASS: player locked to original team' : 'FAIL: team switch was allowed');
  s.close();
  process.exit(ok ? 0 : 1);
})();
