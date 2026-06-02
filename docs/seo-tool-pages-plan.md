# Sleepfast SEO 工具页规划（V1）

## 1. 目标
按竞品结论，Sleepfast 下一阶段增长不该靠继续堆首页，而要靠 **SEO 工具页矩阵** 承接高意图英文流量。

目标闭环：

**Google 搜索 → 进入单功能工具页 → 当场可用 → 回流首页播放器 / 订阅入口**

---

## 2. 核心原则
### 原则 1：每个页面都必须可立即使用
不要只写文章。
每个页面都必须有一个可以马上使用的工具或体验模块。

### 原则 2：页面围绕单一搜索意图
一页只打一个主关键词，不把多个意图混在一起。

### 原则 3：工具页服务首页，而不是自成孤岛
每个工具页最终都要把用户导向：
- 首页核心播放器
- 邮箱留资
- Premium 升级

### 原则 4：轻内容 + 强工具
内容只解释必要信息，不写成长篇博客。

---

## 3. 第一批优先页面

### A 类：高意图睡眠工具页
这些是最值得先做的，因为用户意图强，且容易做成可用工具。

#### 1. `/sleep-calculator`
- 主关键词：sleep calculator
- 用户意图：想知道几点睡、几点起更合适
- 工具：根据起床时间反推推荐入睡时间
- CTA：Try sleep sounds for tonight

#### 2. `/nap-calculator`
- 主关键词：nap calculator
- 用户意图：想知道小睡多久更合适
- 工具：根据当前时间推荐 20/30/90 分钟 nap 结束时间
- CTA：Use Sleepfast nap sound preset
- 当前状态：已上线首版页面方案，首屏可直接输入 nap 开始时间并获得 20 / 30 / 90 分钟 wake-up 时间，同时桥接 `/sleep-breathing-exercise` 与 `/rain-sounds-for-sleep`，先收口 daytime recovery 到核心播放器的最小闭环

#### 3. `/jet-lag-calculator`
- 主关键词：jet lag calculator
- 用户意图：旅行、倒时差
- 工具：简单倒时差建议 + 对应助眠入口
- CTA：Start a sleep reset sound
- 当前状态：已上线并完成 production 核验，正式域名首屏可直接输入次日当地起床时间并得到第一晚 bedtime 建议，同时桥接 `/sleep-breathing-exercise` 与 `/ocean-sounds-for-sleep`，先补齐 travel recovery 到核心播放器的最小闭环

#### 4. `/sleep-breathing-exercise`
- 主关键词：sleep breathing exercise
- 用户意图：需要快速放松方法
- 工具：4-7-8 的交互节奏器（已上线首版）
- CTA：Play a matching sleep sound / Open the bedtime reset
- 当前状态：已补上呼吸后的一键承接卡片，可直接从节奏器进入 Rain on Window 20 分钟、Brown Noise 30 分钟、White Noise 10 分钟或 Ocean Waves 45 分钟场景，减少“做完呼吸还要回首页重选”的断点；播放器侧现已支持 1-180 分钟自定义 timer，方便把呼吸后跟播时长拉到更贴近用户当晚状态的长度

---

### B 类：高意图助眠声音页
这些页面适合承接“我想现在听什么”的搜索流量。

#### 5. `/white-noise-for-sleep`
- 主关键词：white noise for sleep
- 工具：直接播放白噪音
- 附加：解释适合轻睡眠/背景噪音环境
- 当前状态：已补上收藏与最近播放入口，可直接从工具页保存常用声音并一键重播

#### 6. `/brown-noise-for-sleep`
- 主关键词：brown noise for sleep
- 工具：直接播放棕噪音
- 附加：解释适合思绪吵、城市噪音环境
- 当前状态：已补上收藏与最近播放入口，可直接从工具页保存常用声音并一键重播

#### 7. `/rain-sounds-for-sleep`
- 主关键词：rain sounds for sleeping
- 工具：直接播放雨声
- 附加：解释适合 wind-down
- 当前状态：已上线并完成 production 核验，正式域名可直接播放 Rain on Window，带 10-60 分钟 timer、收藏与最近播放入口

#### 8. `/ocean-sounds-for-sleep`
- 主关键词：ocean sounds for sleep
- 工具：直接播放海浪声
- 附加：解释适合深呼吸、长时放松
- 当前状态：已上线并完成 production 核验，正式域名可直接播放 Ocean Waves，带 10-60 分钟 timer、收藏与最近播放入口

