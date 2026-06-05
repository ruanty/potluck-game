# Stable public URL (ngrok static domain)

This gives players the **same public link every time** — works over cellular and
any Wi-Fi, no domain purchase, free. The URL only goes live while the server is
running on your laptop (`npm run tunnel:stable`).

> Quick reminder of the three ways to run the game:
> - `npm start` — same Wi-Fi only (fastest, no internet needed)
> - `npm run tunnel` — random public URL, no account (good enough for one night)
> - `npm run tunnel:stable` — **same** public URL every time (this guide)

## One-time setup (≈5 minutes, you must do these — they need a browser)

1. **Create a free ngrok account:** https://dashboard.ngrok.com/signup

2. **Copy your authtoken** from the dashboard home page ("Your Authtoken"), then run:
   ```bash
   ngrok config add-authtoken <PASTE_YOUR_TOKEN>
   ```
   (ngrok is already installed via Homebrew.)

3. **Claim your free static domain:** dashboard → **Domains** → **+ Create Domain**.
   The free plan includes one domain like `your-name.ngrok-free.app`. Copy it.

4. **Save the domain locally** (kept out of git):
   ```bash
   cp tools/tunnel.env.example tools/tunnel.env
   # edit tools/tunnel.env and set:
   #   NGROK_DOMAIN=your-name.ngrok-free.app
   ```

## Running it

```bash
npm run tunnel:stable
```

It prints your fixed `Players join:` URL, starts the server, and points the
in-game QR code at that URL. `Ctrl-C` stops both. `PORT=3001 npm run tunnel:stable`
if 3000 is busy.

## Notes

- **Not 24/7.** The link is live only while this command runs on your laptop. For
  genuine always-on hosting the app would need to run on a cloud server (separate,
  bigger setup — ask if you want it). The game also keeps scores in memory, so any
  restart resets the game; it's built for one live session.
- The free static domain shows a brief ngrok interstitial page to first-time
  visitors on some plans — they just click through once.
