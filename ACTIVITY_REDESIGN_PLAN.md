# Activity 板块重新设计与优化计划书

## 📋 执行摘要

Activity 板块目前功能完整，但存在以下问题：
- **信息层级不清晰**：Activity Detail 页面信息过多，用户容易迷失
- **流程不够直观**：创建活动流程（多步骤表单）与浏览流程割裂
- **用户交互冗余**：部分操作路径过长，需要点击多次才能完成主要任务
- **视觉体验不一致**：不同模块的设计模式不统一
- **功能集成不完全**：缺少与其他模块（如用户头像、评分系统）的深度集成

---

## 🎯 重新设计目标

### 1. 优先级（P0-P2）

**P0 - 必须完成（核心功能体验）**
- [ ] 重新设计 Activity Detail 页面（信息结构化，分层展示）
- [ ] 优化 Activity 创建流程（简化表单，减少步骤）
- [ ] 统一 Activity 卡片设计（列表视图和详情视图保持一致）
- [ ] 集成头像点击交互（所有模块统一实现）

**P1 - 应该完成（重要功能优化）**
- [ ] 改进地图可视化（头像展示替代点标记）
- [ ] 优化检查入场流程（简化模态框）
- [ ] 增强群聊界面（与消息系统统一）
- [ ] 集成评分系统（活动完成后显示评分界面）

**P2 - 可以完成（体验提升）**
- [ ] 添加活动建议/推荐（基于距离、兴趣、时间）
- [ ] 活动参与历史统计（可视化图表）
- [ ] 集成积分和优惠券展示
- [ ] 支持群组管理和权限（只有组织者可编辑）

---

## 📐 新架构与模块设计

### 新的文件结构

```
src/
├── views/
│   ├── ActivitiesView.vue                    [重新设计] 活动feed主页
│   ├── ActivityDetailView.vue                [重新设计] 活动详情页（简化）
│   ├── CreateActivityView.vue                [重新设计] 活动创建（流程简化）
│   ├── ParticipationHistoryView.vue          [新增] 参与历史统计视图
│   └── ActivityGroupManageView.vue           [新增] 活动组管理视图
│
├── components/
│   ├── activities/
│   │   ├── ActivityCard.vue                  [新增] 统一活动卡片组件
│   │   ├── ActivityBasicInfo.vue             [新增] 基础信息卡片
│   │   ├── ActivityLocationSection.vue       [新增] 位置与参与者信息卡片
│   │   ├── ActivityCheckinSection.vue        [新增] 检查入场卡片
│   │   ├── ActivityParticipants.vue          [新增] 参与者列表组件
│   │   ├── ActivityGroupChat.vue             [重命名] ActivityChatModal → ActivityGroupChat
│   │   ├── ActivityCreateForm.vue            [新增] 统一创建表单
│   │   ├── LocationPickerModal.vue           [优化] 地图选择模态框
│   │   ├── CheckInModal.vue                  [重命名] ActivityCheckinModal → CheckInModal
│   │   ├── CheckInQRCode.vue                 [保留] QR码生成
│   │   ├── CheckInScanner.vue                [保留] QR码扫描
│   │   ├── ActivityMap.vue                   [重新设计] 地图可视化（头像）
│   │   └── [已弃用] ActivityForm.vue
│   │       [已弃用] ActivityFloatingButton.vue
│   │       [已弃用] ActivityList.vue
│   │       [已弃用] ActivityModal.vue
│   │
│   └── common/
│       ├── CommentSection.vue                [优化] 统一评论组件
│       ├── AvatarClickCard.vue               [新增] 头像点击卡片（用户信息+私信）
│       └── ActivityRatingModal.vue           [新增] 活动评分模态框
│
└── stores/
    └── activities.js                          [新增] Activity 状态管理（Pinia）
```

---

## 🔄 核心流程重新设计

### 1. Activity 浏览流程（简化）

