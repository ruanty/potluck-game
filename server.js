const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');
const os = require('os');
const QRCode = require('qrcode');

const app = express();
const server = createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// First non-internal IPv4 address — the LAN URL phones use on the same Wi-Fi.
function getLanIp() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) return net.address;
    }
  }
  return 'localhost';
}

// The URL players should open to join. A public tunnel (cloudflared) sets
// PUBLIC_URL so cellular / off-network phones work; otherwise use the LAN IP.
function getJoinBaseUrl() {
  if (process.env.PUBLIC_URL) return process.env.PUBLIC_URL.replace(/\/+$/, '');
  return `http://${getLanIp()}:${PORT}`;
}
function getPlayerJoinUrl() {
  return `${getJoinBaseUrl()}/player.html`;
}

app.use(express.static(path.join(__dirname, 'public')));

// Plain-text join URL (the display polls this to render its own QR).
app.get('/join-url', (req, res) => {
  res.type('text/plain').send(getPlayerJoinUrl());
});

// Server-rendered QR PNG for the player join URL. Works fully offline — no
// external QR service — which matters at a venue with flaky internet.
app.get('/qr', async (req, res) => {
  try {
    const png = await QRCode.toBuffer(getPlayerJoinUrl(), {
      type: 'png', width: 320, margin: 1,
      color: { dark: '#000000', light: '#ffffff' },
    });
    res.type('png').set('Cache-Control', 'no-store').send(png);
  } catch (e) {
    res.status(500).send('qr error');
  }
});

const DEFAULT_TEAMS = [
  '江浙沪',
  '两广',
  '川渝',
  '港台',
  '京津冀',
];

const state = {
  teams: {},
  players: {},
  questions: [],
  currentQuestion: null,
  buzzes: [],
  buzzLocked: true,
  phase: 'lobby',
  answeredQuestions: new Set(),
  currentBuzzTeam: null,
  currentBuzzPlayer: null,
  playerScores: {},
  answerShown: false,
};

DEFAULT_TEAMS.forEach(name => ensureTeam(name));

// Load questions
const fs = require('fs');
function loadQuestions() {
  try {
    const data = fs.readFileSync(path.join(__dirname, 'questions.json'), 'utf8');
    state.questions = JSON.parse(data);
  } catch (e) {
    state.questions = [];
  }
}
loadQuestions();

