#!/bin/bash
set -u
DL="/Users/kaiweiwu/Documents/Dev/potluck-game/tools/XHS-Downloader"
cd "$DL" || exit 1
# new links only (slug used only for logging; tool decides output name)
items=(
"tv-tongyishouge-outro|http://xhslink.com/o/5XPdiHvqIs8"
"ad-bolihaitai|http://xhslink.com/o/8R45wv9ELos"
"drama-liuxingyu|http://xhslink.com/o/6vgj6WX3xOS"
"drama-huanzhu-outro|http://xhslink.com/o/3TQib1Amtmz"
"drama-zhenhuan|http://xhslink.com/o/7DrvBYvmSqZ"
"drama-mingzhong|http://xhslink.com/o/HtmZ63W9Bk"
"drama-wokeneng|http://xhslink.com/o/4ZTMNyuJEmV"
"drama-ezuoju|http://xhslink.com/o/15wv4nKplnD"
"drama-liuxinghuayuan|http://xhslink.com/o/RXdvzKAaBm"
"drama-fazheng|http://xhslink.com/o/3Ad4bMRByqg"
"red-qizizhige|http://xhslink.com/o/4NutSoeywBt"
"child-nokia|http://xhslink.com/o/10slwDrpISu"
)
for item in "${items[@]}"; do
  slug="${item%%|*}"; url="${item##*|}"
  echo "=== $slug : $url ==="
  uv run main.py --url "$url" --language en_US 2>&1 | tail -2
done
echo "ALL DONE"