```
ActivitiesView (Feed 主页)
├─ 顶部搜索栏 [搜索距离、时间、分类等]
├─ 筛选标签栏 [全部/我的组/紧急]
├─ Activity 卡片列表
│  └─ 单个卡片包含：
│     ├─ 头部: 组织者头像 + 活动名称 + 分类标签
│     ├─ 中部: 活动描述（一行文本）+ 地点 + 时间
│     ├─ 底部: 参与人数 + 费用 + 积分奖励
│     └─ 状态: [已加入] [即将开始] [进行中] 等标记
│
└─ 右上: 我的参与历史 + 创建活动 按钮
```

**用户点击卡片 → 进入 ActivityDetailView**

### 2. Activity 详情页重新设计（信息分层）

```
ActivityDetailView (详情页)
├─ 顶部导航栏
│  ├─ 返回按钮
│  ├─ 分享按钮
│  └─ 更多操作 (编辑/删除/举报)
│
├─ 活动头图 + 浮动信息卡片
│
├─ 可滑动的标签页 (Tabs)
│  ├─ [概览] - ActivityBasicInfo (默认)
│  │  ├─ 活动名称 + 分类 + 状态标记
│  │  ├─ 组织者信息卡片 (可点击头像进入个人资料)
│  │  ├─ 一句话描述
│  │  └─ [加入/取消] 按钮
│  │
│  ├─ [详情] - 完整描述
│  │  ├─ 完整活动描述
│  │  ├─ 要求和准备
│  │  ├─ 标签
│  │  └─ 活动规则
│  │
│  ├─ [位置] - ActivityLocationSection
│  │  ├─ 地点地址
│  │  ├─ 地图预览 (可点击展开全屏地图)
│  │  ├─ 参与者 + 可见用户位置可视化
│  │  └─ [导航] 按钮
│  │
│  ├─ [参与者] - ActivityParticipants
│  │  ├─ 参与者头像墙 (可点击查看资料)
│  │  ├─ 参与者列表 (名字、头像、参与状态)
│  │  └─ 筛选 (已加入、已签到、未签到)
│  │
│  ├─ [签到] - ActivityCheckinSection (仅在活动进行中显示)
│  │  ├─ 签到倒计时
│  │  ├─ 签到要求清单
│  │  ├─ [位置签到] / [扫描二维码] 按钮
│  │  └─ 已签到人数统计
│  │
│  └─ [讨论] - 评论 + 群聊快速访问
│     ├─ 评论列表 (CommentSection)
│     ├─ [开启群聊] 按钮
│     └─ 评论输入框
│
└─ 底部固定操作栏
   ├─ [加入/已加入] 按钮
   ├─ [签到] 按钮 (条件显示)
   ├─ [更多] 菜单 (编辑/删除/群聊/评分)
   └─ 费用 + 积分奖励显示
```

### 3. Activity 创建流程（简化）

**从 3 步表单 → 2 步表单 + 快速创建**

#### 快速创建模式（默认）
```
CreateActivityView (快速模式)
├─ 表单字段（按优先级排列）：
│  ├─ ✓ 活动名称 [必填]
│  ├─ ✓ 分类 [必填] (下拉选择)
│  ├─ ✓ 开始时间 [必填]
│  ├─ ✓ 位置 [必填] (点击打开地图选择)
│  ├─ ✓ 一句话描述 [必填] (100 字以内)
│  ├─ ✓ 最多参与人数 [可选] (默认无限)
│  ├─ ✓ 是否紧急 [可选] (切换开关)
│  └─ ✓ 奖励积分 [可选] (5-100, 默认 15)
│
├─ [更多选项] 可展开额外设置
│  ├─ 完整描述
│  ├─ 入场费用 ($)
│  ├─ 要求/准备物品
│  ├─ 标签
│  ├─ 位置验证距离
│  └─ 签到规则配置
│
└─ 底部操作
   ├─ [保存草稿]
   ├─ [预览]
   └─ [发布] 按钮
```

### 4. 检查入场流程（简化）

