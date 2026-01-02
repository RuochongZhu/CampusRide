<template>
  <div class="admin-panel-container">
    <!-- Header -->
    <div class="admin-header">
      <h1>管理后台</h1>
      <div class="admin-tabs">
        <button
          v-for="tab in adminTabs"
          :key="tab.id"
          @click="activeTab = tab.id"
          :class="{ active: activeTab === tab.id }"
          class="tab-btn"
        >
          {{ tab.name }}
        </button>
      </div>
    </div>

    <!-- Announcements Tab -->
    <div v-show="activeTab === 'announcements'" class="admin-section">
      <div class="section-header">
        <h2>系统公告管理</h2>
        <a-button type="primary" @click="showCreateModal = true">
          <PlusOutlined /> 创建公告
        </a-button>
      </div>

      <!-- Create/Edit Announcement Modal -->
      <a-modal
        v-model:open="showCreateModal"
        :title="editingId ? '编辑公告' : '创建新公告'"
        @ok="submitAnnouncement"
        :confirmLoading="submitting"
        width="700px"
      >
        <a-form layout="vertical" :model="announcementForm">
          <!-- Title -->
          <a-form-item label="标题" required>
            <a-input
              v-model:value="announcementForm.title"
              placeholder="输入公告标题"
              maxlength="200"
            />
          </a-form-item>

          <!-- Content -->
          <a-form-item label="内容" required>
            <a-textarea
              v-model:value="announcementForm.content"
              placeholder="输入公告内容"
              :rows="6"
              maxlength="5000"
              show-count
            />
          </a-form-item>

          <!-- Type -->
          <a-form-item label="公告类型">
            <a-select v-model:value="announcementForm.announcement_type">
              <a-select-option value="general">一般</a-select-option>
              <a-select-option value="warning">警告</a-select-option>
              <a-select-option value="important">重要</a-select-option>
              <a-select-option value="maintenance">维护</a-select-option>
            </a-select>
          </a-form-item>

          <!-- Priority -->
          <a-form-item label="优先级 (0-100)">
            <a-input-number
              v-model:value="announcementForm.priority"
              :min="0"
              :max="100"
            />
          </a-form-item>

          <!-- Target Scope -->
          <a-form-item label="目标范围">
            <a-select v-model:value="announcementForm.target_scope">
              <a-select-option value="all">全站用户</a-select-option>
              <a-select-option value="activity_only">仅活动参与者</a-select-option>
              <a-select-option value="specific_users">特定用户 (TODO)</a-select-option>
            </a-select>
          </a-form-item>

          <!-- Display Settings -->
          <a-form-item label="显示设置">
            <div class="display-settings">
              <a-checkbox v-model:checked="announcementForm.show_in_notification">
                显示在通知
              </a-checkbox>
              <a-checkbox v-model:checked="announcementForm.show_in_activity_chat">
                显示在活动聊天
              </a-checkbox>
              <a-checkbox v-model:checked="announcementForm.show_in_dashboard">
                显示在仪表板
              </a-checkbox>
            </div>
          </a-form-item>

          <!-- Pin -->
          <a-form-item>
            <a-checkbox v-model:checked="announcementForm.is_pinned">
              📌 置顶此公告
            </a-checkbox>
          </a-form-item>

          <!-- Scheduled Until -->
          <a-form-item label="有效期至 (可选)">
            <a-date-picker
              v-model:value="announcementForm.scheduled_until"
              show-time
              format="YYYY-MM-DD HH:mm:ss"
            />
          </a-form-item>
        </a-form>
      </a-modal>

      <!-- Announcements List -->
      <a-table
        :columns="announcementColumns"
        :data-source="announcements"
        :loading="loadingAnnouncements"
        :pagination="false"
        row-key="id"
        class="announcements-table"
      >
        <!-- Type Badge -->
        <template #bodyCell:announcement_type="{ text }">
          <a-tag :color="getTypeColor(text)">{{ text }}</a-tag>
        </template>

        <!-- Priority -->
        <template #bodyCell:priority="{ text }">
          <a-rate :value="Math.ceil(text / 20)" disabled />
        </template>

        <!-- Published Date -->
        <template #bodyCell:published_at="{ text }">
          {{ formatDate(text) }}
        </template>

        <!-- Pinned -->
        <template #bodyCell:is_pinned="{ record }">
          <a-button
            v-if="!record.is_pinned"
            type="text"
            size="small"
            @click="togglePin(record.id, true)"
          >
            📌 Pin
          </a-button>
          <a-button
            v-else
            type="primary"
            size="small"
            @click="togglePin(record.id, false)"
          >
            ✓ Pinned
          </a-button>
        </template>

        <!-- Actions -->
        <template #bodyCell:actions="{ record }">
          <a-space>
            <a-button
              type="link"
              size="small"
              @click="editAnnouncement(record)"
            >
              Edit
            </a-button>
            <a-popconfirm
              title="Delete this announcement?"
              @confirm="deleteAnnouncement(record.id)"
              ok-text="Yes"
              cancel-text="No"
            >
              <a-button type="link" danger size="small">Delete</a-button>
            </a-popconfirm>
          </a-space>
        </template>
      </a-table>
    </div>

    <!-- Admin Users Tab -->
    <div v-show="activeTab === 'admins'" class="admin-section">
      <div class="section-header">
        <h2>管理员权限管理</h2>
        <a-button type="primary" @click="showAdminModal = true">
          <PlusOutlined /> 添加管理员
        </a-button>
      </div>

      <!-- Add/Edit Admin Modal -->
      <a-modal
        v-model:open="showAdminModal"
        title="管理员权限设置"
        @ok="submitAdminRole"
        :confirmLoading="submittingAdmin"
        width="600px"
      >
        <a-form layout="vertical" :model="adminForm">
          <a-form-item label="用户邮箱" required>
            <a-auto-complete
              v-model:value="adminForm.email"
              :options="userOptions"
              @search="searchUsers"
              placeholder="搜索用户邮箱"
            />
          </a-form-item>

          <a-form-item label="角色" required>
            <a-select v-model:value="adminForm.role">
              <a-select-option value="admin">管理员 (完全权限)</a-select-option>
              <a-select-option value="moderator">版主 (仅内容审核)</a-select-option>
            </a-select>
          </a-form-item>

          <a-form-item label="权限说明">
            <div class="role-description">
              <p v-if="adminForm.role === 'admin'">
                <strong>管理员</strong>可以：
                <ul>
                  <li>发布和管理系统公告</li>
                  <li>删除任何活动的消息</li>
                  <li>管理其他管理员</li>
                  <li>查看审计日志</li>
                </ul>
              </p>
              <p v-else-if="adminForm.role === 'moderator'">
                <strong>版主</strong>可以：
                <ul>
                  <li>删除不当消息</li>
                  <li>管理活动聊天</li>
                  <li>无法发布系统公告</li>
                </ul>
              </p>
            </div>
          </a-form-item>
        </a-form>
      </a-modal>

      <!-- Admin Users List -->
      <a-table
        :columns="adminColumns"
        :data-source="adminUsers"
        :loading="loadingAdmins"
        :pagination="false"
        row-key="id"
      >
        <template #bodyCell:role="{ text }">
          <a-tag :color="text === 'admin' ? 'red' : 'orange'">{{ text }}</a-tag>
        </template>

        <template #bodyCell:created_at="{ text }">
          {{ formatDate(text) }}
        </template>

        <template #bodyCell:actions="{ record }">
          <a-popconfirm
            :title="`Remove ${record.email} from admin?`"
            @confirm="removeAdmin(record.id)"
            ok-text="Yes"
            cancel-text="No"
          >
            <a-button type="link" danger size="small">Remove</a-button>
          </a-popconfirm>
        </template>
      </a-table>
    </div>

    <!-- Activity Moderation Tab -->
    <div v-show="activeTab === 'moderation'" class="admin-section">
      <h2>活动审计日志</h2>
      <a-table
        :columns="moderationColumns"
        :data-source="moderationLogs"
        :loading="loadingModeration"
        :pagination="paginationModeration"
        @change="onModerationTableChange"
        row-key="id"
      >
        <template #bodyCell:action="{ text }">
          <a-tag :color="getActionColor(text)">{{ text }}</a-tag>
        </template>

        <template #bodyCell:created_at="{ text }">
          {{ formatDate(text) }}
        </template>
      </a-table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { PlusOutlined } from '@ant-design/icons-vue'