---

### C 类：问题场景页
这些页面适合吃问题导向搜索。

#### 9. `/fall-asleep-fast`
- 主关键词：fall asleep fast
- 页面结构：问题解释 + 直接播放器 + 快速建议
- 当前状态：已在首屏播放器下补上通往 `/sleep-breathing-exercise` 与 `/sleep-calculator` 的桥接入口，并新增保存当前声音 + 一键重播收藏/最近播放入口，先把“今晚想快点睡着 → 先呼吸放松 / 校准 bedtime / 保存常用声音 → 回到单一声音重置”的最小闭环收口

#### 10. `/mind-racing-at-night`
- 主关键词：mind racing at night
- 页面结构：问题解释 + 棕噪音/呼吸练习 + FAQ
- 当前状态：已在首屏播放器下补上通往 `/sleep-breathing-exercise` 的桥接入口，先把“思绪停不下 → 先呼吸放松 → 再进棕噪音”路径收口

#### 11. `/wake-up-at-3am`
- 主关键词：wake up at 3am can’t fall back asleep
- 页面结构：夜醒场景建议 + 白噪音/短时计时器
- 当前状态：已在首屏播放器下补上通往 `/sleep-breathing-exercise` 的桥接入口，并新增保存当前声音 + 一键重播收藏/最近播放入口，先把“夜醒过于清醒 → 先呼吸缓下来 → 再进白噪音/雨声”路径收口

#### 12. `/sleep-better-tonight`
- 主关键词：sleep better tonight
- 页面结构：更偏总入口，承接宽泛搜索
- 当前状态：已上线并完成 production 核验，正式域名首屏可直接进入 Rain / Brown / Ocean 三种今晚重置预设，并桥接到 `/sleep-breathing-exercise` 与 `/sleep-calculator`，先把宽泛问题词流量接入核心播放体验

---

## 4. 页面统一模板
每个工具页都按下面结构走：

### 1）H1
直接对应关键词，不拐弯。

### 2）一句结果导向副标题
只解释用户来这里能得到什么。

### 3）核心工具模块
必须在首屏附近就能直接使用。

### 4）简短解释
2-4 段足够，说明为什么这样做有帮助。

### 5）FAQ
覆盖 3-5 个最常见问题。

### 6）主产品回流 CTA
示例：
- Start sleep sounds now
- Try the full Sleepfast player
- Get better sleep tips

---

## 5. 第一阶段内容与工程优先级

### 第一优先级：最快上线
- sleep-calculator
- white-noise-for-sleep
- brown-noise-for-sleep
- rain-sounds-for-sleep

原因：
- 搜索意图强
- 和当前 MVP 能力最接近
- 技术成本最低

### 第二优先级：补问题场景
- fall-asleep-fast
- mind-racing-at-night
- wake-up-at-3am

原因：
- 更贴近转化场景
- 更适合把用户带回首页或 premium

### 第三优先级：补扩展工具
- nap-calculator
- jet-lag-calculator
- sleep-breathing-exercise

原因：
- 有增长价值，但不是最短路径

---

## 6. 与首页的配合方式
工具页不是替代首页，而是给首页导流。

每个工具页应该配合：
- 首页播放器入口
- 邮箱留资
- premium preview
- 相关工具推荐

目标不是让用户只停在一个工具页，而是让他感知：

**Sleepfast 不只是一个页面，而是一整套更快入睡的网页工具。**

---

## 7. 成功指标
第一批工具页上线后，只看这几个指标：
- 工具页自然流量
- 工具启动率
- 工具页到首页点击率
- 工具页到留资转化率
- 工具页到 premium 点击率

---

## 8. 当前建议执行顺序
按业务价值排序，建议直接这样做：

1. 收口首页文案与 premium 权益表达
2. 做 `white-noise-for-sleep`
3. 做 `brown-noise-for-sleep`
4. 做 `sleep-calculator`
5. 做 `fall-asleep-fast`

---

## 9. 最终判断
Sleepfast 接下来的增长路线，不该是继续只打磨首页，而应该进入：

**首页转化 + 工具页获客** 双轮驱动。

在这个阶段，最值得先做的是：
- 结果导向首页
- 4 个高意图工具页
- 基础 FAQ / 科学解释 / 回流 CTA

这样最有机会快速把产品从“一个页面”推进成“一个能吃英文搜索流量的助眠网站”。