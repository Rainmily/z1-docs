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
- 5/26 早报 → docs/news/daily-report-2026-05-26.mdx
- 5/26 晚报 → docs/news/daily-report-2026-05-26-pm.mdx
- 5/27 早报 → docs/news/daily-report-2026-05-27.mdx
- 5/27 晚报 → docs/news/daily-report-2026-05-27-pm.mdx
- 5/28 早报 → docs/news/daily-report-2026-05-28.mdx ✅
- 5/28 上午报 → docs/news/daily-report-2026-05-28-am.mdx ✅
- 5/28 晚报 → docs/news/daily-report-2026-05-28-pm.mdx ✅
- 5/29 早报 → docs/news/daily-report-2026-05-29.mdx ✅
- 5/29 上午报 → docs/news/daily-report-2026-05-29-am.mdx ✅ 新增
- 5/29 晚报 → docs/news/daily-report-2026-05-29-pm.mdx ✅ 新增
- 6/4 早报 → docs/news/daily-report-2026-06-04.mdx ✅ 新增
- 6/7 早报 → docs/news/daily-report-2026-06-07.mdx ✅ 新增
- 6/8 早报 → docs/news/daily-report-2026-06-08.mdx ✅ 新增
- 6/9 早报 → docs/news/daily-report-2026-06-09.mdx ✅ 新增（WWDC26+iOS 27发布）

### In Progress
- (none)

### Blocked
- (none)

## Key Decisions
- OPPO Reno16正式售价确认：标准版12+256GB定价3499元/国补后2999元，Pro版12+256GB定价4499元/国补后3999元，5月29日全渠道开售
- 荣耀600系列完整售价确认：超级版12+256GB定价3299元/国补后2799元，Pro版12+256GB定价3899元
- 星星周格局正式确立：OPPO Reno16（AI键+实况生态+3D悬浮工艺）、荣耀600（护眼屏+全链路4K Live+8600mAh）、vivo S60（3D超声波指纹2.0）
- vivo S60发布会定档5月29日19:30，田曦薇代言，星星海配色，3D超声波指纹2.0（识别0.1秒，录入1秒），7200mAh+90W，IP68/IP69，同天开售
- 荣耀WIN Turbo定档5月29日15:00发布+开售：10000mAh青海湖电池+80W快充+天玑8500 Elite（安兔兔240万分）+无主动散热风扇，27W反向充电
- 小米Q1财报5月26日17:30正式发布：营收991亿元(-10.9%)，经调整净利润61亿元(-43.1%)，手机ASP 1310元创历史新高，出货3380万台
- 长鑫科技IPO过会（5月27日17:05通过，科创板史上第二大IPO，募资295亿元）
- vivo Y600 Turbo 5月27日10:00正式开售：8+256GB首销2099元/国补1784元，12+256GB首销2399元/国补2039元，12+512GB首销2699元/国补2294元
- IDC下调2026年全球手机出货量预测至10.9亿部（-13.9%），降幅创年度最大；ASP将达550美元创历史新高；换机周期42个月
- 618价格战全面白热化：华为Mate X6降3500元（跌破万元），小米15 Ultra直降2700元至3799元，iQOO 15降1000元，OPPO Find X9 Pro降1289元
- 小米澎湃OS 4定档7月，采用Rust语言重写核心代码移除MIUI冗余；MiMo API永久降价99%；三项自研大会师（芯片+OS+AI）年内落地
- 苹果折叠屏iPhone保护壳上架（iFunSmart），横置双摄+5.3吋外屏+7.7吋内屏+A20 Pro 2nm+C2自研基带，起售价14999元，9月发布10月开售；最新确认：折叠屏方案采用三星显示+Fine M-Tec铰链，放弃自研方案，下半年量产，起售价不低于2000美元
- 华为音频首超苹果登顶国内销售额榜首：销售额份额26%（苹果25%），连续32个月销量第一
- 开源鸿蒙开发者大会2026：社区代码突破1.4亿行，兼容性测评产品突破1800款，贡献者超1.3万人，OpenHarmony 6.1 LTS预发布
- iPhone 17系列中国销量突破3000万台（截至第20周3040.55万台），Pro Max单型号占1320万台（43%），顶配版销量占比近半显示高端购机能力依然强悍
- 小米17T系列海外发布：标准版749欧元/天玑8500-Ultra/6500mAh/67W/徕卡三摄，Pro版899欧元/天玑9500/6.83吋144Hz/7000mAh/100W+50W无线/5倍潜望徕卡三摄
- 小米澎湃OS 3推送毕业季更新：新增毕业季限时水印，修复笔记/录音机/家人守护/时钟多项BUG
- 荣耀Robot Phone新进展：Q3发布/预计8月登场，隐藏式机械臂云台是核心（CIPA 5.5级防抖），360°旋转追踪+全自动构图
- 三星One UI 8.5视频显示异常问题（Galaxy S24/S25），One UI 9 Beta无法侧载APK
- Omdia：2026Q1非洲手机出货1990万部(+3%)，预计全年下滑28%；传音47%稳第一，荣耀+101%增速最快，小米-28%
- 国产折叠屏密集发布窗口期：6/24荣耀Magic V5（8.8mm全球最薄）、6/24小米MIX Flip2、7/2 vivo X Fold5（6000mAh），均强调打破苹果生态壁垒
- 华为何庭波确认秋季麒麟9030芯片发布：性能等"跳跃性"提升，首个完整"韬光养晦芯片"，华为秋季新机将成重磅旗舰
- 苹果iOS 27引入Gemini蒸馏本地训练（基于Gemini训练轻量端侧AI模型），部分Siri请求转至Google Cloud，采用NVIDIA机密计算技术
- 小米17T系列首次回国：卢伟冰确认6月上旬发布，全新发布会形式+年轻主讲人，本地化调整后更适合国内用户
- 华为Mate 80 Pro Max降至6999元（16+512GB，原价7999元），比iPhone 17 Pro Max 256GB（8999元）便宜1800元且存储翻倍，迎战618

