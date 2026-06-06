// Integration test: buzzing auto-opens for TEXT-ONLY questions (media:null), not
// just audio/video. Asserts on the Socket.IO events the server emits:
//   - host:selectQuestion (text-only Q, media:null) -> buzz:open + state:question
//   - player A buzzes -> buzz:first fires for their team
const { io } = require('socket.io-client');
const fs = require('fs');
const URL = `http://localhost:${process.env.PORT || 3000}`;
const sleep = ms => new Promise(r => setTimeout(r, ms));

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
  const textQ = Q.find(q => q.media == null);
  if (!textQ) { console.log('FAIL: no text-only (media:null) question in questions.json'); process.exit(1); }
  console.log('text-only Q:', JSON.stringify(textQ.category), textQ.points, '| media =', textQ.media);

  const host = io(URL, { forceNew: true });
  let buzzOpenCount = 0, firstBuzzTeam = null, gotQuestion = false, questionMedia = 'unset';
  host.on('buzz:open', () => { buzzOpenCount++; });
  host.on('buzz:first', ({ team }) => { firstBuzzTeam = team; });
  host.on('state:question', (q) => { gotQuestion = true; questionMedia = q.media; });

  await sleep(300);
  host.emit('host:startGame');
  await sleep(200);

  const a = makePlayer('Alice', 'TeamA');
  await sleep(400);

  // Select the text-only question -> buzz should auto-open.
  buzzOpenCount = 0;
  host.emit('host:selectQuestion', { category: textQ.category, points: textQ.points });
  await sleep(500);
  const autoOpenedBuzz = buzzOpenCount >= 1;
  const noMedia = questionMedia == null;
  const aCanBuzzAtStart = a.canBuzz();
  console.log('after select text Q: buzz:open count =', buzzOpenCount, '| state:question =', gotQuestion,
    '| question media =', questionMedia, '| A canBuzz =', aCanBuzzAtStart);

  // Player A buzzes -> buzz:first fires for TeamA.
  a.buzz();
  await sleep(400);
  const aBuzzedFirst = firstBuzzTeam === 'TeamA';
  console.log('after A buzz: firstBuzzTeam =', firstBuzzTeam);

  const ok = autoOpenedBuzz && gotQuestion && noMedia && aCanBuzzAtStart && aBuzzedFirst;
  console.log(ok
    ? 'PASS: text-only question auto-opens buzz and player can buzz (buzz:first fires)'
    : 'FAIL: text-only question did not auto-open buzz / player could not buzz');
  host.close(); a.socket.close();
  process.exit(ok ? 0 : 1);
})();
