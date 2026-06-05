# Quiz Game 待办事项 TODO

## 题目内容 Questions Content

- [ ] 逐题确认/修改问题文字（`text` 字段）
- [ ] 逐题填写正确答案（目前全部是"待补充"）
- [ ] 确认每题分值是否合理（目前100-900递增）
- [ ] 确认6个主题分类名称是否最终版
- [ ] 确认每个主题的题目数量是否最终版

### 当前6个主题及题目数

| 主题 | 题数 |
|------|------|
| 儿童节目和动画片 Kids Shows & Cartoons | 8 |
| 电视节目 TV Shows | 6 |
| 广告 Slogans | 6 |
| 电视剧偶像剧 TV Dramas | 9 |
| 又红又专 Red Classics | 6 |
| 童年游戏和回忆 Childhood Games & Memories | 5 |

## 媒体文件 Media Files

### 资源来源

- 小红书收藏夹: https://www.xiaohongshu.com/board/6a1c8b6b000000000100a27b?xhsshare=CopyLink&appuid=5b96207357215a0001f7c6fd&apptime=1780457305&share_id=33dc32f926d34d6f98f23c75446e9956

### 下载工具

- XHS-Downloader: https://github.com/JoeanAmier/XHS-Downloader
- 本地路径: `tools/XHS-Downloader/`

### 待办

- [x] 下载全部小红书链接（两批共 32 条，含 YouTube 无间道片段）
- [x] 媒体放入 `public/media/`：音频出题 `.m4a` + 视频揭晓 `.mp4`
- [x] 图片题接入（红领巾/有的人/摩尔庄园/丢手绢/阿鲁巴 题目图；QQ黄钻 答案图）
- [x] 猜名类出题用音频（不剧透），答案揭晓用视频；answer 自动填节目/广告名
- [x] 新增题：电视剧 100 大话西游（纯台词文字题）；童年 600 学校/商场关门歌曲
- [x] 全部 43 题接入完成，本地 HTTP 验证媒体可播放（200）
- [x] 哪吒片头/片尾已是两段不同素材（儿童 500 片尾 nezha-outro，700 片头 nezha）
- [x] 无间道（电视剧 500）：YouTube 第 54–82 秒，音频出题 + 视频揭晓
- [x] 全部答案已填（红领巾、队歌第三句、童年 600 等），无「待补充」
- [x] 题目内容部分全部完成 ✅

## 组设置 Team Setup

- [ ] 确认最终分几组
- [ ] 确认组名（目前预设：江浙沪、两广、川渝、港台、京津冀）
- [ ] 修改 `server.js` 中的 `DEFAULT_TEAMS` 为最终组名

## 网络与部署 Network & Deployment

- [x] 大屏显示扫码加入二维码（QR），自动指向当前加入地址
- [x] 内置公网隧道：`npm run tunnel`（cloudflared，免登录，支持蜂窝/异网加入）
- [x] cloudflared 已安装并端到端测试通过（手机蜂窝可访问公网 player.html）
- [ ] 活动当天选择加入方式：
  - 稳定同一 Wi-Fi → `npm start`（延迟最低，抢答最跟手）
  - Wi-Fi 不稳 / 有人用蜂窝 → `npm run tunnel`
- [ ] 备选：Wi-Fi 太差时，可把笔记本连到**手机热点**，让大家也连同一热点（见下）

## 可选功能 Optional Enhancements

- [x] 加入页面添加 QR 码（扫码直接打开 player.html）
- [ ] 首页 `/index.html` 添加角色选择入口（目前已有但未检查）

## 活动前测试 Pre-event Testing

- [ ] 本地启动 `npm start` 确认能跑
- [ ] 用手机测试加入流程
- [ ] 测试抢答 + 判分流程
- [ ] 测试媒体播放（音频从大屏外放）
- [ ] 测试所有题目走完一遍
- [ ] 测试结束画面排行榜

## 时间线 Timeline

- **Deadline**: 本周末 (2026-06-06/07)
- 需要你提供：答案 + 小红书链接 → 我来处理下载和配置
