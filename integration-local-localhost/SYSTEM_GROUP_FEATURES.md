# 系统群组功能完整实施指南

## 📋 已完成的功能

### 1. ✅ 自动添加用户到系统群组
- 用户首次访问系统群组时自动添加为成员
- 无需手动加入，所有用户都可以访问
- 后端自动处理，前端无感知

### 2. ✅ 群聊头像显示
- 每条消息显示发送者头像
- 支持自定义头像和默认头像
- 头像可点击（管理员可禁言）

### 3. ✅ 管理员禁言功能
- 点击用户头像可禁言（仅管理员）
- 禁言用户无法发送消息
- 支持取消禁言

### 4. ✅ 管理员撤回消息功能
- 管理员可撤回任何消息
- 撤回后显示"[消息已被撤回]"
- 记录撤回日志

---

## 🚀 部署步骤

### 第1步：部署前端代码
```bash
npm run build
# 部署到生产环境
```

### 第2步：执行数据库迁移
在Supabase SQL编辑器中执行：

```sql
-- 添加用户禁言表
CREATE TABLE IF NOT EXISTS group_muted_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  muted_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT,
  muted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  unmuted_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(group_id, user_id)
);

-- 添加消息撤回表
CREATE TABLE IF NOT EXISTS group_message_deletions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES group_messages(id) ON DELETE CASCADE,
  deleted_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT,
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_group_muted_users_group_id ON group_muted_users(group_id);
CREATE INDEX IF NOT EXISTS idx_group_muted_users_user_id ON group_muted_users(user_id);
CREATE INDEX IF NOT EXISTS idx_group_message_deletions_message_id ON group_message_deletions(message_id);

-- 修改group_messages表，添加is_deleted字段
ALTER TABLE group_messages ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
ALTER TABLE group_messages ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE group_messages ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES users(id) ON DELETE SET NULL;
```

### 第3步：验证修改

**测试自动添加成员**:
```sql
-- 检查用户是否自动添加到系统群组
SELECT COUNT(*) FROM group_members
WHERE group_id IN ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002');
```

**测试禁言功能**:
1. 以管理员身份登录
2. 进入Carpooling或Marketplace群聊
3. 点击其他用户的头像
4. 确认禁言
5. 验证被禁言用户无法发送消息

**测试撤回功能**:
1. 以管理员身份登录
2. 进入群聊
3. 右键点击消息
4. 选择撤回
5. 验证消息显示"[消息已被撤回]"

---

## 📊 代码修改总结

### 后端修改

#### 1. 自动添加用户到系统群组
**文件**: `campusride-backend/src/services/group.service.js`

```javascript
async checkMembership(groupId, userId) {
  // 系统群组ID常量
  const SYSTEM_GROUP_IDS = [
    '00000000-0000-0000-0000-000000000001', // Carpooling
    '00000000-0000-0000-0000-000000000002'  // Marketplace
  ];

  // 如果是系统群组，自动添加用户
  if (SYSTEM_GROUP_IDS.includes(groupId)) {
    // 尝试添加用户到系统群组
    const { error: insertError } = await supabaseAdmin
      .from('group_members')
      .insert({
        group_id: groupId,
        user_id: userId,
        role: 'member'
      });

    // 忽略唯一约束冲突错误（用户已经是成员）
    if (insertError && insertError.code !== '23505') {
      throw insertError;
    }

    // 系统群组成员检查总是返回true
    return {
      success: true,
      isMember: true,
      role: 'member'
    };
  }

  // 普通群组的检查逻辑...
}
```

#### 2. 禁言用户功能
**文件**: `campusride-backend/src/services/group.service.js`

```javascript
async muteUser(groupId, userId, mutedByUserId, reason = '') {
  // 将用户添加到禁言列表
  const { data, error } = await supabaseAdmin
    .from('group_muted_users')
    .upsert({
      group_id: groupId,
      user_id: userId,
      muted_by: mutedByUserId,
      reason: reason,
      muted_at: new Date().toISOString(),
      unmuted_at: null
    })
    .select()
    .single();

  if (error) throw error;
  return { success: true, data };
}

async isUserMuted(groupId, userId) {
  // 检查用户是否被禁言
  const { data: muteRecord, error } = await supabaseAdmin
    .from('group_muted_users')
    .select('*')
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .is('unmuted_at', null)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  return {
    success: true,
    isMuted: !!muteRecord,
    muteRecord
  };
}
```

#### 3. 撤回消息功能
**文件**: `campusride-backend/src/services/group.service.js`

```javascript
async deleteMessage(messageId, deletedByUserId, reason = '') {
  // 标记消息为已删除
  const { data: updatedMessage, error: updateError } = await supabaseAdmin
    .from('group_messages')
    .update({
      is_deleted: true,
      deleted_at: new Date().toISOString(),
      deleted_by: deletedByUserId,
      content: '[消息已被撤回]'
    })
    .eq('id', messageId)
    .select()
    .single();

  if (updateError) throw updateError;

  // 记录删除日志
  await supabaseAdmin
    .from('group_message_deletions')
    .insert({
      message_id: messageId,
      deleted_by: deletedByUserId,
      reason: reason
    });

  return { success: true, message: updatedMessage };
}
```

#### 4. 检查管理员权限
**文件**: `campusride-backend/src/services/group.service.js`

```javascript
async isGroupAdmin(groupId, userId) {
  // 检查用户是否是群组创建者（管理员）
  const { data: group, error } = await supabaseAdmin
    .from('groups')
    .select('creator_id')
    .eq('id', groupId)
    .single();

  if (error) throw error;

  return {
    success: true,
    isAdmin: group?.creator_id === userId
  };
}
```

### 前端修改

