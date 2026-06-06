// Integration test: after the host marks a buzzed team's answer WRONG, buzzing
// reopens AUTOMATICALLY to ALL teams — including the team that just answered
// wrong — without the host clicking "Open Buzz" again.
const { io } = require('socket.io-client');
const fs = require('fs');
const URL = `http://localhost:${process.env.PORT || 3000}`;
const sleep = ms => new Promise(r => setTimeout(r, ms));

// Mimic player.html: track canBuzz from buzz:open / buzz:locked exactly as the
// real client does (respecting excludedTeams).
function makePlayer(name, team) {
  const s = io(URL, { forceNew: true });
  let canBuzz = false;
  s.on('connect', () => { s.emit('player:join', { name, team }); s.emit('request:state'); });
  s.on('buzz:open', (p = {}) => { canBuzz = !(p.excludedTeams || []).includes(team); });
  s.on('buzz:locked', () => { canBuzz = false; });
  return { socket: s, buzz: () => { if (canBuzz) s.emit('player:buzz'); }, canBuzz: () => canBuzz };
}

(async () => {
  const Q = JSON.parse(fs.readFileSync('questions.json', 'utf8'));
  const audioQ = Q.find(q => q.media && q.media.type === 'audio');

  const host = io(URL, { forceNew: true });
  let firstBuzzTeam = null;
  host.on('buzz:first', ({ team }) => { firstBuzzTeam = team; });
  await sleep(300);
  host.emit('host:startGame');
  await sleep(200);

  const a = makePlayer('Alice', 'TeamA');
  const b = makePlayer('Bob', 'TeamB');
  await sleep(400);

  // Audio question auto-opens buzzing.
  host.emit('host:selectQuestion', { id: audioQ.id });
  await sleep(500);

  // Player A buzzes first.
  a.buzz();
  await sleep(400);
  const aBuzzedFirst = firstBuzzTeam === 'TeamA';
  console.log('after A buzzes, firstBuzzTeam =', firstBuzzTeam);

  // Host marks WRONG. Buzzing should reopen automatically to everyone.
  firstBuzzTeam = null;
  host.emit('host:wrong');
  await sleep(500);

  const aCanRebuzz = a.canBuzz();
  const bCanRebuzz = b.canBuzz();
  console.log('after wrong, A canBuzz =', aCanRebuzz, '| B canBuzz =', bCanRebuzz);

  // Verify B (a different team) can actually buzz now.
  b.buzz();
  await sleep(400);
  const bBuzzedAfterWrong = firstBuzzTeam === 'TeamB';
  console.log('after B buzzes post-wrong, firstBuzzTeam =', firstBuzzTeam);

  // Reset by marking wrong again, then verify the WRONG team (A) itself can buzz.
  firstBuzzTeam = null;
  host.emit('host:wrong');
  await sleep(500);
  const aCanRebuzzAgain = a.canBuzz();
  a.buzz();
  await sleep(400);
  const aBuzzedAfterWrong = firstBuzzTeam === 'TeamA';
  console.log('after second wrong, A canBuzz =', aCanRebuzzAgain, '| A buzzed =', aBuzzedAfterWrong);

  const ok = aBuzzedFirst && aCanRebuzz && bCanRebuzz && bBuzzedAfterWrong
    && aCanRebuzzAgain && aBuzzedAfterWrong;
  console.log(ok
    ? 'PASS: buzzing reopens automatically to all teams (incl. the wrong team) after a wrong answer'
    : 'FAIL: someone could not buzz after a wrong answer');
  host.close(); a.socket.close(); b.socket.close();
  process.exit(ok ? 0 : 1);
})();