```
CheckInModal (简化流程)
├─ 标题: "检查入场"
├─ 剩余时间显示 (倒计时)
├─ 要求清单 (checklist)
│  ├─ ☑ 在活动场景范围内
│  ├─ ☑ 在活动时间内
│  └─ ☑ 已注册参加此活动
├─ 两种签到方式选项卡
│  ├─ [位置签到] - 获取位置 → 验证距离 → 确认
│  └─ [二维码扫描] - 打开扫描器 → 验证代码 → 确认
└─ 成功界面: 显示奖励的积分 + 进度条
```

---

## 🎨 UI 设计优化方向

### 1. Activity 卡片统一设计

**卡片布局标准化**（列表和详情中保持一致）
```
┌─────────────────────────────────┐
│ 👤 组织者名称        [分类标签]  │  <- Header (可点击进入个人资料)
├─────────────────────────────────┤
│ 活动名称 - 简短描述             │  <- Title + Brief desc
├─────────────────────────────────┤
│ 📍 地点  |  🕐 时间  |  👥 N人   │  <- Key info row
│ $ 费用   |  ⭐ 积分   |  ⏱️ 倒时   │  <- Additional info row
├─────────────────────────────────┤
│ [标签] [标签] [标签]            │  <- Tags
└─────────────────────────────────┘
```

### 2. 信息优先级重新排序

**现在**：所有信息同级，用户需要滚动多个模态框
**优化后**：分层显示，核心信息始终可见

- **Level 1 (Always visible)**：活动名、组织者、时间、地点、状态
- **Level 2 (Tab 切换)**：详情、参与者、位置地图、签到、讨论
- **Level 3 (点击展开)**：完整描述、要求清单、规则

### 3. 头像交互统一化

**所有地方点击头像都显示**（在公共组件 AvatarClickCard 中实现）：
```
┌──────────────────────────┐
│ 👤 用户名                │
│ 📧 user@cornell.edu      │
│ ⭐ 4.8 (15 ratings)      │ <- 集成评分系统
│ 🎯 1,250 Points          │ <- 集成积分系统
├──────────────────────────┤
│ [💬 发送私信] [👤 查看资料] │
└──────────────────────────┘
```

### 4. 地图可视化改进

**从点标记 → 用户头像**
- 显示用户实际头像而不是单色点
- 头像大小表示距离远近（近的更大）
- 悬停显示用户名
- 点击头像可进入个人资料或私信

---

## 📊 功能整合检查表

### 已有功能集成
- [x] 基础活动 CRUD
- [x] 活动分类和标签
- [x] 参与人数管理
- [x] 积分奖励系统
- [x] 位置验证签到
- [x] 二维码扫描签到
- [x] 活动群聊
- [x] 评论系统
- [x] 地图可视化

### 需要集成的新功能（根据 CLAUDE.MD）
- [ ] **头像点击交互** (Carpooling/Marketplace/Activities/Leaderboard)
  - 显示用户邮箱
  - 显示评分信息
  - 显示积分
  - 提供私信按钮

- [ ] **活动评分系统** (整合到活动完成后)
  - 1-5 星评分
  - 文字评价
  - 组织者/参与者互相评分

- [ ] **地图改进**
  - 显示头像而不是点
  - 点击头像进入聊天
  - "我的位置"有特殊标记

- [ ] **消息通知铃铛**
  - 首次点击显示消息预览弹窗
  - 再次点击或选择某条消息进入完整界面
  - 支持消息分类

- [ ] **积分与优惠券**
  - 活动参与历史中显示获得积分
  - 显示可用优惠券
  - 显示已过期优惠券

### 新增建议功能
- [ ] 活动推荐（基于距离、兴趣、时间）
- [ ] 活动参与统计（可视化图表）
- [ ] 活动搜索过滤增强
- [ ] 草稿自动保存
- [ ] 活动分享到其他社交平台

---

## 🛠️ 实现步骤与依赖

### Phase 1: 基础重构（第 1 周）
1. **创建新的活动状态管理 (Pinia store)**
   - 负责：活动列表缓存、详情缓存、用户参与状态
   - 依赖：无