#### 1. 显示用户头像
**文件**: `src/components/groups/GroupChatModal.vue`

```vue
<div v-if="message.sender_id !== currentUserId" class="flex items-center space-x-2 mb-1 ml-2">
  <!-- 用户头像 -->
  <img
    v-if="message.sender?.avatar_url"
    :src="message.sender.avatar_url"
    :alt="getUserName(message.sender)"
    class="w-6 h-6 rounded-full object-cover cursor-pointer hover:opacity-80"
    @click="showUserMenu(message.sender)"
    :title="getUserName(message.sender)"
  />
  <div
    v-else
    class="w-6 h-6 bg-[#C24D45] rounded-full flex items-center justify-center text-white text-xs font-bold cursor-pointer hover:opacity-80"
    @click="showUserMenu(message.sender)"
    :title="getUserName(message.sender)"
  >
    {{ getUserName(message.sender).charAt(0).toUpperCase() }}
  </div>
  <!-- 用户名 -->
  <span class="text-xs text-gray-500">{{ getUserName(message.sender) }}</span>
</div>
```

#### 2. 禁言功能
**文件**: `src/components/groups/GroupChatModal.vue`

```javascript
// 显示用户菜单（禁言选项）
const showUserMenu = (user) => {
  if (!isGroupAdmin.value || !user) return

  const userName = getUserName(user)
  const confirmed = window.confirm(`是否禁言用户 ${userName}？`)

  if (confirmed) {
    muteUser(user.id, userName)
  }
}

// 禁言用户
const muteUser = async (userId, userName) => {
  try {
    const response = await groupAPI.muteUser(props.group.id, userId, {
      reason: '管理员禁言'
    })

    if (response.data?.success) {
      message.success(`已禁言用户 ${userName}`)
    }
  } catch (error) {
    console.error('Failed to mute user:', error)
    message.error(error.response?.data?.error?.message || '禁言失败')
  }
}
```

#### 3. 撤回消息功能
**文件**: `src/components/groups/GroupChatModal.vue`

```javascript
// 撤回消息
const deleteMessage = async (messageId) => {
  try {
    const response = await groupAPI.deleteMessage(props.group.id, messageId, {
      reason: '管理员撤回'
    })

    if (response.data?.success) {
      // 更新本地消息列表
      const messageIndex = groupMessages.value.findIndex(m => m.id === messageId)
      if (messageIndex !== -1) {
        groupMessages.value[messageIndex].content = '[消息已被撤回]'
        groupMessages.value[messageIndex].is_deleted = true
      }
      message.success('消息已撤回')
    }
  } catch (error) {
    console.error('Failed to delete message:', error)
    message.error(error.response?.data?.error?.message || '撤回失败')
  }
}
```

---

## 🔑 关键特性

### 自动成员添加
- ✅ 用户首次访问系统群组时自动添加
- ✅ 无需手动加入
- ✅ 所有用户都可以访问

### 头像显示
- ✅ 每条消息显示发送者头像
- ✅ 支持自定义头像
- ✅ 默认显示首字母

### 禁言功能
- ✅ 仅管理员可禁言
- ✅ 点击用户头像禁言
- ✅ 支持取消禁言
- ✅ 禁言用户无法发送消息

### 撤回消息
- ✅ 仅管理员可撤回
- ✅ 撤回后显示"[消息已被撤回]"
- ✅ 记录撤回日志
- ✅ 支持撤回原因

---

## 📝 API端点

### 禁言相关
```
POST   /api/v1/groups/{groupId}/mute/{userId}      - 禁言用户
DELETE /api/v1/groups/{groupId}/mute/{userId}      - 取消禁言
```

### 撤回消息
```
DELETE /api/v1/groups/{groupId}/messages/{messageId} - 撤回消息
```

---

## 🧪 测试清单

- [ ] 用户自动添加到系统群组
- [ ] 用户可以发送消息到系统群组
- [ ] 消息显示发送者头像
- [ ] 管理员可以点击头像禁言用户
- [ ] 被禁言用户无法发送消息
- [ ] 管理员可以撤回消息
- [ ] 撤回的消息显示"[消息已被撤回]"
- [ ] 禁言和撤回日志正确记录

---

## 🔐 权限检查

### 管理员权限
- 群组创建者 = 管理员
- 仅管理员可禁言用户
- 仅管理员可撤回消息

### 用户权限
- 所有用户可访问系统群组
- 所有用户可发送消息（除非被禁言）
- 用户只能撤回自己的消息（如果实现）

---

## 📊 数据库表

### group_muted_users
```
id          - UUID主键
group_id    - 群组ID
user_id     - 被禁言用户ID
muted_by    - 禁言者ID
reason      - 禁言原因
muted_at    - 禁言时间
unmuted_at  - 取消禁言时间
```

### group_message_deletions
```
id          - UUID主键
message_id  - 消息ID
deleted_by  - 删除者ID
reason      - 删除原因
deleted_at  - 删除时间
```

### group_messages (修改)
```
is_deleted  - 是否已删除
deleted_at  - 删除时间
deleted_by  - 删除者ID
```

---

## 🎯 下一步

1. **部署前端代码** - 构建并部署
2. **执行数据库迁移** - 创建新表和列
3. **测试功能** - 验证所有功能正常
4. **监控日志** - 检查禁言和撤回日志

---

## 📞 故障排除

### 问题1: 用户仍然不是成员
**解决**: 检查后端是否正确部署，查看日志中的错误信息

### 问题2: 禁言功能不工作
**解决**: 确认用户是管理员，检查数据库表是否创建

### 问题3: 撤回消息失败
**解决**: 检查消息ID是否正确，确认用户是管理员

---

**提交ID**: 1038bdca
**状态**: 准备就绪
**下一步**: 执行部署步骤
