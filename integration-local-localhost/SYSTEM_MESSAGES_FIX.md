# System Messages Implementation - Complete

## 问题描述
用户报告系统消息窗口无法打开。虽然系统消息项出现在左侧边栏中，但点击后无法显示在右侧聊天窗口中。

## 根本原因分析

1. **状态管理问题**: `currentThreadMessages` 计算属性从 `messageStore.threadMessages` 获取数据，但系统消息最初只保存在本地的 `systemMessages` ref 中，不会触发计算属性的更新。

2. **伪线程对象不完整**: `selectSystemMessagesThread` 方法创建的伪线程对象没有正确与 messageStore 同步。

3. **消息发送不同步**: 发送系统消息时，只更新了本地的 `systemMessages` 和 `currentThreadMessages`，但 `messageStore.threadMessages['system-messages']` 没有被正确更新。

## 实施的修复

### 1. 添加 isSystemMessagesThread 计算属性 (line 706)
```javascript
const isSystemMessagesThread = computed(() => selectedThreadId.value === 'system-messages')
```
用于在整个组件中判断当前是否在查看系统消息。

### 2. 修复 selectSystemMessagesThread 方法 (lines 1054-1077)
**关键变更**: 直接修改 messageStore 中的状态，而不是本地 ref
```javascript
const selectSystemMessagesThread = async () => {
  // 设置 messageStore 的 selectedThreadId（关键！）
  messageStore.selectedThreadId = 'system-messages'

  // 设置 messageStore 的 selectedThread（关键！）
  messageStore.selectedThread = { ... }

  // 关键：将系统消息放入 messageStore.threadMessages（这样 currentThreadMessages 计算属性才能获取到）
  messageStore.threadMessages['system-messages'] = systemMessages.value
}
```

### 3. 更新 sendReply 方法 (lines 1131-1146)
**关键变更**: 发送系统消息时更新 messageStore.threadMessages 以保持同步
```javascript
if (selectedThreadId.value === 'system-messages') {
  const newMessage = {
    id: `msg-${Date.now()}`,
    sender_id: currentUserId.value,
    sender_first_name: storedUser.value?.first_name || 'User',
    sender_last_name: storedUser.value?.last_name || '',
    content: replyMessage.value.trim(),
    created_at: new Date().toISOString(),
    is_read: true
  }
  systemMessages.value.push(newMessage)
  // 关键：同时更新 messageStore（触发 currentThreadMessages 计算属性）
  messageStore.threadMessages['system-messages'] = [...systemMessages.value]
}
```

### 4. 更新模板以支持系统消息显示

#### 4a. 头部显示逻辑 (lines 270-298)
- 系统消息显示蓝色 📢 emoji（而不是用户头像）
- 系统消息隐藏在线状态指示器
- 系统消息显示 "Announcements & Feedback" 描述

#### 4b. 隐藏不适用的 UI 元素
- 隐藏 Block/Unblock 下拉菜单 (line 303)
- 隐藏"等待回复"横幅 (line 483)
- 隐藏被阻止消息横幅 (line 341)

#### 4c. 消息气泡渲染 (lines 381-392)
- 系统消息显示蓝色 📢 emoji 头像
- 用户消息显示用户头像

#### 4d. 发送按钮逻辑 (line 553)
- 系统消息时忽略 replyStatus.awaiting_reply
- 系统消息时忽略 isMessagingBlocked

### 5. 更新 checkBlockStatus 方法 (lines 1351-1357)
系统消息不需要检查阻止状态：
```javascript
if (isSystemMessagesThread.value) {
  isCurrentUserBlocked.value = false
  isMessagingBlocked.value = false
  blockedByMe.value = false
  return
}
```

## 修改文件列表

1. **MessagesView.vue** - 主要修改
   - 添加 isSystemMessagesThread 计算属性
   - 修复 selectSystemMessagesThread 方法
   - 更新 sendReply 方法
   - 更新模板以支持系统消息显示
   - 修复 checkBlockStatus 方法

## 测试结果

✅ 所有 5 个测试类别通过：
1. ✓ 系统消息结构验证
2. ✓ 消息发送逻辑验证
3. ✓ 模板渲染验证
4. ✓ 计算属性验证
5. ✓ 消息显示验证

## 如何测试

1. 打开浏览器访问 http://localhost:5174
2. 登录或使用游客模式
3. 导航到消息页面
4. 验证左侧边栏显示"System Messages"（蓝色背景，📢 emoji）
5. 点击"System Messages"以打开它
6. 验证右侧显示系统消息
7. 输入消息并点击发送
8. 验证消息出现在聊天中
9. 验证来自两侧的消息都正确显示

## 关键技术细节

### 为什么使用 messageStore 而不是本地 ref？
- `currentThreadMessages` 是一个计算属性，它只能从 `messageStore.threadMessages[selectedThreadId.value]` 获取数据
- 通过直接修改 `messageStore.threadMessages['system-messages']`，我们确保计算属性能够正确更新并触发视图的反应性更新
- 这遵循了应用中其他消息线程的相同模式

### 为什么需要更新 messageStore.selectedThreadId 和 messageStore.selectedThread？
- Vue 的模板需要访问这些状态来条件渲染
- `selectedThreadId` 计算属性依赖于 `messageStore.selectedThreadId`
- `selectedThread` 计算属性依赖于 `messageStore.selectedThread`

### 为什么系统消息消息对象需要 sender_first_name 和 sender_last_name？
- 消息模板在显示来自"其他用户"的消息时需要这些字段（line 398）
- 这对于用户消息是必需的，因此为了一致性，系统消息也应该包含这些字段