2. **重新设计 ActivityCard 统一组件**
   - 支持两种模式：列表模式和详情模式
   - 依赖：Pinia store

3. **重构 ActivitiesView（Feed 页面）**
   - 简化筛选和排序
   - 集成新的 ActivityCard
   - 依赖：ActivityCard, Pinia store

### Phase 2: 详情页优化（第 2 周）
4. **重新设计 ActivityDetailView（分层标签页）**
   - 从信息混乱 → 清晰的标签页结构
   - 依赖：ActivityCard, ActivityBasicInfo, ActivityLocationSection 等子组件

5. **创建 ActivityBasicInfo 组件**
   - 概览标签页内容
   - 依赖：AvatarClickCard

6. **创建 ActivityLocationSection 组件**
   - 位置标签页内容
   - 改进地图可视化
   - 依赖：ActivityMap

### Phase 3: 创建流程简化（第 2-3 周）
7. **优化 CreateActivityView**
   - 从 3 步缩减为 2 步
   - 设计快速创建模式
   - 依赖：LocationPickerModal

### Phase 4: 交互统一化（第 3 周）
8. **创建 AvatarClickCard 公共组件**
   - 在所有模块中统一实现
   - 展示用户信息、评分、积分、私信按钮
   - 依赖：API 获取用户信息、评分、积分

9. **集成头像点击**
   - 在 Activity 卡片中实现
   - 在参与者列表中实现
   - 在评论者头像中实现
   - 依赖：AvatarClickCard

### Phase 5: 功能集成（第 4 周）
10. **集成评分系统**
    - 活动完成后显示评分模态框
    - 显示参与者评分
    - 依赖：Rating API, ActivityRatingModal

11. **改进地图可视化**
    - 替换点标记为头像
    - 实现头像点击进入聊天
    - 依赖：ActivityMap, 头像点击交互

12. **增强消息系统**
    - 实现消息铃铛弹窗
    - 依赖：消息系统 API

### Phase 6: 测试与优化（第 5 周）
13. **端到端测试**
    - 浏览 → 详情 → 加入 → 签到 → 评分 完整流程
    - 跨浏览器兼容性测试

14. **性能优化**
    - 活动列表虚拟滚动（大量数据时）
    - 图片懒加载
    - 地图优化

---

## 📋 关键设计决策

### 1. 为什么使用标签页而不是模态框？
- **模态框问题**：用户需要打开 → 关闭 → 再打开，流程繁琐
- **标签页优势**：所有内容在一个页面内，用户可快速切换，减少认知负担

### 2. 为什么简化创建表单？
- **当前问题**：3 步表单 + 大量可选字段，用户容易放弃
- **优化方案**：核心字段（名称、分类、时间、地点、描述）必填，其他可选
- **可展开设计**：高级用户可点击"更多选项"配置复杂设置

### 3. 为什么在活动卡片中放基础操作？
- **提高转化率**：用户无需进入详情页即可加入或查看关键信息
- **加快决策**：通过卡片快速浏览，找到感兴趣的活动

### 4. 为什么集成 AvatarClickCard？
- **统一体验**：跨所有模块（Carpooling、Marketplace、Activities、Leaderboard）
- **减少操作步骤**：一个卡片解决查看资料、发私信、查看评分的需求
- **提高用户发现**：展示评分和积分可能激励用户参与更多活动

---

## 🔍 可用性改进点

### 现状问题 → 优化方案

| 问题 | 现状 | 优化方案 |
|------|------|---------|
| **信息过载** | Detail 页面一屏显示所有内容 | 分层标签页，逐步展开 |
| **创建流程复杂** | 3 步表单 + 20+ 字段 | 2 步 + 快速模式，核心字段优先 |
| **交互不一致** | 不同模块头像交互不同 | 统一 AvatarClickCard 组件 |
| **地图体验差** | 只显示色点，无用户标识 | 显示头像，可交互 |
| **签到流程长** | 多个模态框嵌套 | 简化为单个清晰流程 |
| **无搜索提示** | 列表固定，无搜索功能 | 顶部搜索栏 + 智能推荐 |
| **评分系统孤立** | 评分只在用户资料中 | 活动完成后主动提示评分 |
| **历史记录难查** | 进入单独页面才能查看 | 卡片快速访问 + 统计可视化 |

