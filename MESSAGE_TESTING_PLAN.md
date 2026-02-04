# CampusRide 消息计数功能测试计划

## 📋 测试目标

验证三个版本的消息计数功能是否达到微信水平：
- ✅ 小铃铛显示红点
- ✅ 红点显示未读消息数量
- ✅ 打开消息后红点消失
- ✅ 实时更新（Socket.IO）
- ✅ 轮询更新（30秒）

---

## 🔍 版本现状分析

### integration-production (最佳版本 ✅)
**状态：** 完整功能，无已知bug
**特性：**
- ✅ NotificationDropdown 组件（小铃铛 + 红点）
- ✅ 未读计数正确显示
- ✅ 打开消息后自动标记为已读
- ✅ 实时 Socket.IO 更新
- ✅ 30秒轮询刷新
- ✅ 页面可见性检测（优化）
- ✅ 系统消息支持
- ✅ 用户阻止功能
- ✅ 消息反应功能

**文件位置：**
```
integration-production/
├── src/components/layout/HeaderComponent.vue (使用 NotificationDropdown)
├── src/components/common/NotificationDropdown.vue (小铃铛组件)
├── src/stores/message.js (正确的未读计数逻辑)
└── campusride-backend/src/controllers/message.controller.js (完整功能)
```

### integration_online2025 (有bug版本 ❌)
**状态：** 功能缺失，bug重现
**问题：**
- ❌ 缺少 NotificationDropdown 组件
- ❌ 未读计数bug：打开消息时仍然计数
- ❌ 缺少系统消息功能
- ❌ 消息控制器被回退到旧版本
- ❌ 缺少用户阻止功能
- ❌ 缺少消息反应功能

**需要修复的文件：**
```
integration_online2025/
├── src/components/layout/HeaderComponent.vue (需要添加 NotificationDropdown)
├── src/components/common/NotificationDropdown.vue (需要创建)
├── src/stores/message.js (需要修复 addNewMessage bug)
└── campusride-backend/src/controllers/message.controller.js (需要恢复)
```

### integration_backup_local_1.2.9 (旧版本 ⚠️)
**状态：** 基础功能，有bug
**问题：**
- ⚠️ 直接在 HeaderComponent 中显示小铃铛（不优雅）
- ❌ 未读计数bug：打开消息时仍然计数
- ❌ markThreadAsRead 效率低（每次都重新获取所有计数）
- ❌ 缺少系统消息功能
- ❌ 消息控制器是旧版本（仅支持活动消息）

**需要修复的文件：**
```
integration_backup_local_1.2.9/
├── src/components/layout/HeaderComponent.vue (需要提取为 NotificationDropdown)
├── src/stores/message.js (需要修复 addNewMessage 和 markThreadAsRead)
└── campusride-backend/src/controllers/message.controller.js (需要升级)
```

---

## 🧪 测试账户创建

### 方案 A：通过应用注册（推荐）

**账户 1 - 发送者**
```
Email: sender@example.com
Password: TestPassword123!
First Name: Sender
Last Name: User
University: Cornell University
```

**账户 2 - 接收者**
```
Email: receiver@example.com
Password: TestPassword123!
First Name: Receiver
Last Name: User
University: Cornell University
```

**账户 3 - 管理员**
```
Email: rz469@university.edu
Password: AdminPassword123!
First Name: Admin
Last Name: User
University: Cornell University
```

### 方案 B：直接数据库插入（快速）

使用 Supabase 控制台：
```sql
-- 创建测试用户
INSERT INTO users (email, first_name, last_name, password_hash, university, created_at)
VALUES
  ('sender@example.com', 'Sender', 'User', 'hashed_password', 'Cornell University', NOW()),
  ('receiver@example.com', 'Receiver', 'User', 'hashed_password', 'Cornell University', NOW());

-- 创建消息线程
INSERT INTO message_threads (initiator_id, recipient_id, subject, created_at)
VALUES
  ((SELECT id FROM users WHERE email = 'sender@example.com'),
   (SELECT id FROM users WHERE email = 'receiver@example.com'),
   'Test Message Thread',
   NOW());

-- 创建未读消息
INSERT INTO messages (thread_id, sender_id, receiver_id, content, is_read, created_at)
VALUES
  ((SELECT id FROM message_threads LIMIT 1),
   (SELECT id FROM users WHERE email = 'sender@example.com'),
   (SELECT id FROM users WHERE email = 'receiver@example.com'),
   'This is a test message',
   false,
   NOW());
```