import dayjs from 'dayjs'
import { announcementsAPI, usersAPI } from '@/utils/api'

const activeTab = ref('announcements')

// ===== Announcements =====
const showCreateModal = ref(false)
const submitting = ref(false)
const loadingAnnouncements = ref(false)
const announcements = ref([])
const editingId = ref(null)

const announcementForm = ref({
  title: '',
  content: '',
  announcement_type: 'general',
  priority: 0,
  is_pinned: false,
  target_scope: 'all',
  show_in_notification: true,
  show_in_activity_chat: true,
  show_in_dashboard: true,
  scheduled_until: null
})

const announcementColumns = [
  {
    title: '标题',
    dataIndex: 'title',
    key: 'title',
    width: '30%'
  },
  {
    title: '类型',
    dataIndex: 'announcement_type',
    key: 'announcement_type',
    width: '12%'
  },
  {
    title: '优先级',
    dataIndex: 'priority',
    key: 'priority',
    width: '10%'
  },
  {
    title: '发布时间',
    dataIndex: 'published_at',
    key: 'published_at',
    width: '18%'
  },
  {
    title: '置顶',
    dataIndex: 'is_pinned',
    key: 'is_pinned',
    width: '10%'
  },
  {
    title: '操作',
    key: 'actions',
    width: '20%'
  }
]

