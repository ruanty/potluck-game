---
name: xiaohongshu-downloader
description: Download Xiaohongshu/RedNote videos or image notes from xiaohongshu.com and xhslink.com links using the local XHS-Downloader checkout.
version: 1.0.0
---

# Xiaohongshu Downloader

Use this skill when the user asks to download Xiaohongshu, RedNote, XHS, or 小红书 videos/images, or provides a `xiaohongshu.com` or `xhslink.com` link and asks to save it locally.

## Tool

The local downloader is installed at:

`/Users/ruanty/Downloads/Coding_Projects_Vibe/quiz-game/tools/XHS-Downloader`

Default output directory:

`/Users/ruanty/Downloads/Coding_Projects_Vibe/quiz-game/downloads/xiaohongshu`

## Basic Command

Run from the downloader directory:

```bash
uv run main.py --url "<XHS_LINK>" --work_path "/Users/ruanty/Downloads/Coding_Projects_Vibe/quiz-game/downloads/xiaohongshu" --language en_US
```

Multiple links can be passed inside the quoted `--url` value separated by spaces.

## Optional Cookie

Cookie is optional, but the upstream tool notes that downloads without Cookie may be lower resolution. If the user provides a Xiaohongshu web Cookie, pass it with:

```bash
--cookie "<COOKIE>"
```

Do not print cookies back to the user. Do not store cookies unless the user explicitly asks.

## Image Notes

For image posts, use `--index "1 3 5"` to download selected images. Without `--index`, the tool downloads the full note media.

## After Download

Report the saved files or output directory. If the command fails, summarize the error and ask for a fresh link or Cookie only when the error suggests login/risk-control/permission issues.

Respect copyrights and platform terms. Use this only for content the user owns, is authorized to download, or may lawfully save for personal offline use.
