# Game Day Setup — Personal Laptop

Everything you need to run the quiz on a fresh Mac. The bundle
`potluck-game-full.zip` already contains all code + media + questions, so you do
NOT need git or the media downloader.

## 1. One-time install (do this tonight, needs internet)

1. **Install Node.js** (LTS is fine; v20+). Check it's there:
   ```bash
   node --version
   ```
   If missing: download from https://nodejs.org (or `brew install node`).

2. **Install Homebrew** (only needed for the cloudflared/ngrok tunnels):
   https://brew.sh — paste the one-line install command from that page.

## 2. Unpack the game

1. AirDrop / copy `potluck-game-full.zip` to your personal laptop (e.g. to Downloads).
2. Double-click it to unzip (or `unzip potluck-game-full.zip`). You'll get a
   `potluck-game/` folder.
3. Open Terminal in that folder:
   ```bash
   cd ~/Downloads/potluck-game      # wherever you unzipped it
   ```
4. Install the Node dependencies:
   ```bash
   npm install
   ```

## 3. Run the game — pick ONE way

Only run ONE of these at a time (they all use port 3000).

### A) Same Wi-Fi / phone hotspot — simplest, lowest latency (RECOMMENDED)
```bash
npm start
```
It prints a `Network:` URL like `http://192.168.x.x:3000`. Everyone's phone must
be on the SAME Wi-Fi (or your phone's hotspot). Players open `…:3000/player.html`
or scan the QR on the display.

### B) Cloudflare tunnel — random public URL, works on cellular, no account
```bash
npm run tunnel
```
First run installs `cloudflared` via Homebrew. It prints a
`https://xxxx.trycloudflare.com` URL. Share it / it's in the on-screen QR.
The URL changes each time you restart.

### C) ngrok tunnel — SAME public URL every time (your reserved domain)
```bash
npm run tunnel:stable
```
Your domain (`ruined-alienate-buggy.ngrok-free.dev`) is already saved in
`tools/tunnel.env`. You DO still need to register your ngrok authtoken once on
this laptop:
```bash
ngrok config add-authtoken <YOUR_TOKEN>
```
(Get the token from https://dashboard.ngrok.com — "Your Authtoken".)

> Tunnels only work from a network that allows them. Your COMPANY laptop/network
> blocks tunnels — that's why you're using your personal laptop. If the venue
> Wi-Fi also blocks them, fall back to option **A** on your phone hotspot.

## 4. Open the three screens

- **Projector:** `<url>/display.html`  (shows the board + join QR)
- **Your laptop (host):** `<url>/host.html`  (control panel)
- **Players' phones:** `<url>/player.html`  (or scan the QR)

`<url>` = whatever the chosen command printed (Network URL for A, the https URL for B/C).

Tip: keep the laptop awake & plugged in. To stop a server/tunnel: click that
Terminal and press `Ctrl-C`.

---

# Running the 50-connection load test (optional, before guests arrive)

This stress-tests buzzing with 50 simulated players. Run it BEFORE the event,
then restart the server (the test marks questions answered).

### Local test (buzz logic, no tunnel)
Terminal 1:
```bash
PORT=3000 npm start
```
Terminal 2 (in the same folder):
```bash
PORT=3000 node tools/test-load-buzz.js
```
Expect: `PASS: buzz correct under 50 concurrent connections…`.

### Tunnel test (real network path through cloudflare/ngrok)
Terminal 1 — start behind the tunnel:
```bash
npm run tunnel            # or: npm run tunnel:stable
```
Copy the printed base URL (e.g. `https://xxxx.trycloudflare.com`).

Terminal 2 — point the test at it (must be on a network that can reach the tunnel,
i.e. NOT the company network — personal Wi-Fi or phone hotspot):
```bash
TUNNEL_URL="https://xxxx.trycloudflare.com" node tools/test-tunnel-load.js
```
It reports connect latency, buzz round-trip, and any dropped connections.
Tune it: `PLAYERS=50 ROUNDS=8 TUNNEL_URL="https://…" node tools/test-tunnel-load.js`

### ⚠️ After ANY load test
Restart the server so the board is fresh:
```bash
# Ctrl-C the server, then start it again (npm start / npm run tunnel…)
```

---

# Quick recovery cheats

- **"address already in use" / EADDRINUSE:** another server is still running.
  ```bash
  lsof -ti:3000 | xargs kill
  ```
- **Reset scores/board mid-event:** restart the server (state is in memory).
- **A player got stuck:** they can just reload their page — they auto-rejoin
  their team and can buzz again (no need to re-pick a team).
