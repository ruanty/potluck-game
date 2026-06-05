---
name: xiaohongshu-downloader
description: Download Xiaohongshu/RedNote videos or image notes from xiaohongshu.com and xhslink.com links using the local XHS-Downloader checkout.
version: 1.0.0
---

# Xiaohongshu Downloader

Use this skill when the user asks to download Xiaohongshu, RedNote, XHS, or 小红书 videos/images, or provides a `xiaohongshu.com` or `xhslink.com` link and asks to save it locally.

## Tool

The local downloader is installed at:

`/Users/kaiweiwu/Documents/Dev/potluck-game/tools/XHS-Downloader`

Default output directory:

`/Users/kaiweiwu/Documents/Dev/potluck-game/downloads/xiaohongshu`

## Basic Command

Run from the downloader directory:

```bash
uv run main.py --url "<XHS_LINK>" --work_path "/Users/kaiweiwu/Documents/Dev/potluck-game/downloads/xiaohongshu" --language en_US
```

Multiple links can be passed inside the quoted `--url` value separated by spaces.

The first run installs Python dependencies via `uv` (may take a minute). If install fails with a `mirrors.ustc.edu.cn` connection/TLS error, the upstream `pyproject.toml` defaulted to a Chinese PyPI mirror — it has been switched to `https://pypi.org/simple`. To override at runtime: prefix the command with `env UV_INDEX_URL=https://pypi.org/simple`.

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
