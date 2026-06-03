# Quiz Game Runbook

## Current Status

The app is a local Node.js + Socket.IO quiz game. It keeps all game state in memory, so restarting the server resets the game.

Working pages:

- Player: `/player.html`
- Host: `/host.html`
- Display: `/display.html`
- Role selector: `/`

## Start Locally

```bash
npm start
```

Default port is `3000`. If that port is busy:

```bash
PORT=3001 npm start
```

The server prints:

- `Local`: open on the Mac
- `Network`: use this from phones on the same Wi-Fi

Example:

```text
Local: http://localhost:3001
Network: http://192.168.1.132:3001
```

## Event Setup

1. Open `/display.html` on the projector.
2. Open `/host.html` on the host laptop.
3. Ask players to open `/player.html` on phones.
4. Players enter a nickname and choose a team. Preset teams appear as quick-select buttons.
5. Host clicks `Start`, selects a question, then clicks `Open Buzz`.
6. First team to buzz locks the others.
7. If correct, host clicks `Correct`; the team and player gain points, and the answer is shown.
8. If wrong, host clicks `Wrong`; the team and player lose points, that team is locked out for the current buzz round, and the remaining teams can buzz again. If every team gets it wrong, buzz reopens for all teams.
9. Host can click `Show Answer` to reveal answer text and answer media on the display.
10. Host clicks `Back to board / Board` after showing the answer and moves to the next question.
11. Host clicks `End` for final team and personal rankings.

## Questions

Edit `questions.json`. Each question is:

```json
{
  "category": "主题名 Topic Name",
  "points": 100,
  "text": "Question text",
  "answer": "Answer shown by host / display",
  "media": { "type": "image", "url": "/media/example.jpg" },
  "answerMedia": { "type": "video", "url": "/media/answer.mp4" }
}
```

Allowed media types:

- `image`
- `audio`
- `video`

Use `null` when no media is needed.

## Media Files

Put files in:

```text
public/media/
```

Then reference them as:

```json
{ "type": "audio", "url": "/media/song.mp3" }
```

Recommended formats:

- Images: `.jpg`, `.png`, `.webp`
- Audio: `.mp3`, `.m4a`
- Video: `.mp4`

## Public Access

For the simplest free public link, use a tunnel pointed at the running port.

Options:

- `ngrok`: simple, but usually requires login/authtoken.
- `cloudflared`: free temporary tunnel, requires installing `cloudflared`.

If public access is not required, same Wi-Fi access through the printed `Network` URL is simpler and more reliable.

## Notes

- The UI is bilingual Chinese/English.
- Scores can go negative.
- The question board supports flexible category and question counts.
- Audio and video questions open buzz automatically when selected.
- Player phones show final personal and team rankings after the game ends.
- Preset teams are available by default: `江浙沪`, `两广`, `川渝`, `港台`, and `京津冀`.
- The host can add teams, rename teams, and move players between teams from `/host.html`.
- Tailwind CSS loads from CDN, so the venue should have internet access for polished styling.