io.on('connection', (socket) => {
  // Player joins
  socket.on('player:join', ({ name, team }) => {
    const cleanName = String(name || '').trim().slice(0, 40);
    let cleanTeam = String(team || '').trim().slice(0, 40);
    if (!cleanName || !cleanTeam) return;

    // Lock players to their team: once a name is on a team they cannot switch
    // by rejoining with a different team. (Only the host may move players.)
    // This also keeps a reconnecting player on their original team.
    const existingTeam = findPlayerTeam(cleanName);
    if (existingTeam && existingTeam !== cleanTeam) {
      cleanTeam = existingTeam;
    }

    state.players[socket.id] = { name: cleanName, team: cleanTeam };
    ensureTeam(cleanTeam);
    if (!state.teams[cleanTeam].members.includes(cleanName)) {
      state.teams[cleanTeam].members.push(cleanName);
    }
    ensurePlayerScore(cleanTeam, cleanName);
    io.emit('state:teams', getTeamsData());
    io.emit('state:players', getPlayersData());
    // Echo back the team they're actually on (may differ from requested).
    socket.emit('player:joined', { name: cleanName, team: cleanTeam });
  });

  // Buzz
  socket.on('player:buzz', () => {
    if (state.buzzLocked) return;
    const player = state.players[socket.id];
    if (!player) return;
    // Check if this team already buzzed
    if (state.buzzes.some(b => b.team === player.team)) return;

    state.buzzes.push({ team: player.team, player: player.name, time: Date.now() });
    state.buzzLocked = true;
    state.currentBuzzTeam = player.team;
    state.currentBuzzPlayer = player.name;
    io.emit('buzz:first', { team: player.team, player: player.name });
    io.emit('buzz:locked');
  });

  // Host controls
  socket.on('host:startGame', () => {
    state.phase = 'board';
    io.emit('state:phase', 'board');
    io.emit('state:board', getBoardData());
  });

  socket.on('host:selectQuestion', ({ id }) => {
    if (state.answeredQuestions.has(id)) return;
    const q = state.questions.find(q => q.id === id);
    if (!q) return;
    state.currentQuestion = q;
    state.phase = 'question';
    state.buzzes = [];
    state.buzzLocked = true;
    state.currentBuzzTeam = null;
    state.currentBuzzPlayer = null;
    state.answerShown = false;
    const opensWithMedia = ['audio', 'video'].includes(q.media?.type);
    // Every question auto-opens buzzing now (not just media ones).
    state.buzzLocked = false;
    io.emit('state:phase', 'question');
    io.emit('state:question', {
      id: q.id,
      label: q.label,
      category: q.category,
      points: q.points,
      text: q.text,
      media: q.media || null,
      answer: q.answer,
      answerMedia: q.answerMedia || null,
    });
    io.emit('buzz:open', {
      reason: opensWithMedia ? 'media' : undefined,
      excludedTeams: getExcludedBuzzTeams(),
    });
  });

  socket.on('host:correct', () => {
    if (!state.currentQuestion || !state.currentBuzzTeam) return;
    const team = state.currentBuzzTeam;
    const player = state.currentBuzzPlayer;
    state.teams[team].score += state.currentQuestion.points;
    addPlayerScore(team, player, state.currentQuestion.points);
    state.buzzLocked = true;
    state.currentBuzzTeam = null;
    state.currentBuzzPlayer = null;
    io.emit('state:teams', getTeamsData());
    io.emit('state:players', getPlayersData());
    io.emit('answer:result', { team, player, correct: true, points: state.currentQuestion.points });
    state.answerShown = true;
    io.emit('state:answer', {
      answer: state.currentQuestion.answer,
      answerMedia: state.currentQuestion.answerMedia || null,
    });
  });

  socket.on('host:wrong', () => {
    if (!state.currentQuestion || !state.currentBuzzTeam) return;
    const team = state.currentBuzzTeam;
    const player = state.currentBuzzPlayer;
    state.teams[team].score -= state.currentQuestion.points;
    addPlayerScore(team, player, -state.currentQuestion.points);
    state.currentBuzzTeam = null;
    state.currentBuzzPlayer = null;
    state.answerShown = false;
    io.emit('state:teams', getTeamsData());
    io.emit('state:players', getPlayersData());
    io.emit('answer:result', { team, player, correct: false, points: -state.currentQuestion.points });
    // Reopen buzzing automatically to ALL teams — including the team that just
    // answered wrong. Clearing state.buzzes drops the exclusion so everyone
    // (the wrong team included) can buzz again without the host re-opening.
    state.buzzes = [];
    state.buzzLocked = false;
    io.emit('buzz:open', { reason: 'allRetry', excludedTeams: [] });
  });

  socket.on('host:skip', () => {
    if (!state.currentQuestion) return;
    finishQuestion();
  });

  socket.on('host:showAnswer', () => {
    if (!state.currentQuestion) return;
    state.answerShown = true;
    io.emit('state:answer', {
      answer: state.currentQuestion.answer,
      answerMedia: state.currentQuestion.answerMedia || null,
    });
  });

  // Host manually stops any media currently playing on the display.
  socket.on('host:stopMedia', () => {
    io.emit('media:stop');
  });

  // Host manually starts / resumes media on the display (e.g. after a buzz
  // auto-paused the audio).
  socket.on('host:startMedia', () => {
    io.emit('media:resume');
  });

  socket.on('host:endGame', () => {
    state.phase = 'end';
    io.emit('state:phase', 'end');
    io.emit('state:final', { teams: getTeamsData(), players: getPlayersData() });
  });

  socket.on('host:resetGame', () => {
    state.answeredQuestions.clear();
    Object.keys(state.teams).forEach(t => { state.teams[t].score = 0; });
    Object.keys(state.playerScores).forEach(key => { state.playerScores[key].score = 0; });
    state.phase = 'board';
    state.currentQuestion = null;
    state.buzzes = [];
    state.buzzLocked = true;
    state.currentBuzzTeam = null;
    state.currentBuzzPlayer = null;
    state.answerShown = false;
    io.emit('state:phase', 'board');
    io.emit('state:board', getBoardData());
    io.emit('state:teams', getTeamsData());
    io.emit('state:players', getPlayersData());
  });

  socket.on('host:reloadQuestions', () => {
    loadQuestions();
    io.emit('state:board', getBoardData());
  });

  socket.on('host:addTeam', ({ name }) => {
    const cleanName = String(name || '').trim().slice(0, 40);
    if (!cleanName || state.teams[cleanName]) return;
    ensureTeam(cleanName);
    broadcastRoster();
  });

  socket.on('host:renameTeam', ({ oldName, newName }) => {
    const cleanOldName = String(oldName || '').trim().slice(0, 40);
    const cleanNewName = String(newName || '').trim().slice(0, 40);
    if (!cleanOldName || !cleanNewName || cleanOldName === cleanNewName || !state.teams[cleanOldName]) return;
    renameTeam(cleanOldName, cleanNewName);
    broadcastRoster();
  });

  socket.on('host:movePlayer', ({ name, fromTeam, toTeam }) => {
    const cleanName = String(name || '').trim().slice(0, 40);
    const cleanFromTeam = String(fromTeam || '').trim().slice(0, 40);
    const cleanToTeam = String(toTeam || '').trim().slice(0, 40);
    if (!cleanName || !cleanFromTeam || !cleanToTeam || cleanFromTeam === cleanToTeam) return;
    movePlayer(cleanName, cleanFromTeam, cleanToTeam);
    broadcastRoster();
  });

  // Request current state (for reconnection)
  socket.on('request:state', () => {
    socket.emit('state:teams', getTeamsData());
    socket.emit('state:players', getPlayersData());
    socket.emit('state:phase', state.phase);
    if (state.phase === 'board') {
      socket.emit('state:board', getBoardData());
    }
    if (state.phase === 'end') {
      socket.emit('state:final', { teams: getTeamsData(), players: getPlayersData() });
    }
    if (state.phase === 'question' && state.currentQuestion) {
      socket.emit('state:question', {
        id: state.currentQuestion.id,
        label: state.currentQuestion.label,
        category: state.currentQuestion.category,
        points: state.currentQuestion.points,
        text: state.currentQuestion.text,
        media: state.currentQuestion.media || null,
        answer: state.currentQuestion.answer,
        answerMedia: state.currentQuestion.answerMedia || null,
      });
      if (state.buzzLocked && state.currentBuzzTeam) {
        socket.emit('buzz:first', { team: state.currentBuzzTeam, player: state.currentBuzzPlayer || '' });
        socket.emit('buzz:locked');
      } else if (!state.buzzLocked) {
        socket.emit('buzz:open', { excludedTeams: getExcludedBuzzTeams() });
      }
      if (state.answerShown) {
        socket.emit('state:answer', {
          answer: state.currentQuestion.answer,
          answerMedia: state.currentQuestion.answerMedia || null,
        });
      }
    }
  });

  socket.on('disconnect', () => {
    delete state.players[socket.id];
  });
});

