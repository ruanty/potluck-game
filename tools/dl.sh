#!/bin/bash
# Download each XHS link into its own slug folder for clean identification.
set -u
DL="/Users/kaiweiwu/Documents/Dev/potluck-game/tools/XHS-Downloader"
OUT="/Users/kaiweiwu/Documents/Dev/potluck-game/downloads/byslug"
cd "$DL" || exit 1

# slug|url
items=(
"kids-zhihuishu|http://xhslink.com/o/9e7MUCCEv6S"
"kids-kuailexingqiu|http://xhslink.com/o/7IyQMi4k0yu"
"kids-jiayouernv-mid|http://xhslink.com/o/90YUuHgJf1T"
"kids-xiyouji-intro|http://xhslink.com/o/Aos9UEk7um"
"kids-nezha-outro|http://xhslink.com/o/6Hzinbhw7xG"
"kids-yixiu|http://xhslink.com/o/6jimDcKAmlD"
"kids-nezha-intro|http://xhslink.com/o/A8wXzfBu7Mo"
"kids-jiayouernv-outro|http://xhslink.com/o/4wsFPaduuuW"
"kids-dafengche|http://xhslink.com/o/6Rm4LSja1he"
"tv-xinwen-intro|http://xhslink.com/o/7nh3WLitk9t"
"tv-xinwen-outro|http://xhslink.com/o/5JzUix0OKjC"
"tv-tianqi-intro|http://xhslink.com/o/A4ODd81G0LP"
"tv-jiaodian-intro|http://xhslink.com/o/4f65iErPleP"
"tv-chaonv05|http://xhslink.com/o/7MI75Njp7gn"
"ad-yayale|http://xhslink.com/o/AXoIHdgFpYf"
"ad-bubugao|http://xhslink.com/o/4eIlE8Vl61u"
"ad-youlemei|http://xhslink.com/o/7s4AfuZ4mdl"
"ad-hengyuanxiang|http://xhslink.com/o/6zjRMRAwsYg"
"ad-naobaijin|http://xhslink.com/o/97M92S0RXsG"
"red-duige|http://xhslink.com/o/5ltggtyFoZS"
)

for item in "${items[@]}"; do
  slug="${item%%|*}"
  url="${item##*|}"
  echo "=== $slug : $url ==="
  uv run main.py --url "$url" --work_path "$OUT/$slug" --language en_US 2>&1 | tail -2
done
echo "ALL DONE"
find "$OUT" -type f \( -name '*.mp4' -o -name '*.mov' -o -name '*.m4a' -o -name '*.mp3' \) | sort
