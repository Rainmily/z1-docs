# 手机行业日报锚定文档

> 本文档记录手机行业日报的产出进度、关键决策和上下文信息，供后续agent快速了解项目状态。

## Goal
收集最近2小时内的手机行业最新资讯，整合成深度报道并输出到 docs/news/ 目录

## Constraints & Preferences
- rspress只识别 .mdx 文件，不识别 .md
- 文件必须放在 docs/news/ 目录（不是 news/）
- 标题末尾附日期，格式：（X月X日）
- 品牌出现频率≥2次 → 品牌名 + 动态速递
- 所有数据标注精确到小时（YYYY-MM-DD HH:00）
- 重大新闻添加点评和趋势判断
- 配图使用真实产品图片占位符（格式：![](图片URL)）
- 需添加署名用 frontmatter

## Progress
### Done
- 5/21 早报 → docs/news/daily-report-2026-05-21.mdx
- 5/21 晚报 → docs/news/daily-report-2026-05-21-pm.mdx
- 5/23 早报 → docs/news/daily-report-2026-05-23.mdx
- 5/23 上午报 → docs/news/daily-report-2026-05-23-am.mdx
- 5/23 晚报 → docs/news/daily-report-2026-05-23-pm.mdx
- 5/24 早报 → docs/news/daily-report-2026-05-24.mdx
- 5/24 上午报 → docs/news/daily-report-2026-05-24-am.mdx
- 5/24 晚报 → docs/news/daily-report-2026-05-24-pm.mdx
- 5/25 早报 → docs/news/daily-report-2026-05-25.mdx
- 5/25 上午报 → docs/news/daily-report-2026-05-25-am.mdx
- 5/25 晚报 → docs/news/daily-report-2026-05-25-pm.mdx
- 5/26 早报 → docs/news/daily-report-2026-05-26.mdx ✅ 新增

### In Progress
- (none)

### Blocked
- (none)

## Key Decisions
- OPPO Reno16正式售价确认：标准版12+256GB定价3499元/国补后2999元，Pro版12+256GB定价4499元/国补后3999元，5月29日全渠道开售
- 荣耀600系列完整售价确认：超级版12+256GB定价3299元/国补后2799元，Pro版12+256GB定价3899元；四款配色：幸运星、光羽蓝、青苹果、曜石黑
- vivo Y600 Turbo今日发布：9000mAh+90W+骁龙7s Gen4，首销2099元/国补1784元起，5月27日开售
- 星星周格局正式确立：OPPO Reno16（AI键+实况生态+3D悬浮工艺）、荣耀600（护眼屏+全链路4K Live+8600mAh）、vivo S60（3D超声波指纹2.0+单机型爆品）
- vivo S60发布会定档5月29日19:30，田曦薇代言，星星海配色，3D超声波指纹2.0（识别0.1秒，录入1秒），7200mAh+90W，IP68/IP69，5月29日同天开售
- 小米Q1财报今晚19:30揭晓：营收995.6亿元(-10.54%)，净利润同比降近50%，全球出货3380万台(-19%)，中国出货870万台(-35%)
- 长鑫科技IPO明日5月27日上会：Q1营收508亿元(+719%)，净利润247.62亿元，日均盈利近4亿，拟募资295亿元

## Next Steps
- 5/27 长鑫科技科创板IPO上会（国产存储芯片资本化关键节点）
- 5/27 19:30 拼多多Q1财报电话会
- 5/29 vivo S60系列发布会（星星海，田曦薇代言，3D超声波指纹2.0）
- 5/29 OPPO Reno16系列正式开售
- 5/30 华为AgentArts开源增强版发布
- 5/30 20:00 京东618全面开启
- 6/1 华为nova16系列成都发布（时代少年团代言，7000mAh+2亿主摄）
- 6/9 苹果WWDC26（Siri重构，接入Gemini/通义千问）
- 618最佳节点：5/31晚8点开门红（稳妥），6/14-18终极狂欢（最低价）

## Critical Context
- 国内高端市场"一超多强"：苹果iPhone17系列激活3040万台，华为Mate80系列609万台，小米17系列487万台，苹果断层式领先
- 苹果"以价换量"成效显著：线下销量暴涨6-7倍，Counterpoint Q1数据苹果19%份额，华为以20%领跑中国
- 存储涨价背景下全系处理器降级换大电池成行业趋势（骁龙8s Gen4→骁龙7 Gen4/天玑8550）
- 存储芯片"超级牛市"：三星市值突破1万亿美元，SK海力士年内飙升近200%，美光/闪迪刷新历史高点
- 长鑫科技Q1日赚近4亿：营收508亿元(+719%)，净利润247.62亿元，上半年预计净利润500-570亿元(+2244%)
- 荣耀逆势登顶中东智能手机市场第二，Q1出货量暴增73%
- 小米Q1财报今晚揭晓：市场预期净利润同比降近50%，主动收缩低端保利润

## Relevant Files
- /Users/fan/www/AI/z1-docs/docs/news/（日报输出目录）
- /Users/fan/www/AI/z1-docs/rspress.config.ts（sidebar导航配置，需同步更新）
- /Users/fan/www/AI/z1-docs/.github/workflows/daily-report-anchor-summary.md（本锚定文档）
- /Users/fan/www/AI/z1-docs/docs/news/daily-report-2026-05-26.mdx（最新完整日报）
- /Users/fan/www/AI/z1-docs/docs/news/daily-report-2026-05-25-pm.mdx（OPPO Reno16正式售价）