## Next Steps
- [x] 5/29 15:00 荣耀WIN Turbo发布+开售（10000mAh+天玑8500 Elite）
- [x] 5/29 19:30 vivo S60系列发布会（星星海配色，田曦薇代言）
- [x] 5/29 OPPO Reno16系列正式开售（国补后2999元起）
- [ ] 5/30 华为AgentArts开源增强版发布
- [ ] 5/30 20:00 京东618全面开启
- [ ] 6/1 华为nova16系列成都发布（时代少年团代言，7000mAh+2亿主摄）
- [ ] 6/9 苹果WWDC26（Siri重构，Gemini/通义千问接入）
- [ ] 6/24 荣耀Magic V5发布（折叠态8.8mm，全球最薄）
- [ ] 6/24 小米MIX Flip2发布（小折叠）
- [ ] 7/2 vivo X Fold5发布（大折叠，6000mAh蓝海电池）
- [ ] 618最佳节点：5/31晚8点（稳妥），6月14-18日（最低价预期）

## Critical Context
- 长鑫科技Q1营收508亿元(+719%)，归母净利润247.62亿元，日均盈利超2.75亿元，上半年预计净利润500-570亿元(+2244%)
- 小米Q1财报：营收991亿元(-10.9%)，经调净利61亿元(-43.1%)，ASP 1310元创历史新高(+8.2%)，研发投入90亿元(+33.4%)；汽车交付80856辆，经营亏损31亿元，毛利率20.1%
- 618价格战已开打：苹果5秒破亿、全天成交15亿+；华为同比增长100%；荣耀同比增长120%；vivo/iQOO同比增长100%；5G手机销量环比11.11首日增长14倍
- 存储涨价悖论持续：OPPO Reno16顶配涨1000元，荣耀600超级版涨600元，618旧品逆势降价
- 存储芯片超级周期：DDR4 16Gb 2026年5月现货价61-63美元（年内涨幅仍超600%），供小于求格局持续至2027年上半年
- vivo Y600 Pro同步开售（10200mAh耐低温电池，1999元起）
- IDC数据：2026年Q1中国智能手机出货量约6904万台（同比-3.3%），Q1华为市场份额20%领跑，苹果19%紧随其后
- Counterpoint数据：2026年五一假期中国智能手机销量同比下降16%，小米Q1份额12%排名第六（同比-35%）
- 5月31日vivo S60系列发布后，星星周正式收官
- iPhone 17中国销量截至第20周已破3000万台（3040.55万台），Pro Max单型号1320万台占43%，顶配高端消费力依然强悍
- 苹果折叠屏iPhone确认采用三星折叠屏+Fine M-Tec铰链，放弃自研，下半年量产，起售价2000美元（约14359元）
- Omdia数据：2026Q1非洲出货1990万部(+3%)，传音47%稳第一，荣耀+101%增速最快，小米-28%；全年预计下滑28%
- 国产折叠屏密集发布窗口期：6/24荣耀Magic V5（8.8mm全球最薄，217g全球最轻大折叠之一）、6/24小米MIX Flip2、7/2 vivo X Fold5（折叠厚9.2mm，支持-20℃）

## Relevant Files
- /Users/fan/www/AI/z1-docs/docs/news/（日报输出目录）
- /Users/fan/www/AI/z1-docs/rspress.config.ts（sidebar导航配置）
- /Users/fan/www/AI/z1-docs/.github/workflows/daily-report-anchor-summary.md（本锚定文档）
- /Users/fan/www/AI/z1-docs/docs/news/daily-report-2026-05-28.mdx（今日早报）
- /Users/fan/www/AI/z1-docs/docs/news/daily-report-2026-05-28-am.mdx（今日上午报）
- /Users/fan/www/AI/z1-docs/docs/news/daily-report-2026-05-28-pm.mdx（今日晚报：618价格战白热化+IDC下调预测）
- /Users/fan/www/AI/z1-docs/docs/news/daily-report-2026-05-27-pm.mdx（长鑫IPO过会完整报道）
- /Users/fan/www/AI/z1-docs/docs/news/daily-report-2026-05-26-pm.mdx（小米Q1财报完整分析）
- /Users/fan/www/AI/z1-docs/docs/news/daily-report-2026-05-26.mdx（vivo Y600 Turbo发布详细数据）
- /Users/fan/www/AI/z1-docs/docs/news/daily-report-2026-05-25-pm.mdx（OPPO Reno16正式售价）
- /Users/fan/www/AI/z1-docs/docs/news/daily-report-2026-05-29.mdx（星星周收官：vivo S60发布+OPPO Reno16开售+荣耀WIN Turbo发布+iPhone 17中国破3000万台）
- /Users/fan/www/AI/z1-docs/docs/news/daily-report-2026-05-29-am.mdx（618价格战分析+华为麒麟9030预告+小米T系列回国+苹果iOS 27 AI策略）