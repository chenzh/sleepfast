# Sleepfast 完整执行计划（V1）

## 1. 项目目标
Sleepfast 的目标不是继续做一个更好看的单页，而是尽快形成一个可以持续获客、承接转化、并逐步建立付费能力的英文助眠网站。

项目总目标：

**首页负责转化，工具页负责获客，premium 负责商业闭环。**

---

## 2. 当前判断

### 2.1 当前最核心的目标用户
Sleepfast 当前最该服务的人群是：

**今晚就想更快睡着、最好立刻能用、最好不用下载 App 的英文用户。**

这类用户的共同特点：
- 搜索意图强
- 不愿学习复杂产品
- 不想先下载 App
- 更在意今晚有没有帮助，而不是长期监测

### 2.2 当前最大短板
当前最大的不足不是首页不够美，而是：
- 结果定位还不够硬
- SEO 工具页矩阵还没真正上线
- Premium 权益还不够清晰

### 2.3 当前阶段的核心原则
1. 不再无限打磨首页微观视觉
2. 优先补获客入口与结果导向表达
3. 每次只推进一个最短闭环任务
4. 所有页面都必须可用，不做纯内容空页

---

## 3. 总体推进路线

### Phase 1：首页转化收口
目标：让冷流量更快懂、更快点、更快开始体验。

本阶段重点：
- 保持当前超艺术化首页方向
- 补更清楚的结果定位线索
- 收口 premium 提示语
- 确保首页首屏体验闭环稳定

完成标准：
- 用户 3 秒内知道这是助眠工具
- 用户 1 屏内能开始播放
- 用户知道这不是普通环境音页

---

### Phase 2：高意图 SEO 工具页上线
目标：尽快从“一个首页”变成“一个可获客的网站”。

第一批优先页面：
1. `/white-noise-for-sleep`
2. `/brown-noise-for-sleep`
3. `/sleep-calculator`
4. `/fall-asleep-fast`

这些页面的统一要求：
- 每页只打一个核心关键词
- 首屏附近必须直接可用
- 必须能回流首页 / 留资 / premium
- 内容只做必要解释，不写成长博客

完成标准：
- 每页有独立 URL
- 每页有可用工具模块
- 每页有明确 CTA 回流主产品

---

### Phase 3：问题场景页补齐
目标：覆盖更强转化意图的人群。

优先页面：
1. `/mind-racing-at-night`
2. `/wake-up-at-3am`
3. `/sleep-better-tonight`

这些页面的核心不是泛内容，而是：
- 问题解释
- 对应体验
- 对应建议
- 对应 CTA

完成标准：
- 问题导向关键词有承接页
- 页面内体验与问题场景强绑定
- 用户能自然回流首页或 premium

---

### Phase 4：Premium 价值收口
目标：让付费不是一句轻提示，而是清晰升级理由。

第一阶段需要明确的 premium 权益：
- longer overnight playback
- night waking restart mode
- more targeted sleep presets
- smoother transitions / routines
- future personalized recommendations

完成标准：
- 首页与工具页都能看懂 premium 升级价值
- 免费版与 premium 差异清楚
- 不是只写“更好”，而是写“为什么值得付费”

---

## 4. 工程与页面优先级

### 第一优先级：最快产出流量入口
- white-noise-for-sleep
- brown-noise-for-sleep
- sleep-calculator

原因：
- 搜索意图强
- 技术成本低
- 可直接复用现有播放器能力

### 第二优先级：贴近场景转化
- fall-asleep-fast
- wake-up-at-3am
- mind-racing-at-night

原因：
- 更贴近具体问题
- 更适合引导 premium 与 email 留资

### 第三优先级：补扩展工具
- nap-calculator（已上线首版）
- jet-lag-calculator
- sleep-breathing-exercise

原因：
- 有增长价值
- 但不是最短收入/流量闭环

---

## 5. 每小时 15 分自动推进规则
每次自动推进不是做“大版本”，而是只做一个可验证的小闭环。

### 单次运行固定流程
1. 读取以下文件确认当前状态：
   - `docs/execution-plan.md`
   - `docs/target-user-analysis.md`
   - `docs/seo-tool-pages-plan.md`
   - `src/App.tsx`
   - `src/styles.css`
2. 判断当前最高优先级未完成任务
3. 只推进一个 15 分钟内能收口的小任务
4. 若有代码改动：
   - 本地构建验证
   - 如果是用户可见变更则重新部署
   - 用正式域名带时间戳验证
