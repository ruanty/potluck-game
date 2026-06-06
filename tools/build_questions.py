import json, os

def aud(slug): return {"type": "audio", "url": f"/media/{slug}.m4a"}
def vid(slug): return {"type": "video", "url": f"/media/{slug}.mp4"}
def img(fn):   return {"type": "image", "url": f"/media/{fn}"}

KIDS = "儿童节目和动画片 Kids Shows & Cartoons"
TV = "电视节目 TV Shows"
AD = "广告 Slogans"
DRAMA = "电视剧偶像剧 TV Dramas"
RED = "又红又专 Red Classics"
CHILD = "童年游戏和回忆 Childhood Games & Memories"

P_KIDS = "🎵 听音频，说出节目名称 / Listen and name this show"
P_TV = "🎵 听音频，说出是什么节目 / Name this TV program"
P_AD = "🗣️ 听上句，接下句 / Hear the line, finish the slogan"
P_DRAMA = "🎬 听台词 / OST，说出剧名 / Name this drama"

# guess-the-name: audio question + video reveal
def g(cat, pts, prompt, answer, slug):
    return {"category": cat, "points": pts, "text": prompt, "answer": answer,
            "media": aud(slug), "answerMedia": vid(slug)}

# generic entry with explicit fields
def q(cat, pts, text, answer, media=None, answerMedia=None):
    return {"category": cat, "points": pts, "text": text, "answer": answer,
            "media": media, "answerMedia": answerMedia}

DAHUA = ("曾经有一份真挚的爱情摆在我的面前，我没有珍惜，等我失去的时候才后悔莫及，"
         "人间最痛苦的事莫过于此。如果上天能给我一次再来一次的机会，我会对那个女孩说三个字："
         "我爱你。如果非要在这份爱上加上一个期限，我希望是……一万年")

