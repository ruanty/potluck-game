# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Running the App

```bash
node server.js
```

Starts on port 3000 (override with `PORT` env var). For public access use `npx ngrok http 3000`.

## Architecture

Single-server real-time quiz game (Jeopardy-style) with Socket.IO. All game state lives in-memory in `server.js` — no database.

**Four client pages** (all in `public/`, all vanilla HTML + Tailwind CDN + inline JS):
- `index.html` — role selector (landing)
- `player.html` — mobile buzz interface (join team, buzz button)
- `host.html` — host control panel (select questions, judge answers, control flow)
- `display.html` — projector/big-screen view (board grid, current question, scoreboard)

**Shared module:** `public/media.js` — `renderMedia(media, opts)` used by display and host pages.

**Server (`server.js`):**
- Express serves static files from `public/`
- Socket.IO handles all real-time communication
- Game state machine: `lobby → board → question → board → ... → end`
- `questions.json` loaded at startup and on `host:reloadQuestions`

## Questions Format

`questions.json` is an array of objects:
```json
{
  "category": "主题名 Topic Name",
  "points": 100,
  "text": "Question text",
  "answer": "Answer (shown to host, revealed on display via Show Answer)",
  "media": { "type": "image|audio|video", "url": "/media/filename" },
  "answerMedia": { "type": "video", "url": "/media/answer.mp4" }
}
```

Media files go in `public/media/`. Points per category form the Jeopardy grid rows (flexible — categories can have different numbers of questions).

## Key Design Decisions

- `answeredQuestions` is a `Set` of `"category::points"` strings for O(1) lookups
- `finishQuestion()` is the single transition that marks a question answered and returns to board phase
- Buzz logic: first team to buzz locks all others; wrong answer deducts points and reopens buzz to remaining teams
- Host judges verbally — no answer-matching logic on server
- Bilingual UI (Chinese/English) throughout