5. 更新相关文档与工作日志
6. 若有真实进展则 git commit 并 push

### 自动推进时的禁止事项
- 不做无止境 UI 微调
- 不在没有闭环的情况下大改方向
- 不做需要老板拍板的新立项
- 不重复构建/重复部署无变化版本

---

## 6. 15 分钟切片任务池
自动任务每次应从下列池子里挑一个“最高优先级 + 最容易收口”的任务。

### A. 首页收口任务池
- 增加更清楚的结果导向副文案
- 收口 premium 一句话权益表达
- 弱化不必要的控件或按钮存在感
- 调整回流 CTA 的位置与语言

### B. 工具页建设任务池
- 建一个新工具页路由
- 复用现有播放器能力接入页面
- 写该工具页的简短解释文案
- 增加 FAQ
- 增加首页回流 CTA

### D+. 播放体验收口任务池
- 定时结束淡出而非硬停
- 主声音切换时减少突兀中断
- 冥想/夜醒场景预设更贴合对应 timer
- 最近播放 / 收藏入口补最小可用闭环

### C. 站点结构任务池
- 加页面间内链
- 加元信息 / 标题 / 描述
- 补简单 SEO 结构
- 整理 premium 说明区

### D. 验证与发布任务池
- 构建验证
- Cloudflare Pages 重新部署
- 正式域名带时间戳验证
- git 提交与 push

---

## 7. 当前建议执行顺序
当前直接按下面顺序推进：

1. 首页补一层更明确的结果定位
2. 上线 `white-noise-for-sleep`
3. 上线 `brown-noise-for-sleep`
4. 上线 `sleep-calculator`
5. 上线 `fall-asleep-fast`
6. 收口 premium 权益表达
7. 上线 `wake-up-at-3am`
8. 上线 `mind-racing-at-night`

---

## 8. 成功指标
现阶段只盯 4 个指标：
- 首页播放启动率
- 工具页自然流量
- 工具页到首页点击率
- 留资 / premium 点击率

如果一个动作不能改善这几个指标中的至少一个，就不应该优先做。

---

## 9. 当前执行原则总结
Sleepfast 现在不缺继续雕首页的审美能力，缺的是把首页变成业务入口，把工具页变成流量入口，把 premium 变成收入入口。

因此后续推进一律按这个标准判断：

**是否让网站更容易拿流量、承接体验、形成转化。**

