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

- [ ] 从上述小红书收藏夹中提取每道题对应的视频/音频链接
- [ ] 用 XHS-Downloader 工具下载媒体文件到 `public/media/`
- [ ] 在 `questions.json` 中关联每题的 `media`（出题媒体）
- [ ] 在 `questions.json` 中关联每题的 `answerMedia`（答案媒体，如有）
- [ ] 确认哪些题是音频出题、哪些是视频出题、哪些有答案视频

## 组设置 Team Setup

- [ ] 确认最终分几组
- [ ] 确认组名（目前预设：江浙沪、两广、川渝、港台、京津冀）
- [ ] 修改 `server.js` 中的 `DEFAULT_TEAMS` 为最终组名

## 网络与部署 Network & Deployment

- [ ] 确认活动当天是否所有人在同一 Wi-Fi
  - 同一 Wi-Fi → 直接用局域网 IP，无需额外配置
  - 不同网络 → 需要配置 cloudflared tunnel
- [ ] 活动当天确保 Mac 和所有手机连同一网络
- [ ] 测试网络连通性（手机能访问 Mac 的 IP:3000）

## 可选功能 Optional Enhancements

- [ ] 加入页面添加 QR 码（扫码直接打开 player.html）
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
