// Regression: two questions in the same category with the SAME points must be
// independently selectable and independently markable-answered (the old
// category::points key would have collided).
const { io } = require('socket.io-client');
const fs = require('fs');
const URL = `http://localhost:${process.env.PORT || 3000}`;
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const Q = JSON.parse(fs.readFileSync('questions.json', 'utf8'));
  // Kids: 1.a and 1.b are both 100 pts.
  const a = Q.find(q => q.label === '1.a');
  const b = Q.find(q => q.label === '1.b');
  if (!a || !b || a.points !== b.points) { console.log('FAIL: setup'); process.exit(1); }

  const host = io(URL, { forceNew: true });
  let board = null;
  let q1 = null;
  host.on('state:board', d => { board = d; });
  host.on('state:question', q => { q1 = q; });
  await sleep(300);
  host.emit('host:startGame');
  await sleep(300);

  // Select 1.a, finish it (skip), then check 1.b is still available and 1.a is answered.
  host.emit('host:selectQuestion', { id: a.id });
  await sleep(300);
  const selectedA = q1 && q1.id === a.id;
  host.emit('host:skip'); // marks 1.a answered, back to board
  await sleep(300);

  const kids = board.find(c => c.category === a.category);
  const cellA = kids.questions.find(x => x.id === a.id);
  const cellB = kids.questions.find(x => x.id === b.id);

  host.emit('host:selectQuestion', { id: b.id });
  await sleep(300);
  const selectedB = q1 && q1.id === b.id;

  const ok = selectedA && cellA.answered === true && cellB.answered === false && selectedB;
  console.log('selected 1.a =', selectedA, '| 1.a answered =', cellA.answered,
              '| 1.b answered =', cellB.answered, '| selected 1.b =', selectedB);
  console.log(ok ? 'PASS: same-points questions are independent' : 'FAIL');
  host.close();
  process.exit(ok ? 0 : 1);
})();
