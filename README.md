# Potluck Game — Quiz Night

A Jeopardy-style, real-time quiz game for 20–30 players. Built for in-person
potluck parties: a projector shows the board, the host drives the game from a
laptop, and players buzz in from their phones. All game state lives in memory in
a single Node.js + Socket.IO server — no database, no build step.

Bilingual UI (Chinese / English) throughout.

## Features

- Jeopardy-style board with flexible categories and point values
- Real-time buzz-in from mobile phones (first team to buzz locks the rest)
- Host controls game flow: open buzz, judge answers verbally, reveal, skip
- Wrong answers deduct points; remaining teams can steal
- Audio / video / image media on both questions and answers
- Team **and** personal scoreboards, with final rankings
- Scan-to-join QR code on the display (no typing URLs)
- Optional public tunnel (Cloudflare / ngrok) for cellular or flaky venue Wi-Fi

## Quick Start

Requires **Node.js v20+**.

```bash
npm install
npm start
```

The server prints a `Local` and a `Network` URL. Open these (everyone on the
**same Wi-Fi**):

| Role | URL |
|------|-----|
| Projector / Display | `http://<network-ip>:3000/display.html` |
| Host (laptop) | `http://<network-ip>:3000/host.html` |
| Players (phones) | `http://<network-ip>:3000/player.html` |
| Role selector (landing) | `http://<network-ip>:3000/` |

Port 3000 by default; override with `PORT=3001 npm start`.

Players can also just scan the QR code shown on the display to join.

## How a round works

1. Host clicks **Start** to show the board.
2. Host selects a question tile, then **Open Buzz** (audio/video questions open buzz automatically).
3. First team to buzz locks out the others.
4. Host judges the spoken answer:
   - **Correct** → team + player gain points, answer is revealed.
   - **Wrong** → team + player lose points, that team is locked out for this round, remaining teams may buzz. If everyone misses, buzz reopens for all.
5. Host clicks **Show Answer** to reveal answer text/media, then **Board** for the next question.
6. Host clicks **End** for final team and personal rankings.

Scores can go negative. Restarting the server resets the entire game (state is in-memory).

## Questions

Edit `questions.json` — an array of question objects:

```json
{
  "category": "主题名 Topic Name",
  "points": 100,
  "text": "Question text shown on the display",
  "answer": "Answer shown to the host / revealed on display",
  "media": { "type": "audio", "url": "/media/song.m4a" },
  "answerMedia": { "type": "video", "url": "/media/answer.mp4" }
}
```

- `media` / `answerMedia` `type` is one of `image`, `audio`, `video`, or `null` for none.
- `url` is a path under `public/`, so `/media/foo.mp4` → `public/media/foo.mp4`.
- Points per category form the board rows. Categories may have different numbers of questions — the grid is flexible.

The host can reload `questions.json` live (`host:reloadQuestions`) without restarting.

## Media files — IMPORTANT

**Media is NOT stored in git.** `public/media/` is `.gitignore`d (it's hundreds of
MB of copyrighted audio/video clips). After a fresh `git clone` you get all the
code and `questions.json`, but the `public/media/` folder will be **empty**.

The game still runs — questions referencing missing media simply won't show
audio/video. To get a fully playable game you need the media files, and there are
two supported ways:

1. **Out-of-band bundle (the normal path).** The full game is transferred as a
   single `potluck-game-full.zip` (also git-ignored) containing code + questions +
   all media. Copy/AirDrop that to the target machine and unzip it instead of
   cloning. See **[GAMEDAY-SETUP.md](GAMEDAY-SETUP.md)** for the fresh-laptop steps.

2. **Bring your own media.** Drop files into `public/media/` whose names match the
   `url`s in `questions.json` (e.g. `public/media/dafengche.mp4`). Recommended
   formats: images `.jpg/.png/.webp`, audio `.m4a/.mp3`, video `.mp4`.

> There is **no one-command script that rebuilds `public/media/` from a clone.** The
> scripts under `tools/` (`dl.sh`, `dl2.sh`, `match2.py`) document how the original
> clips were sourced from Xiaohongshu links — they are one-off, partial, and depend
> on the (git-ignored) `tools/XHS-Downloader/` checkout and links that may rot. They
> are kept for provenance, not as a reproducible installer. Respect the copyright and
> platform terms of any media you download.

## Public access (cellular / unstable Wi-Fi)

Same-Wi-Fi (`npm start`) is simplest and lowest-latency. If some phones are on
cellular or the venue Wi-Fi is unreliable, run a tunnel instead — it serves a
public HTTPS URL and points the in-game QR at it automatically:

```bash
npm run tunnel          # random https://…trycloudflare.com URL, no account
npm run tunnel:stable   # same ngrok URL every time (needs a free ngrok token)
```

Setup details: **[SETUP-TUNNEL.md](SETUP-TUNNEL.md)**. Note some corporate
networks block tunnels — run from a personal machine / hotspot if so.

## Project layout

| Path | Purpose |
|------|---------|
| `server.js` | Express + Socket.IO server; all game state and the `lobby → board → question → end` state machine |
| `public/display.html` | Projector view — board grid, current question, scoreboard, join QR |
| `public/host.html` | Host control panel — select questions, judge, manage teams |
| `public/player.html` | Mobile buzz interface — join a team, buzz |
| `public/index.html` | Landing / role selector |
| `public/media.js` | Shared `renderMedia()` / `stopMedia()` used by display + host |
| `questions.json` | The question set (see above) |
| `public/media/` | Media assets — **git-ignored**, supplied out-of-band |
| `tools/` | Tunnel scripts, load/integration tests, media-sourcing helpers |

## Further docs

- **[RUNBOOK.md](RUNBOOK.md)** — operational guide: starting, event setup, recovery cheats.
- **[GAMEDAY-SETUP.md](GAMEDAY-SETUP.md)** — fresh-laptop setup from the zip bundle + the 50-connection load test.
- **[SETUP-TUNNEL.md](SETUP-TUNNEL.md)** — stable public URL via an ngrok static domain.
- **[AGENTS.md](AGENTS.md)** — architecture notes for AI coding assistants.

## Tech stack

- Node.js + Express 5 + Socket.IO
- Vanilla HTML/JS + Tailwind CSS (via CDN — venue needs internet for styling)
- `qrcode` for the scan-to-join code
- No database; in-memory state (one live session per server run)
