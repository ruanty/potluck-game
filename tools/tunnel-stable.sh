#!/bin/bash
# Start the quiz server behind an ngrok STATIC domain, so players always get
# the SAME public URL (no random link, no domain purchase needed).
#
# One-time setup (see SETUP-TUNNEL.md):
#   1. Free account at https://dashboard.ngrok.com
#   2. ngrok config add-authtoken <YOUR_TOKEN>
#   3. Claim your free static domain in the dashboard (Domains → Create)
#   4. Put it in tools/tunnel.env  ->  NGROK_DOMAIN=your-name.ngrok-free.app
#
# Then just:
#   npm run tunnel:stable
set -euo pipefail

PORT="${PORT:-3000}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT/tools/tunnel.env"

# Load NGROK_DOMAIN from tools/tunnel.env if present (untracked, keeps it out of git).
if [ -f "$ENV_FILE" ]; then
  # shellcheck disable=SC1090
  set -a; . "$ENV_FILE"; set +a
fi

if ! command -v ngrok >/dev/null 2>&1; then
  echo "ngrok not found — installing via Homebrew…"
  if command -v brew >/dev/null 2>&1; then brew install ngrok; else
    echo "ERROR: install ngrok manually: https://ngrok.com/download"; exit 1
  fi
fi

if [ -z "${NGROK_DOMAIN:-}" ]; then
  echo "ERROR: NGROK_DOMAIN is not set."
  echo "  Claim your free static domain at https://dashboard.ngrok.com/domains"
  echo "  then add it to tools/tunnel.env:  NGROK_DOMAIN=your-name.ngrok-free.app"
  exit 1
fi

PUBLIC_URL="https://${NGROK_DOMAIN}"

cleanup() {
  [ -n "${NG_PID:-}" ] && kill "$NG_PID" 2>/dev/null || true
  [ -n "${SRV_PID:-}" ] && kill "$SRV_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

echo "Starting ngrok → $PUBLIC_URL (port $PORT) …"
ngrok http "$PORT" --domain "$NGROK_DOMAIN" --log stdout >/tmp/ngrok-quiz.log 2>&1 &
NG_PID=$!

# Wait until ngrok reports the tunnel is established (or fails fast).
for i in $(seq 1 40); do
  grep -q "started tunnel\|url=$PUBLIC_URL" /tmp/ngrok-quiz.log && break
  if ! kill -0 "$NG_PID" 2>/dev/null; then
    echo "ERROR: ngrok exited. Log:"; cat /tmp/ngrok-quiz.log; exit 1
  fi
  sleep 0.5
done

echo ""
echo "============================================================"
echo "  Stable URL:   $PUBLIC_URL"
echo "  Players join: $PUBLIC_URL/player.html"
echo "  Display:      $PUBLIC_URL/display.html"
echo "  Host:         $PUBLIC_URL/host.html"
echo "  (Same URL every time — the in-game QR points here.)"
echo "============================================================"
echo ""

cd "$ROOT"
PUBLIC_URL="$PUBLIC_URL" PORT="$PORT" node server.js &
SRV_PID=$!
wait "$SRV_PID"
