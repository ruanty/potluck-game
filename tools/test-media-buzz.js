// Integration test: the new media start/resume + auto-stop-on-buzz behavior.
//
// Media itself is only on the display and isn't real in a headless test, so we
// assert on the Socket.IO events the server emits (which the display reacts to):
//   - host:selectQuestion (audio Q) -> buzz:open (auto-open) + state:question
//   - player A buzzes -> buzz:first (display would PAUSE the audio)
//   - host:wrong -> buzz:open again (A and B can both buzz)
//   - host:startMedia -> media:resume (display would .play() again)
//   - host:correct after a buzz -> buzz:locked (buzzing stops for everyone)
const { io } = require('socket.io-client');
const fs = require('fs');
const URL = `http://localhost:${process.env.PORT || 3000}`;
const sleep = ms => new Promise(r => setTimeout(r, ms));

// Mimic player.html: track canBuzz from buzz:open / buzz:locked (respecting
// excludedTeams) exactly as the real client does.
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
  const audioQ = Q.find(q => q.media && ['audio', 'video'].includes(q.media.type));
  if (!audioQ) { console.log('FAIL: no audio/video question in questions.json'); process.exit(1); }

  // Fake "display" client — has no real audio, just records the media events.
  const display = io(URL, { forceNew: true });
  let mediaStops = 0, mediaResumes = 0, displayBuzzFirst = 0, gotQuestion = false;
  display.on('media:stop', () => { mediaStops++; });
  display.on('media:resume', () => { mediaResumes++; });
  display.on('buzz:first', () => { displayBuzzFirst++; });
  display.on('state:question', () => { gotQuestion = true; });

  const host = io(URL, { forceNew: true });
  let buzzOpenCount = 0, buzzLockedCount = 0, firstBuzzTeam = null;
  host.on('buzz:open', () => { buzzOpenCount++; });
  host.on('buzz:locked', () => { buzzLockedCount++; });
  host.on('buzz:first', ({ team }) => { firstBuzzTeam = team; });

  await sleep(300);
  host.emit('host:startGame');
  await sleep(200);

  const a = makePlayer('Alice', 'TeamA');
  const b = makePlayer('Bob', 'TeamB');
  await sleep(400);

  // 1) Select an audio question -> buzz auto-opens + question pushed to display.
  buzzOpenCount = 0;
  host.emit('host:selectQuestion', { category: audioQ.category, points: audioQ.points });
  await sleep(500);
  const autoOpenedBuzz = buzzOpenCount >= 1;
  const aCanBuzzAtStart = a.canBuzz();
  console.log('after select: buzz:open count =', buzzOpenCount, '| state:question =', gotQuestion, '| A canBuzz =', aCanBuzzAtStart);

  // 2) Player A buzzes -> buzz:first (display would stop audio).
  a.buzz();
  await sleep(400);
  const aBuzzedFirst = firstBuzzTeam === 'TeamA';
  const displaySawBuzz = displayBuzzFirst >= 1;
  console.log('after A buzz: firstBuzzTeam =', firstBuzzTeam, '| display saw buzz:first =', displaySawBuzz);

  // 3) Host wrong -> buzz reopens to everyone (no media:resume on wrong).
  const resumesBeforeWrong = mediaResumes;
  buzzOpenCount = 0; firstBuzzTeam = null;
  host.emit('host:wrong');
  await sleep(500);
  const reopenedAfterWrong = buzzOpenCount >= 1;
  const bothCanBuzz = a.canBuzz() && b.canBuzz();
  const noResumeOnWrong = mediaResumes === resumesBeforeWrong;
  console.log('after wrong: buzz:open count =', buzzOpenCount, '| A&B canBuzz =', bothCanBuzz, '| no media:resume on wrong =', noResumeOnWrong);

  // 4) Host startMedia -> media:resume emitted to display.
  host.emit('host:startMedia');
  await sleep(300);
  const gotResume = mediaResumes >= 1;
  console.log('after startMedia: media:resume count =', mediaResumes);

  // 5) A buzz (emits buzz:locked) then host correct -> stays locked for everyone,
  //    and crucially NO buzz:open is re-sent (buzzing stops until next question).
  buzzLockedCount = 0;
  a.buzz();
  await sleep(400);
  const lockedOnBuzz = buzzLockedCount >= 1; // buzz:locked fires at buzz time
  buzzOpenCount = 0;
  host.emit('host:correct');
  await sleep(400);
  const lockedAfterCorrect = lockedOnBuzz && buzzOpenCount === 0 && !a.canBuzz() && !b.canBuzz();
  console.log('after correct: buzz:locked on buzz =', lockedOnBuzz, '| buzz:open after correct =', buzzOpenCount, '| A canBuzz =', a.canBuzz(), '| B canBuzz =', b.canBuzz());

  const ok = autoOpenedBuzz && gotQuestion && aCanBuzzAtStart && aBuzzedFirst && displaySawBuzz
    && reopenedAfterWrong && bothCanBuzz && noResumeOnWrong && gotResume && lockedAfterCorrect;
  console.log(ok
    ? 'PASS: media auto-opens buzz, buzz emits buzz:first (display stops audio), wrong reopens, startMedia resumes, correct locks'
    : 'FAIL: one of the media/buzz behaviors did not hold');
  host.close(); display.close(); a.socket.close(); b.socket.close();
  process.exit(ok ? 0 : 1);
})();