// ===== Admin Users =====
const showAdminModal = ref(false)
const submittingAdmin = ref(false)
const loadingAdmins = ref(false)
const adminUsers = ref([])
const userOptions = ref([])

const adminForm = ref({
  email: '',
  role: 'admin'
})

const adminColumns = [
  {
    title: '邮箱',
    dataIndex: 'email',
    key: 'email',
    width: '40%'
  },
  {
    title: '名字',
    dataIndex: 'first_name',
    key: 'first_name',
    width: '20%',
    render: (text, record) => `${record.first_name} ${record.last_name}`
  },
  {
    title: '角色',
    dataIndex: 'role',
    key: 'role',
    width: '20%'
  },
  {
    title: '添加时间',
    dataIndex: 'created_at',
    key: 'created_at',
    width: '20%'
  },
  {
    title: '操作',
    key: 'actions',
    width: '15%'
  }
]

// ===== Moderation Logs =====
const loadingModeration = ref(false)
const moderationLogs = ref([])
const paginationModeration = ref({
  current: 1,
  pageSize: 20,
  total: 0
})

const moderationColumns = [
  {
    title: '活动',
    dataIndex: 'activity_id',
    key: 'activity_id',
    width: '15%'
  },
  {
    title: '操作',
    dataIndex: 'action',
    key: 'action',
    width: '12%'
  },
  {
    title: '操作者',
    dataIndex: 'moderator_id',
    key: 'moderator_id',
    width: '15%'
  },
  {
    title: '时间',
    dataIndex: 'created_at',
    key: 'created_at',
    width: '20%'
  },
  {
    title: '原因',
    dataIndex: 'reason',
    key: 'reason',
    width: '30%'
  }
]

const adminTabs = [
  { id: 'announcements', name: '📢 公告管理' },
  { id: 'admins', name: '👨‍💼 管理员权限' },
  { id: 'moderation', name: '🔍 审计日志' }
]

// ===== Methods =====

// Announcements Methods
const loadAnnouncements = async () => {
  try {
    loadingAnnouncements.value = true
    const response = await announcementsAPI.getAnnouncements({ limit: 100 })

    if (response.data.success) {
      announcements.value = response.data.data.announcements
    }
  } catch (error) {
    console.error('Failed to load announcements:', error)
    message.error('加载公告失败')
  } finally {
    loadingAnnouncements.value = false
  }
}

const submitAnnouncement = async () => {
  try {
    submitting.value = true

    const payload = {
      ...announcementForm.value,
      scheduled_until: announcementForm.value.scheduled_until
        ? announcementForm.value.scheduled_until.toISOString()
        : null
    }

    if (editingId.value) {
      // Update
      await announcementsAPI.updateAnnouncement(editingId.value, payload)
      message.success('公告已更新')
    } else {
      // Create
      await announcementsAPI.createAnnouncement(payload)
      message.success('公告已发布')
    }

    showCreateModal.value = false
    resetAnnouncementForm()
    await loadAnnouncements()
  } catch (error) {
    console.error('Failed to submit announcement:', error)
    message.error('操作失败')
  } finally {
    submitting.value = false
  }
}

const editAnnouncement = (announcement) => {
  editingId.value = announcement.id
  announcementForm.value = {
    ...announcement,
    scheduled_until: announcement.scheduled_until ? dayjs(announcement.scheduled_until) : null
  }
  showCreateModal.value = true
}

