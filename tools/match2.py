import os, glob, shutil
D = "tools/XHS-Downloader/Volume/Download"
files = glob.glob(os.path.join(D, "*.mp4"))
m = {
 "tv-tongyishouge-outro": "同一首歌",
 "ad-bolihaitai": "68c66905",
 "drama-liuxingyu": "你很拽啊",
 "drama-huanzhu-outro": "你是风儿我是沙",
 "drama-zhenhuan": "华妃",
 "drama-mingzhong": "命中注定我爱你ost",
 "drama-wokeneng": "千年修不来李大仁",
 "drama-ezuoju": "恶作剧之吻",
 "drama-liuxinghuayuan": "DNA又动了",
 "drama-fazheng": "TVB经典主题曲100首049",
 "red-qizizhige": "66436dc4",
 "child-nokia": "诺基亚铃声",
}
rep = []
for slug, tok in m.items():
    cand = [f for f in files if tok in os.path.basename(f)]
    if len(cand) != 1:
        rep.append(f"!! {slug}: {len(cand)} matches -> {[os.path.basename(c) for c in cand]}")
        continue
    shutil.copy2(cand[0], f"public/media/{slug}.mp4")
    rep.append(f"OK {slug}.mp4  <-  {os.path.basename(cand[0])}")
print("\n".join(rep))