function ensureTeam(name) {
  if (!state.teams[name]) {
    state.teams[name] = { score: 0, members: [] };
  }
  return state.teams[name];
}

// Which team a player name currently belongs to, or null if not on any team.
function findPlayerTeam(name) {
  for (const [teamName, data] of Object.entries(state.teams)) {
    if (data.members.includes(name)) return teamName;
  }
  return null;
}

function broadcastRoster() {
  io.emit('state:teams', getTeamsData());
  io.emit('state:players', getPlayersData());
}

function renameTeam(oldName, newName) {
  const oldTeam = state.teams[oldName];
  if (!oldTeam) return;
  const targetTeam = ensureTeam(newName);
  targetTeam.score += oldTeam.score;
  oldTeam.members.forEach(member => {
    if (!targetTeam.members.includes(member)) {
      targetTeam.members.push(member);
    }
  });
  delete state.teams[oldName];

  Object.entries(state.players).forEach(([socketId, player]) => {
    if (player.team === oldName) {
      player.team = newName;
      io.to(socketId).emit('player:updated', { name: player.name, team: newName });
    }
  });
  Object.entries(state.playerScores).forEach(([key, playerScore]) => {
    if (playerScore.team !== oldName) return;
    const oldScore = playerScore.score;
    delete state.playerScores[key];
    const movedScore = ensurePlayerScore(newName, playerScore.name);
    movedScore.score += oldScore;
  });
  state.buzzes.forEach(buzz => {
    if (buzz.team === oldName) {
      buzz.team = newName;
    }
  });
  if (state.currentBuzzTeam === oldName) {
    state.currentBuzzTeam = newName;
  }
}