## 10. 最新推进记录
- 2026-06-03：把收藏 / 最近播放闭环补到 `/mind-racing-at-night`。当前用户可在 racing thoughts 场景页直接保存当前 brown / white noise，并从同页一键重播最近或收藏过的声音，减少“思绪停不下时还要回首页找常用声音”的断点。
- 验证结果：待本次 `npm run build`、Cloudflare Pages production 部署与正式域名核验，确认 `/mind-racing-at-night` 出现 `Save this sound`、Saved for later 与 Recent tonight。
- 2026-06-03：把收藏 / 最近播放闭环从首页和单声音工具页扩到 `/fall-asleep-fast` 与 `/wake-up-at-3am`。用户现在可在问题场景页直接保存当前声音，并从同页一键重播最近或收藏过的声音，减少“问题词落地后还要回首页找常用声音”的断点。
- 2026-06-02：首页首屏动态背景改为随当前声音切换场景，不再固定海浪。Rain on Window 进入雨夜窗景，Ocean Waves 保持海面，Brown / White Noise 切到更克制的深空层，首屏视听绑定更接近 PRD 的“场景化唯美动态视频背景系统”。
- 验证结果：已完成 `npm run build`，并通过 Cloudflare Pages 部署到 `https://master.sleepfast.pages.dev`。浏览器快照已确认首屏默认文案与当前声音为 `Rain on Window`，用于收口首页“声音-视觉”一致性。
- 2026-06-02：补上首页播放器的组合音效最小闭环。当前主声音支持再叠加最多 2 路辅助声音，并给每一层独立音量滑杆，满足 PRD 对“2-3 路叠加 + 独立音量”的最低要求。
- 验证结果：已完成 `npm run build`，并通过 Cloudflare Pages 部署到 `https://master.sleepfast.pages.dev`（部署别名）和 `https://1222b691.sleepfast.pages.dev`（本次部署 URL）。产物内已确认 `Sound blend` / `mix-panel` / layer volume 控件已进入线上 bundle。
- 2026-06-02：补齐 PRD 定时关闭中的 60 分钟预设。首页与工具页计时器从 10 / 20 / 30 / 45 扩展为 10 / 20 / 30 / 45 / 60，先收口“更长单次播放”这一最低体验闭环。
- 验证结果：已完成 `npm run build`；产物内确认 `60 min` 文案与 `10 to 60 minute timer presets` 已进入 bundle，待本次 Cloudflare Pages 部署后再核验正式域名生效。
- 2026-06-02：补上定时结束时的平滑淡出。播放器计时归零时不再直接硬停，而是对 master gain 做约 1.8 秒淡出，再停止音频节点，先收口定时关闭体验里的“结束更柔和”闭环。
- 验证结果：已完成 `npm run build`；产物内确认 `fadeOutAndStopPlayback` 与 `linearRampToValueAtTime` 已进入 bundle，待本次 Cloudflare Pages 部署后核验线上计时结束体验。
- 2026-06-03：首页补上收藏 / 最近播放最小闭环。当前主播放器支持把当前声音保存到本地收藏，并自动记录最近播放，用户再次进入站点后可一键重播常用声音，补齐 PRD 对“收藏 + 最近播放”的最低可用要求。
- 验证结果：已完成 `npm run build` 并通过 Cloudflare Pages 部署到 `https://master.sleepfast.pages.dev` 与 `https://aa3ea2f8.sleepfast.pages.dev`。浏览器快照已确认 preview 别名出现 `Save this sound`，当前 `sleepfast.pages.dev` 仍停在上一生产版本，尚未显示该入口，需继续观察正式域名切换。
- 2026-06-03：为首页与主要工具页播放器补上 1-180 分钟自定义 timer 输入，不再只限于 10 / 20 / 30 / 45 / 60 分钟预设。当前用户可直接输入更短 nap 时长或更长 overnight / travel recovery 时长，并继续复用原有平滑淡出逻辑，先把 PRD 里的“自定义时间”最低闭环补齐。
- 验证结果：待本次 `npm run build`、Cloudflare Pages 生产部署与正式域名核验，确认各主要播放页出现 `Custom minutes` 输入与 `Use custom` CTA。
- 2026-06-03：新增 `/nap-calculator` 工具页，直接承接高意图 nap calculator 搜索，并把 20 / 30 / 90 分钟 nap 结束时间与呼吸重置 / 雨声回流 CTA 收到同一页，先补齐 SEO 规划里的 daytime recovery 入口。
- 验证结果：待本次 `npm run build`、Cloudflare Pages 生产部署与正式域名核验，确认正式域名出现 `Use the nap calculator`、`Wake up at ...` 与回流 CTA。
- 2026-06-03：把 `/sleep-breathing-exercise` 从“只有节奏器”补成“呼吸后直接进声音”的更短闭环。当前呼吸页新增两个一键承接卡片：`Rain on Window · 20 min` 和 `Brown Noise · 30 min`，用户做完 2-4 个呼吸周期后可直接进入对应声音场景，不必再跳回首页重新选。
- 2026-06-03：继续补强 `/sleep-breathing-exercise` 的呼吸后场景分流，在原有 Rain / Brown 之外新增 `White Noise · 10 min` 与 `Ocean Waves · 45 min` 承接卡片，先收口“呼吸放松后直接进入夜醒重启 / 更长漂浮场景”的最小闭环。
- 验证结果：待本次 `npm run build` 与 Cloudflare Pages 生产部署后，通过正式域名核验 `/sleep-breathing-exercise` 已出现 4 张 follow-up 场景卡片。 
- 验证结果：已完成 `npm run build`，并通过 Cloudflare Pages 生产部署到 `https://sleepfast.pages.dev/sleep-breathing-exercise`（本次部署 URL `https://04a9b936.sleepfast.pages.dev`）。浏览器快照已确认呼吸页出现两张 follow-up 按钮卡片，preview 与正式域名都已可见。
- 2026-06-03：在 `white-noise-for-sleep` / `brown-noise-for-sleep` 工具页补上收藏与最近播放入口，不再只有首页能保存或重播常用声音。当前工具页播放器已支持 `Save this sound`、展示本地收藏与最近播放，并可一键重播，先把 SEO 落地页到复播路径收口。
- 验证结果：已完成 `npm run build`，并通过 Cloudflare Pages 部署到 `https://master.sleepfast.pages.dev`（preview）与 `https://d1649ffd.sleepfast.pages.dev`（本次部署 URL）。浏览器快照已确认 preview 与本次部署 URL 的 `white-noise-for-sleep` 页面出现 `Save this sound`，正式域名 `https://sleepfast.pages.dev/white-noise-for-sleep` 当前仍停在旧生产版本，尚未显示该入口，需等待 production 域名继续切换。
- 2026-06-03：新增 `/rain-sounds-for-sleep` 工具页，直接承接“rain sounds for sleeping”高意图搜索，并复用现有 Rain on Window 场景、10-60 分钟 timer、收藏与最近播放闭环。当前页首屏即可播放并能回流首页，先把 SEO 规划里的雨声入口补齐。
- 验证结果：已完成 `npm run build`，并通过 Cloudflare Pages 部署到 `https://sleepfast.pages.dev/rain-sounds-for-sleep`；浏览器快照已确认正式域名出现 `Play rain sounds now`、`Save this sound` 与 10-60 分钟 timer，生产环境已可直接承接该雨声音页流量。
- 2026-06-03：新增 `/ocean-sounds-for-sleep` 工具页，直接承接“ocean sounds for sleep”高意图搜索，并复用现有 Ocean Waves 场景、10-60 分钟 timer、收藏与最近播放闭环。当前页首屏即可播放并能回流首页，补齐高意图声音页矩阵里的海浪入口。
- 验证结果：已完成 `npm run build`，并通过 Cloudflare Pages 以 `--branch main` 补发 production 部署到 `https://sleepfast.pages.dev/ocean-sounds-for-sleep`；浏览器快照已确认正式域名出现 `Play ocean sounds now`、`Save this sound` 与 10-60 分钟 timer，之前 production 仍回落首页的问题已收口。
- 2026-06-03：把 `/sleep-breathing-exercise` 继续反向接入 `/wake-up-at-3am` 与 `/mind-racing-at-night`。当前两类问题页首屏播放器下方都新增了“先做 4-7-8 breathing reset”桥接卡片，用户不必先回首页就能先放松、再进入对应声音场景。
- 验证结果：已完成 `npm run build`，并通过 Cloudflare Pages production 部署到 `https://sleepfast.pages.dev`（本次部署 URL `https://4425ef18.sleepfast.pages.dev`）；浏览器快照已确认正式域名两个问题页首屏都出现 `Open the breathing reset` 入口，桥接卡片已上线。
- 2026-06-03：新增 `/sleep-better-tonight` 问题场景页，直接承接更宽泛的“sleep better tonight”搜索与转化意图。当前首屏可直接开启 Rain on Window 30 分钟重置，也可切换 Brown Noise / Ocean Waves，并在同一屏内桥接到 `/sleep-breathing-exercise` 与 `/sleep-calculator`，先把“今晚状态不对 → 选一个声音 → 必要时进入呼吸/时间工具”的最低闭环补齐。
- 验证结果：已完成 `npm run build`，并通过 Cloudflare Pages production 部署到 `https://sleepfast.pages.dev/sleep-better-tonight`（本次部署 URL `https://0c1cf30f.sleepfast.pages.dev`）；浏览器快照已确认正式域名出现 `Start sleeping better tonight`、`Open the breathing reset` 与 `Use the sleep calculator`，双桥接入口已上线。
- 2026-06-03：新增 `/jet-lag-calculator` 工具页，直接承接 jet lag calculator / travel recovery 搜索。当前首屏即可输入次日当地起床时间、得到第一晚 bedtime 建议，并在同一页桥接 `/sleep-breathing-exercise` 与 `/ocean-sounds-for-sleep`，先把 travel recovery → bedtime plan → 核心声音体验的最小闭环补齐。
- 验证结果：已完成 `npm run build`，并通过 Cloudflare Pages production 部署到 `https://sleepfast.pages.dev/jet-lag-calculator`（本次部署 URL `https://8d797eaa.sleepfast.pages.dev`）；浏览器快照已确认 preview 与正式域名都出现 `Use the jet lag calculator`、`Open the breathing reset` 与 `Play ocean sounds now`，生产环境已可直接承接该工具页流量。
- 2026-06-03：把 `/fall-asleep-fast` 补上与放松/时间工具的双向桥接。当前首屏播放器下新增 `Open the breathing reset` 与 `Use the sleep calculator` 两个 next-step 入口，先收口“想尽快睡着 → 先呼吸缓下来 / 校准 bedtime → 回到单一声音重置”的最小闭环。
- 验证结果：待本次 `npm run build`、Cloudflare Pages production 部署与正式域名核验，确认 `/fall-asleep-fast` 首屏出现两条桥接链接。
