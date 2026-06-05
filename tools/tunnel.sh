#!/bin/bash
# Start the quiz server behind a free cloudflared tunnel so players can join
# from cellular / any network (not just the same Wi-Fi).
#
#   npm run tunnel          # default port 3000
#   PORT=3001 npm run tunnel
#
# Prints a public https URL and points the in-game QR code at it.
set -euo pipefail

PORT="${PORT:-3000}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LOG="$(mktemp -t cf-tunnel).log"

# 1. Ensure cloudflared is installed.
if ! command -v cloudflared >/dev/null 2>&1; then
  echo "cloudflared not found — installing via Homebrew…"
  if command -v brew >/dev/null 2>&1; then
    brew install cloudflared
  else
    echo "ERROR: Homebrew not found. Install cloudflared manually:"
    echo "  https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/"
    exit 1
  fi
fi

cleanup() {
  [ -n "${CF_PID:-}" ] && kill "$CF_PID" 2>/dev/null || true
  [ -n "${SRV_PID:-}" ] && kill "$SRV_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

# 2. Start the tunnel pointed at the local server port.
echo "Starting cloudflared tunnel → http://localhost:$PORT …"
cloudflared tunnel --url "http://localhost:$PORT" >"$LOG" 2>&1 &
CF_PID=$!

# 3. Wait for the public URL to appear in the log (up to ~30s).
PUBLIC_URL=""
for i in $(seq 1 60); do
  PUBLIC_URL="$(grep -Eo 'https://[a-z0-9-]+\.trycloudflare\.com' "$LOG" | head -1 || true)"
  [ -n "$PUBLIC_URL" ] && break
  if ! kill -0 "$CF_PID" 2>/dev/null; then
    echo "ERROR: cloudflared exited. Log:"; cat "$LOG"; exit 1
  fi
  sleep 0.5
done

if [ -z "$PUBLIC_URL" ]; then
  echo "ERROR: could not get a tunnel URL within 30s. Log:"; cat "$LOG"; exit 1
fi

echo ""
echo "============================================================"
echo "  Public URL:   $PUBLIC_URL"
echo "  Players join: $PUBLIC_URL/player.html"
echo "  Display:      $PUBLIC_URL/display.html"
echo "  Host:         $PUBLIC_URL/host.html"
echo "  (The in-game QR code now points here.)"
echo "============================================================"
echo ""

# 4. Start the server with PUBLIC_URL so /qr and /join-url use the tunnel.
cd "$ROOT"
PUBLIC_URL="$PUBLIC_URL" PORT="$PORT" node server.js &
SRV_PID=$!
wait "$SRV_PID"