Q = [
    # KIDS (9)
    g(KIDS, 100, P_KIDS, "智慧树 / Tree of Wisdom", "zhihuishu"),
    g(KIDS, 200, P_KIDS, "快乐星球 / Happy Planet", "kuailexingqiu"),
    g(KIDS, 300, P_KIDS, "家有儿女（中间转场）/ Home with Kids (transition)", "jiayouernv-mid"),
    g(KIDS, 400, P_KIDS, "西游记 片头（云宫迅音）/ Journey to the West — opening", "xiyouji-intro"),
    g(KIDS, 500, P_KIDS, "哪吒传奇 片尾 / The Legend of Nezha — ending", "nezha-outro"),
    g(KIDS, 600, P_KIDS, "聪明的一休 / Ikkyū-san (Smart Ikkyu)", "yixiu"),
    g(KIDS, 700, P_KIDS, "哪吒传奇 片头（小英雄哪吒）/ The Legend of Nezha — opening", "nezha"),
    g(KIDS, 800, P_KIDS, "家有儿女 片尾 / Home with Kids — ending", "jiayouernv-outro"),
    g(KIDS, 900, P_KIDS, "大风车 / Big Pinwheel (Da Feng Che)", "dafengche"),
    # TV (6)
    g(TV, 100, P_TV, "新闻联播 片头 / Xinwen Lianbo (CCTV News) — opening", "xinwen-intro"),
    g(TV, 200, P_TV, "新闻联播 片尾（重逢 Together Again）/ CCTV News — ending", "xinwen-outro"),
    g(TV, 300, P_TV, "天气预报 片尾 / Weather Forecast — ending", "tianqi-intro"),
    g(TV, 400, P_TV, "同一首歌 片尾 / Tong Yi Shou Ge (“Same Song”) — ending", "tv-tongyishouge-outro"),
    g(TV, 500, P_TV, "焦点访谈 片头 / Jiaodian Fangtan (Focus) — opening", "jiaodian-intro"),
    g(TV, 600, P_TV, "2005 超级女声 主题曲《想唱就唱》/ 2005 Super Girl theme “Sing If You Want”", "chaonv05"),
    # SLOGANS (6)
    g(AD, 100, P_AD, "牙牙乐 / Yayale (toothpaste)", "yayale"),
    g(AD, 200, P_AD, "波力海苔 / Bolo Seaweed", "ad-bolihaitai"),
    g(AD, 300, P_AD, "步步高音乐手机 / BBK Music Phone", "bubugao"),
    g(AD, 400, P_AD, "优乐美奶茶 / U.Loveit Milk Tea", "youlemei"),
    g(AD, 500, P_AD, "恒源祥 / Hengyuanxiang", "hengyuanxiang"),
    g(AD, 600, P_AD, "脑白金 / Naobaijin (Brain Platinum)", "naobaijin"),
    # DRAMAS (10) — 大话西游 is text台词 (no media); 无间道 audio-only (no video reveal)
    q(DRAMA, 100, "🎬 听台词，说出剧名 / Name this drama:\n\n" + DAHUA, "大话西游 / A Chinese Odyssey"),
    g(DRAMA, 200, P_DRAMA, "一起来看流星雨 / Let's Watch the Meteor Shower", "drama-liuxingyu"),
    g(DRAMA, 300, P_DRAMA, "还珠格格 片尾（你是风儿我是沙）/ My Fair Princess — ending", "drama-huanzhu-outro"),
    g(DRAMA, 400, P_DRAMA, "甄嬛传 / Empresses in the Palace", "drama-zhenhuan"),
    q(DRAMA, 500, P_DRAMA, "无间道 / Infernal Affairs", media=aud("drama-wujiandao"), answerMedia=vid("drama-wujiandao")),
    g(DRAMA, 600, P_DRAMA, "命中注定我爱你 OST / Fated to Love You OST", "drama-mingzhong"),
    g(DRAMA, 700, P_DRAMA, "我可能不会爱你 OST / In Time with You OST", "drama-wokeneng"),
    g(DRAMA, 800, P_DRAMA, "恶作剧之吻 OST / It Started with a Kiss OST", "drama-ezuoju"),
    g(DRAMA, 900, P_DRAMA, "流星花园 / Meteor Garden", "drama-liuxinghuayuan"),
    g(DRAMA, 1000, P_DRAMA, "法证先锋 OST / Forensic Heroes OST", "drama-fazheng"),
    # RED CLASSICS (6)
    q(RED, 100, "红领巾为什么是红色的？/ Why is the red scarf red?",
      "它代表红旗的一角，象征革命先烈的鲜血染红了革命旗帜 / "
      "It is a corner of the red flag — symbolizing the blood of revolutionary martyrs",
      media=img("red-honglingjin-q.jpg")),
    q(RED, 200, "🎵 播放《少先队队歌》，唱出 / 说出第三句歌词 / "
      "Play the Young Pioneers anthem — sing or say the third line",
      "爱祖国爱人民 / “Love the motherland, love the people”",
      media=aud("shaoxiandui"), answerMedia=vid("shaoxiandui")),
    g(RED, 300, "🎵 听音频，说出歌名 / Name this song", "七子之歌 / Song of the Seven Sons", "red-qizizhige"),
    q(RED, 400, "说出 3 套中小学生广播体操 / Name 3 sets of school radio calisthenics",
      "如：第三套《七彩阳光》《希望风帆》《舞动青春》《放飞理想》；"
      "第二套《初升的太阳》《雏鹰起飞》《青春的活力》《时代在召唤》/ "
      "e.g. 3rd set: Colorful Sunshine, Sail of Hope, Dancing Youth, Flying Dreams"),
    q(RED, 500, "说出 4 个眼保健操的环节并做对姿势 / "
      "Name 4 steps of the eye exercises and do them correctly",
      "揉天应穴、挤按睛明穴、按揉四白穴、按太阳穴轮刮眼眶 / "
      "Press the Tianying, Jingming, Sibai and Taiyang acupoints"),
    q(RED, 600, "《有的人》描述的是谁？/ Who is the poem “Some People” about?",
      "鲁迅 / Lu Xun", media=img("red-youderen-q.jpeg")),
    # CHILDHOOD (6)
    q(CHILD, 100, "摩尔庄园里的宠物是什么？/ What is the pet in Mole's World?",
      "拉姆 / Lambo", media=img("child-moer-q.jpeg")),
    q(CHILD, 200, "QQ 空间的「钻」是什么？/ What is the QZone “diamond”?",
      "黄钻 / Yellow Diamond", answerMedia=img("child-qq-a.jpeg")),
    q(CHILD, 300, "丢手绢，丢手绢，下一句是什么？/ “Drop the handkerchief…” — what's the next line?",
      "轻轻地放在小朋友的后面 / “gently place it behind a friend”",
      media=img("child-diushoujuan-q.png")),
    q(CHILD, 400, "看图，说出这个童年游戏/动作 / Look at the picture — name this childhood game/behavior", "阿鲁巴 / Aluba",
      media=img("child-aluba-q.jpg")),
    g(CHILD, 500, "🎵 听铃声，说出是什么 / Name this ringtone", "诺基亚铃声 / Nokia ringtone", "child-nokia"),
    q(CHILD, 600, "🎵 听音频：什么情况下会放这首歌？/ When is this song (《回家》) usually played?",
      "学校 / 商场关门 / 飞机到达 / When a school or mall is closing, or a plane lands",
      media=aud("child-huijia")),
]

# sanity: every referenced media file must exist
missing = []
for item in Q:
    for k in ("media", "answerMedia"):
        mm = item[k]
        if mm and not os.path.exists("public" + mm["url"]):
            missing.append((item["category"].split()[0], item["points"], k, mm["url"]))
if missing:
    print("MISSING FILES:")
    for x in missing:
        print("  ", x)
    raise SystemExit(1)

json.dump(Q, open("questions.json", "w"), ensure_ascii=False, indent=2)
print(f"wrote {len(Q)} questions, all media files present")