---

## 📱 测试场景

### 场景 1：基础未读计数显示

**步骤：**
1. 使用 Sender 账户登录
2. 使用 Receiver 账户登录（另一个浏览器/标签页）
3. Sender 发送消息给 Receiver
4. 观察 Receiver 的小铃铛

**预期结果：**
- ✅ 小铃铛显示红点
- ✅ 红点显示数字 "1"
- ✅ 消息在 30 秒内出现（轮询）或立即出现（Socket.IO）

**验证点：**
```
□ 红点显示
□ 数字正确
□ 位置正确（右上角）
□ 颜色正确（红色）
```

### 场景 2：打开消息后红点消失

**步骤：**
1. 继续场景 1 的状态
2. Receiver 点击小铃铛
3. 打开消息页面
4. 点击消息线程查看消息
5. 返回首页

**预期结果：**
- ✅ 打开消息页面后，红点立即消失
- ✅ 未读计数变为 0
- ✅ 返回首页后，小铃铛恢复正常（无红点）

**验证点：**
```
□ 点击小铃铛后红点消失
□ 未读计数更新为 0
□ 返回首页后仍无红点
□ 刷新页面后仍无红点
```

### 场景 3：多条消息计数

**步骤：**
1. Sender 连续发送 5 条消息给 Receiver
2. 观察 Receiver 的小铃铛

**预期结果：**
- ✅ 小铃铛显示 "5"
- ✅ 每条消息都被计数
- ✅ 打开消息后，所有消息标记为已读

**验证点：**
```
□ 计数正确（5）
□ 每条消息都计数
□ 打开后全部标记为已读
□ 红点消失
```

### 场景 4：实时更新（Socket.IO）

**步骤：**
1. Receiver 打开消息页面
2. Sender 发送新消息
3. 观察 Receiver 的消息列表

**预期结果：**
- ✅ 消息立即出现（< 1 秒）
- ✅ 不需要刷新页面
- ✅ 消息自动标记为已读（因为页面打开）

**验证点：**
```
□ 消息立即出现
□ 无需手动刷新
□ 自动标记为已读
□ 小铃铛保持 0
```

### 场景 5：轮询更新（30秒）

**步骤：**
1. Receiver 打开首页（不打开消息页面）
2. Sender 发送消息
3. 等待 30 秒
4. 观察小铃铛

**预期结果：**
- ✅ 30 秒后小铃铛显示红点
- ✅ 显示正确的未读计数
- ✅ 不需要手动刷新

**验证点：**
```
□ 30秒后红点出现
□ 计数正确
□ 无需手动刷新
□ 页面不卡顿
```

### 场景 6：页面可见性优化

**步骤：**
1. Receiver 打开首页
2. 切换到其他标签页（隐藏当前页面）
3. 等待 60 秒
4. 切换回当前标签页
5. Sender 发送消息

**预期结果：**
- ✅ 隐藏时不进行轮询（节省资源）
- ✅ 显示时立即刷新未读计数
- ✅ 消息立即显示

**验证点：**
```
□ 隐藏时无轮询请求
□ 显示时立即刷新
□ 消息立即出现
□ 性能良好
```

### 场景 7：打开消息时的bug测试（关键）

**步骤：**
1. Receiver 打开消息页面
2. Sender 发送消息
3. Receiver 正在查看消息线程
4. Sender 再发送一条消息
5. 观察未读计数

**预期结果（正确行为）：**
- ✅ 未读计数保持 0（因为线程已打开）
- ✅ 小铃铛不显示红点
- ✅ 消息自动标记为已读