function movePlayer(name, fromTeam, toTeam) {
  if (!state.teams[fromTeam]) return;
  ensureTeam(toTeam);
  state.teams[fromTeam].members = state.teams[fromTeam].members.filter(member => member !== name);
  if (!state.teams[toTeam].members.includes(name)) {
    state.teams[toTeam].members.push(name);
  }
  Object.entries(state.players).forEach(([socketId, player]) => {
    if (player.name === name && player.team === fromTeam) {
      player.team = toTeam;
      io.to(socketId).emit('player:updated', { name: player.name, team: toTeam });
    }
  });
  const oldKey = playerKey(fromTeam, name);
  const oldScore = state.playerScores[oldKey]?.score || 0;
  delete state.playerScores[oldKey];
  const movedScore = ensurePlayerScore(toTeam, name);
  movedScore.score += oldScore;
}

function finishQuestion() {
  state.answeredQuestions.add(state.currentQuestion.id);
  state.phase = 'board';
  state.currentQuestion = null;
  state.currentBuzzTeam = null;
  state.currentBuzzPlayer = null;
  state.answerShown = false;
  io.emit('state:phase', 'board');
  io.emit('state:board', getBoardData());
}

function playerKey(team, name) {
  return `${team}::${name}`;
}

function ensurePlayerScore(team, name) {
  const key = playerKey(team, name);
  if (!state.playerScores[key]) {
    state.playerScores[key] = { name, team, score: 0 };
  }
  return state.playerScores[key];
}

function addPlayerScore(team, name, delta) {
  if (!team || !name) return;
  ensurePlayerScore(team, name).score += delta;
}

function getExcludedBuzzTeams() {
  return state.buzzes.map(buzz => buzz.team);
}

function getTeamsData() {
  return Object.entries(state.teams).map(([name, data]) => ({
    name,
    score: data.score,
    members: data.members,
  })).sort((a, b) => b.score - a.score);
}

function getPlayersData() {
  return Object.values(state.playerScores)
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    .map(player => ({ ...player }));
}

function getBoardData() {
  // Preserve questions.json order within each category (labels a, b, c… follow
  // that order), and keep category order by first appearance.
  const categories = [...new Set(state.questions.map(q => q.category))];
  return categories.map(cat => {
    const qs = state.questions.filter(q => q.category === cat);
    return {
      category: cat,
      questions: qs.map(q => ({
        id: q.id,
        label: q.label,
        points: q.points,
        answered: state.answeredQuestions.has(q.id),
      })),
    };
  });
}

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Local:   http://localhost:${PORT}`);
  console.log(`Network: http://${getLanIp()}:${PORT}`);
  if (process.env.PUBLIC_URL) {
    console.log(`Public:  ${getJoinBaseUrl()}  (tunnel — works on cellular)`);
  }
  console.log(`Players join: ${getPlayerJoinUrl()}`);
});