---

## 💾 状态管理重新设计

### 新的 Pinia Store 结构 (activities.js)

```javascript
// 主要状态
{
  // Feed 列表状态
  activities: [],
  filters: {
    type: 'all',      // 'all' | 'myGroups' | 'urgent'
    category: null,
    distance: 5000,
    sortBy: 'newest',  // 'newest' | 'closest' | 'hottest'
    search: '',
  },
  pagination: {
    page: 1,
    pageSize: 20,
    total: 0,
  },

  // 详情页状态
  currentActivity: null,
  comments: [],
  participants: [],

  // 用户交互状态
  userParticipation: {
    participatedActivityIds: new Set(),
    checkedInActivityIds: new Set(),
  },

  // 创建表单状态
  createFormData: {
    title: '',
    category: '',
    startTime: null,
    endTime: null,
    location: {},
    description: '',
    // ... 其他字段
  },

  // UI 状态
  isLoadingActivities: false,
  isCreatingActivity: false,
  activeTab: 'overview', // 当前 Detail 页标签页

  // 地图状态
  userVisibility: false,
  mapMarkers: [],
}

// 主要 Actions
{
  fetchActivities(filters),
  fetchActivityDetail(id),
  createActivity(data),
  updateActivity(id, data),
  deleteActivity(id),
  joinActivity(id),
  leaveActivity(id),
  addComment(activityId, text),
  deleteComment(commentId),
  checkInActivity(id, method), // 'location' | 'qrcode'
  generateCheckinCode(id),
  getActivityParticipants(id),
  rateActivity(activityId, rating),
  setActivityFilter(filters),
  setSortOption(option),
  setActiveTab(tabName),
  toggleUserVisibility(),
  setCreateFormData(data),
  saveActivityDraft(data),
}
```

---

## 🧪 验收标准

### 功能完整性
- [ ] 所有现有功能保持可用（0 个功能退化）
- [ ] 新交互流程可完整执行
- [ ] 跨设备兼容（移动端、平板、桌面端）

### 用户体验
- [ ] 首屏加载时间 < 2 秒
- [ ] 详情页滚动流畅（60 FPS）
- [ ] 创建活动流程 < 3 分钟完成
- [ ] 用户反馈满意度 > 4/5

### 代码质量
- [ ] 所有新组件有 JSDoc 注释
- [ ] 单元测试覆盖 > 80%
- [ ] 无 console.error/console.warn
- [ ] Lighthouse 得分 > 90

---

## 📅 时间线（预计）

- **周一 - 周二**：Phase 1 - 基础重构
- **周三 - 周四**：Phase 2 + Phase 3 - 详情页和创建流程
- **周五 - 周一**：Phase 4 + Phase 5 - 交互统一和功能集成
- **周二 - 周三**：Phase 6 - 测试与优化

---

## 🤔 风险与缓解

| 风险 | 影响 | 缓解方案 |
|------|------|---------|
| 现有功能破坏 | 高 | 保留旧代码分支，逐步迁移，完整回归测试 |
| 用户适应新 UI | 中 | 提供使用指引，保留主要交互逻辑 |
| 性能下降 | 中 | 早期性能测试，实施虚拟滚动，图片优化 |
| API 兼容性 | 低 | 确保 API 契约不变，新增新端点而不改动旧接口 |

---

## ✅ 下一步

1. **等待反馈** - 确认计划无误
2. **建立分支** - 从 main 创建 `feature/activity-redesign` 分支
3. **创建子任务** - 在每个 Phase 前细化具体任务
4. **每日同步** - 每日更新进度和遇到的问题

---

**计划制定时间**：2024-12-28
**预计完成时间**：2025-01-24
**负责人**：Claude Code