**错误行为（bug）：**
- ❌ 未读计数变为 1（bug！）
- ❌ 小铃铛显示红点（bug！）
- ❌ 消息标记为未读（bug！）

**验证点：**
```
□ 未读计数保持 0（不是 1）
□ 小铃铛无红点
□ 消息自动标记为已读
```

---

## 🔧 修复方案

### 修复 1：integration_online2025 - 添加 NotificationDropdown

**文件：** `integration_online2025/src/components/common/NotificationDropdown.vue`

**操作：** 从 `integration-production` 复制该文件

```bash
cp integration-production/src/components/common/NotificationDropdown.vue \
   integration_online2025/src/components/common/NotificationDropdown.vue
```

### 修复 2：integration_online2025 - 修复 addNewMessage bug

**文件：** `integration_online2025/src/stores/message.js`

**修改位置：** 第 220-244 行

**原代码（有bug）：**
```javascript
const addNewMessage = (message) => {
  const threadId = message.thread_id

  // ... 其他代码 ...

  // 如果消息是给当前用户的，增加未读计数
  const storedUser = JSON.parse(localStorage.getItem('userData') || '{}')
  if (message.receiver_id === storedUser.id) {
    messageThreads.value[threadIndex].unread_count += 1
    unreadCount.value += 1  // BUG: 即使线程打开也计数！
  }
}
```

**修复后的代码：**
```javascript
const addNewMessage = (message) => {
  const threadId = message.thread_id

  // ... 其他代码 ...

  // 如果消息是给当前用户的，增加未读计数
  const storedUser = JSON.parse(localStorage.getItem('userData') || '{}')
  if (message.receiver_id === storedUser.id) {
    // 只有在线程未打开时才增加未读计数
    if (selectedThreadId.value !== threadId) {
      messageThreads.value[threadIndex].unread_count = (messageThreads.value[threadIndex].unread_count || 0) + 1
      unreadCount.value += 1
    }
    // 如果线程已打开，消息自动标记为已读 - 不增加计数
  }
}
```

### 修复 3：integration_online2025 - 恢复消息控制器

**文件：** `integration_online2025/campusride-backend/src/controllers/message.controller.js`

**操作：** 从 `integration-production` 复制该文件

```bash
cp integration-production/campusride-backend/src/controllers/message.controller.js \
   integration_online2025/campusride-backend/src/controllers/message.controller.js
```

### 修复 4：integration_online2025 - 恢复系统消息功能

**文件：** `integration_online2025/src/stores/message.js`

**添加缺失的方法和状态：**

```javascript
// 在 State 部分添加
const customSelectedThread = ref(null) // For system messages and other special threads

// 在 Actions 部分添加
const selectSystemMessages = (systemMessagesData) => {
  selectedThreadId.value = 'system-messages'
  customSelectedThread.value = {
    thread_id: 'system-messages',
    other_user: {
      id: 'system',
      first_name: 'System',
      last_name: 'Messages',
      email: 'system@campusride.com',
      avatar_url: null
    },
    subject: 'Announcements & Feedback',
    unread_count: 0
  }
  threadMessages.value['system-messages'] = systemMessagesData || []
}

const setMessagesLoading = (threadId, loading) => {
  messagesLoading.value[threadId] = loading
}

// 在 return 部分添加
customSelectedThread,
selectSystemMessages,
setMessagesLoading,
```

### 修复 5：integration_backup_local_1.2.9 - 修复 addNewMessage bug

**文件：** `integration_backup_local_1.2.9/src/stores/message.js`

**修改位置：** 第 220-244 行

**应用与修复 2 相同的修复**

### 修复 6：integration_backup_local_1.2.9 - 优化 markThreadAsRead

**文件：** `integration_backup_local_1.2.9/src/stores/message.js`

**修改位置：** 第 116-134 行

**原代码（低效）：**
```javascript
const markThreadAsRead = async (threadId) => {
  try {
    await messagesAPI.markThreadAsRead(threadId)

    const threadIndex = messageThreads.value.findIndex(t => t.thread_id === threadId)
    if (threadIndex !== -1) {
      messageThreads.value[threadIndex].unread_count = 0
      localStorage.setItem('messageThreads', JSON.stringify(messageThreads.value))
    }

    await loadUnreadCount()  // 低效：重新获取所有计数
  } catch (error) {
    console.error('Failed to mark thread as read:', error)
  }
}
```