const deleteAnnouncement = async (id) => {
  try {
    await announcementsAPI.deleteAnnouncement(id)
    message.success('公告已删除')
    await loadAnnouncements()
  } catch (error) {
    console.error('Failed to delete announcement:', error)
    message.error('删除失败')
  }
}

const togglePin = async (id, isPinned) => {
  try {
    await announcementsAPI.togglePin(id, { is_pinned: isPinned })
    await loadAnnouncements()
  } catch (error) {
    console.error('Failed to toggle pin:', error)
    message.error('操作失败')
  }
}

const resetAnnouncementForm = () => {
  editingId.value = null
  announcementForm.value = {
    title: '',
    content: '',
    announcement_type: 'general',
    priority: 0,
    is_pinned: false,
    target_scope: 'all',
    show_in_notification: true,
    show_in_activity_chat: true,
    show_in_dashboard: true,
    scheduled_until: null
  }
}

// Admin Users Methods
const loadAdminUsers = async () => {
  try {
    loadingAdmins.value = true
    // TODO: 调用API获取管理员列表
    // const response = await adminAPI.getAdmins()
  } catch (error) {
    console.error('Failed to load admin users:', error)
  } finally {
    loadingAdmins.value = false
  }
}

const searchUsers = async (searchValue) => {
  try {
    // TODO: 实现用户搜索
  } catch (error) {
    console.error('Search error:', error)
  }
}

const submitAdminRole = async () => {
  try {
    submittingAdmin.value = true
    // TODO: 调用API设置管理员角色
    message.success('管理员设置成功')
    showAdminModal.value = false
  } catch (error) {
    console.error('Failed to submit admin role:', error)
    message.error('设置失败')
  } finally {
    submittingAdmin.value = false
  }
}

const removeAdmin = async (id) => {
  try {
    // TODO: 调用API移除管理员
    message.success('已移除管理员权限')
    await loadAdminUsers()
  } catch (error) {
    console.error('Failed to remove admin:', error)
    message.error('操作失败')
  }
}

// Moderation Logs Methods
const loadModerationLogs = async (page = 1) => {
  try {
    loadingModeration.value = true
    // TODO: 调用API获取审计日志
  } catch (error) {
    console.error('Failed to load moderation logs:', error)
  } finally {
    loadingModeration.value = false
  }
}

const onModerationTableChange = (pagination) => {
  paginationModeration.value = pagination
  loadModerationLogs(pagination.current)
}

// Utility Methods
const formatDate = (date) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}

const getTypeColor = (type) => {
  const colors = {
    'general': 'blue',
    'warning': 'orange',
    'important': 'red',
    'maintenance': 'purple'
  }
  return colors[type] || 'default'
}

const getActionColor = (action) => {
  const colors = {
    'delete_message': 'red',
    'delete_chat': 'orange',
    'remove_participant': 'orange',
    'ban_user': 'red'
  }
  return colors[action] || 'default'
}

// Lifecycle
onMounted(() => {
  loadAnnouncements()
  loadAdminUsers()
  loadModerationLogs()
})
</script>

<style scoped>
.admin-panel-container {
  min-height: calc(100vh - 64px);
  background-color: #f5f5f5;
  padding: 24px;
}

.admin-header {
  background: white;
  padding: 24px;
  border-radius: 8px;
  margin-bottom: 24px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
}

.admin-header h1 {
  margin: 0 0 16px 0;
  font-size: 24px;
  font-weight: 600;
}

.admin-tabs {
  display: flex;
  gap: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.tab-btn {
  padding: 12px 16px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 14px;
  color: #666;
  border-bottom: 2px solid transparent;
  transition: all 0.3s;
}

.tab-btn:hover {
  color: #1890ff;
}

.tab-btn.active {
  color: #1890ff;
  border-bottom-color: #1890ff;
}

.admin-section {
  background: white;
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.section-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.display-settings {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.role-description {
  background-color: #f5f5f5;
  padding: 12px;
  border-radius: 4px;
  font-size: 12px;
}

.role-description ul {
  margin: 8px 0 0 20px;
  padding: 0;
}

.role-description li {
  margin: 4px 0;
}

.announcements-table {
  margin-top: 24px;
}

:deep(.ant-table) {
  background: transparent;
}
</style>
