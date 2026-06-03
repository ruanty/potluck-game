# Potluck Game - Quiz Night

Jeopardy-style real-time quiz game for 20-30 players. Built for in-person potluck parties with a projector display, host control panel, and mobile buzz-in.

## Features

- Jeopardy-style board with flexible categories and point values
- Real-time buzz-in from mobile phones
- Host controls game flow (open buzz, judge answers, skip)
- Wrong answers deduct points; other teams can steal
- Audio/video/image media support for questions and answers
- Team + personal scoreboards and final rankings
- Bilingual UI (Chinese/English)

## Quick Start

```bash
npm install
npm start
```

Open on the same Wi-Fi:

| Role | URL |
|------|-----|
| Projector/Display | `http://<your-ip>:3000/display.html` |
| Host (laptop) | `http://<your-ip>:3000/host.html` |
| Players (phones) | `http://<your-ip>:3000/player.html` |

## How It Works

1. Host clicks **Start** to show the board
2. Host selects a question tile
3. Players buzz in from their phones
4. Host judges oral answers: **Correct** (+points) or **Wrong** (-points, others can steal)
5. Host clicks **Board** to return and pick next question
6. Host clicks **End** for final rankings

## Questions

Edit `questions.json`. Each question:

```json
{
  "category": "主题名 Topic Name",
  "points": 100,
  "text": "Question text shown on display",
  "answer": "Answer for host/reveal",
  "media": { "type": "audio", "url": "/media/song.mp3" },
  "answerMedia": { "type": "video", "url": "/media/answer.mp4" }
}
```

Media types: `image`, `audio`, `video`, or `null`.

Place media files in `public/media/`.

## Tech Stack

- Node.js + Express + Socket.IO
- Vanilla HTML/JS + Tailwind CSS (CDN)
- No database (in-memory state)