**优化后的代码：**
```javascript
const markThreadAsRead = async (threadId) => {
  try {
    // 获取线程的当前未读计数（标记为已读前）
    const threadIndex = messageThreads.value.findIndex(t => t.thread_id === threadId)
    let threadUnreadCount = 0

    if (threadIndex !== -1) {
      threadUnreadCount = messageThreads.value[threadIndex].unread_count || 0
    }

    await messagesAPI.markThreadAsRead(threadId)

    // 更新线程列表
    if (threadIndex !== -1) {
      messageThreads.value[threadIndex].unread_count = 0
      localStorage.setItem('messageThreads', JSON.stringify(messageThreads.value))
    }

    // 从总计数中减去该线程的未读数（而不是重新获取所有）
    if (threadUnreadCount > 0) {
      unreadCount.value = Math.max(0, unreadCount.value - threadUnreadCount)
    }
  } catch (error) {
    console.error('Failed to mark thread as read:', error)
  }
}
```

---

## 📊 测试检查清单

### integration-production 测试

```
基础功能：
□ 小铃铛显示
□ 红点显示
□ 未读计数显示
□ 点击小铃铛打开消息页面

未读计数准确性：
□ 单条消息计数正确
□ 多条消息计数正确
□ 打开消息后计数清零
□ 刷新页面后计数保持

实时更新：
□ Socket.IO 实时更新（< 1秒）
□ 30秒轮询更新
□ 页面可见性优化
□ 打开消息时自动标记为已读

高级功能：
□ 系统消息显示
□ 用户阻止功能
□ 消息反应功能
□ 消息搜索功能
```

### integration_online2025 修复后测试

```
修复验证：
□ NotificationDropdown 组件正常工作
□ addNewMessage bug 已修复
□ 消息控制器功能完整
□ 系统消息功能恢复

功能测试：
□ 所有 integration-production 的测试都通过
□ 用户阻止功能正常
□ 消息反应功能正常
```

### integration_backup_local_1.2.9 修复后测试

```
bug 修复：
□ addNewMessage bug 已修复
□ markThreadAsRead 性能优化
□ 未读计数准确

功能测试：
□ 基础消息功能正常
□ 未读计数显示正确
□ 实时更新正常
```

---

## 🚀 执行步骤

### 第一步：测试 integration-production（基准）
1. 启动后端服务
2. 启动前端应用
3. 创建测试账户
4. 执行所有测试场景
5. 记录结果

### 第二步：修复 integration_online2025
1. 应用修复 1-4
2. 重启服务
3. 执行所有测试场景
4. 验证修复成功

### 第三步：修复 integration_backup_local_1.2.9
1. 应用修复 5-6
2. 重启服务
3. 执行所有测试场景
4. 验证修复成功

### 第四步：对比测试
1. 三个版本并行运行
2. 对比功能完整性
3. 对比性能表现
4. 生成最终报告

---

## 📝 测试报告模板

```
版本：[integration-production / integration_online2025 / integration_backup_local_1.2.9]
测试日期：[日期]
测试人员：[名字]

场景 1：基础未读计数显示
结果：[通过 / 失败]
备注：[任何问题或观察]

场景 2：打开消息后红点消失
结果：[通过 / 失败]
备注：[任何问题或观察]

... 其他场景 ...

总体评分：[1-10]
建议：[改进建议]
```

---

## 🎯 成功标准

✅ **微信水平的消息计数功能应该：**
1. 小铃铛显示红点（未读消息存在时）
2. 红点显示准确的未读消息数量
3. 打开消息后红点立即消失
4. 实时更新（Socket.IO）
5. 轮询更新（30秒）
6. 页面隐藏时不轮询（优化）
7. 打开消息线程时自动标记为已读
8. 多标签页同步（localStorage）

**所有三个版本修复后都应该达到这个标准。**
