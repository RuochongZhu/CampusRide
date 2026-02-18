<template>
  <div class="admin-container">
    <!-- Access Denied -->
    <div v-if="accessDenied" class="access-denied">
      <a-result
        status="403"
        title="Access Denied"
        sub-title="You don't have permission to access the admin panel."
      >
        <template #extra>
          <a-button type="primary" @click="$router.push('/home')">
            Back to Home
          </a-button>
        </template>
      </a-result>
    </div>

    <!-- Admin Panel -->
    <div v-else-if="!loading" class="admin-panel">
      <div class="admin-header">
        <h1><SettingOutlined /> Admin Panel</h1>
        <p>Platform management dashboard for authorized administrators</p>
      </div>

      <!-- Period Selector -->
      <div class="period-selector">
        <a-radio-group v-model:value="period" button-style="solid" @change="loadAllStats">
          <a-radio-button value="day">Today</a-radio-button>
          <a-radio-button value="week">This Week</a-radio-button>
          <a-radio-button value="month">This Month</a-radio-button>
          <a-radio-button value="all">All Time</a-radio-button>
        </a-radio-group>
        <div class="custom-date-range">
          <a-range-picker
            v-model:value="dateRange"
            :placeholder="['Start Date', 'End Date']"
            @change="handleDateRangeChange"
          />
        </div>
      </div>

      <!-- Dashboard Stats Cards -->
      <div class="stats-cards">
        <a-card class="stat-card rides">
          <template #title>
            <CarOutlined /> Rides
          </template>
          <div class="stat-value">{{ dashboardStats.rides || 0 }}</div>
          <div class="stat-label">Total rides in period</div>
        </a-card>

        <a-card class="stat-card marketplace">
          <template #title>
            <ShopOutlined /> Marketplace
          </template>
          <div class="stat-value">{{ dashboardStats.marketplace_items || 0 }}</div>
          <div class="stat-label">Items listed</div>
        </a-card>

        <a-card class="stat-card activities">
          <template #title>
            <CalendarOutlined /> Activities
          </template>
          <div class="stat-value">{{ dashboardStats.activities || 0 }}</div>
          <div class="stat-label">Activities created</div>
        </a-card>

        <a-card class="stat-card users">
          <template #title>
            <UserOutlined /> New Users
          </template>
          <div class="stat-value">{{ dashboardStats.new_users || 0 }}</div>
          <div class="stat-label">Users registered</div>
        </a-card>
      </div>

      <!-- Feature Toggle Card -->
      <a-card class="feature-toggle-card" style="margin-bottom: 24px;">
        <template #title>
          <SettingOutlined /> Feature Settings
        </template>
        <div class="feature-toggle-item">
          <div class="feature-info">
            <h4><TrophyOutlined /> Points & Ranking</h4>
            <p>Enable or disable the points system and leaderboard for all users</p>
          </div>
          <a-switch
            :checked="pointsRankingEnabled"
            :loading="featureSettingsLoading"
            @change="togglePointsRanking"
          />
        </div>
      </a-card>

      <!-- Tabs for detailed stats -->
      <a-tabs v-model:activeKey="activeTab" class="admin-tabs">
        <!-- Rides Tab -->
        <a-tab-pane key="rides" tab="Rides Statistics">
          <div class="tab-content">
            <div class="stat-breakdown">
              <h3>Status Breakdown</h3>
              <div class="breakdown-items">
                <div v-for="(count, status) in rideStats.status_breakdown" :key="status" class="breakdown-item">
                  <a-tag :color="getStatusColor(status)">{{ status }}</a-tag>
                  <span class="count">{{ count }}</span>
                </div>
              </div>
            </div>
            <div class="stat-info">
              <p><strong>Total Rides:</strong> {{ rideStats.total || 0 }}</p>
              <p><strong>Average Price:</strong> ${{ rideStats.average_price || '0.00' }}</p>
            </div>
          </div>
        </a-tab-pane>

        <!-- Marketplace Tab -->
        <a-tab-pane key="marketplace" tab="Marketplace Statistics">
          <div class="tab-content">
            <div class="stat-breakdown">
              <h3>Status Breakdown</h3>
              <div class="breakdown-items">
                <div v-for="(count, status) in marketplaceStats.status_breakdown" :key="status" class="breakdown-item">
                  <a-tag :color="getStatusColor(status)">{{ status }}</a-tag>
                  <span class="count">{{ count }}</span>
                </div>
              </div>
            </div>
            <div class="stat-breakdown">
              <h3>Category Breakdown</h3>
              <div class="breakdown-items">
                <div v-for="(count, category) in marketplaceStats.category_breakdown" :key="category" class="breakdown-item">
                  <a-tag color="blue">{{ category }}</a-tag>
                  <span class="count">{{ count }}</span>
                </div>
              </div>
            </div>
            <div class="stat-info">
              <p><strong>Total Items:</strong> {{ marketplaceStats.total || 0 }}</p>
              <p><strong>Average Price:</strong> ${{ marketplaceStats.average_price || '0.00' }}</p>
            </div>
          </div>
        </a-tab-pane>

        <!-- Activities Tab -->
        <a-tab-pane key="activities" tab="Activities Statistics">
          <div class="tab-content">
            <div class="stat-breakdown">
              <h3>Status Breakdown</h3>
              <div class="breakdown-items">
                <div v-for="(count, status) in activityStats.status_breakdown" :key="status" class="breakdown-item">
                  <a-tag :color="getStatusColor(status)">{{ status }}</a-tag>
                  <span class="count">{{ count }}</span>
                </div>
              </div>
            </div>
            <div class="stat-breakdown">
              <h3>Type Breakdown</h3>
              <div class="breakdown-items">
                <div v-for="(count, type) in activityStats.type_breakdown" :key="type" class="breakdown-item">
                  <a-tag color="purple">{{ type }}</a-tag>
                  <span class="count">{{ count }}</span>
                </div>
              </div>
            </div>
            <div class="stat-info">
              <p><strong>Total Activities:</strong> {{ activityStats.total || 0 }}</p>
              <p><strong>Total Participants:</strong> {{ activityStats.total_participants || 0 }}</p>
            </div>
          </div>
        </a-tab-pane>

        <!-- Points Leaderboard Tab -->
        <a-tab-pane key="points" tab="Points Leaderboard">
          <a-table
            :columns="leaderboardColumns"
            :data-source="pointsLeaderboard"
            :pagination="{ pageSize: 10 }"
            row-key="id"
            size="small"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'rank'">
                <a-badge
                  v-if="record.rank <= 3"
                  :count="record.rank"
                  :number-style="{ backgroundColor: getRankColor(record.rank) }"
                />
                <span v-else>{{ record.rank }}</span>
              </template>
              <template v-if="column.key === 'status'">
                <a-tag v-if="record.is_banned" color="red">Banned</a-tag>
                <a-tag v-else color="green">Active</a-tag>
              </template>
            </template>
          </a-table>
        </a-tab-pane>

        <!-- User Management Tab -->
        <a-tab-pane key="users" tab="User Management">
          <div class="user-search">
            <a-input-search
              v-model:value="userSearch"
              placeholder="Search by name or email..."
              style="max-width: 400px"
              @search="loadUsers"
            />
          </div>
          <a-table
            :columns="userColumns"
            :data-source="users"
            :loading="usersLoading"
            :pagination="userPagination"
            row-key="id"
            size="small"
            @change="handleUserTableChange"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'email'">
                <span class="masked-email">{{ record.email_masked }}</span>
              </template>
              <template v-if="column.key === 'status'">
                <a-tag v-if="record.is_banned" color="red">Banned</a-tag>
                <a-tag v-else color="green">Active</a-tag>
              </template>
              <template v-if="column.key === 'actions'">
                <a-space>
                  <a-popconfirm
                    v-if="!record.is_banned"
                    title="Are you sure you want to ban this user?"
                    ok-text="Yes, Ban"
                    cancel-text="Cancel"
                    @confirm="handleBanUser(record)"
                  >
                    <a-button type="primary" danger size="small">
                      <StopOutlined /> Ban
                    </a-button>
                  </a-popconfirm>
                  <a-popconfirm
                    v-else
                    title="Are you sure you want to unban this user?"
                    ok-text="Yes, Unban"
                    cancel-text="Cancel"
                    @confirm="handleUnbanUser(record)"
                  >
                    <a-button type="primary" size="small">
                      <CheckOutlined /> Unban
                    </a-button>
                  </a-popconfirm>
                  <a-popconfirm
                    title="Delete this user's account permanently? This will remove ALL their data and cannot be undone."
                    ok-text="Yes, Delete"
                    cancel-text="Cancel"
                    ok-type="danger"
                    @confirm="handleDeleteUser(record)"
                  >
                    <a-button danger size="small">
                      <DeleteOutlined /> Delete
                    </a-button>
                  </a-popconfirm>
                </a-space>
              </template>
            </template>
          </a-table>
        </a-tab-pane>

        <!-- Leaderboard Export Tab -->
        <a-tab-pane key="leaderboard-export" tab="Export Leaderboard">
          <div class="tab-content">
            <a-card title="Download User Email List for Merchant Promotions">
              <a-alert
                type="info"
                message="Merchant Coupon Distribution"
                description="Download the email list of top-ranked users to send promotional coupons. Share this CSV with partner merchants."
                style="margin-bottom: 24px"
              />

              <a-form layout="vertical" :model="exportForm">
                <a-row :gutter="16">
                  <a-col :span="8">
                    <a-form-item label="Time Period">
                      <a-select v-model:value="exportForm.period" style="width: 100%">
                        <a-select-option value="day">Today</a-select-option>
                        <a-select-option value="week">This Week</a-select-option>
                        <a-select-option value="month">This Month</a-select-option>
                        <a-select-option value="all">All Time</a-select-option>
                      </a-select>
                    </a-form-item>
                  </a-col>

                  <a-col :span="8">
                    <a-form-item label="Number of Users (Top N)">
                      <a-input-number
                        v-model:value="exportForm.limit"
                        :min="10"
                        :max="500"
                        placeholder="e.g., 100"
                        style="width: 100%"
                      />
                    </a-form-item>
                  </a-col>

                  <a-col :span="8">
                    <a-form-item label="Sort By">
                      <a-select v-model:value="exportForm.sortBy" style="width: 100%">
                        <a-select-option value="points">Points (Highest)</a-select-option>
                        <a-select-option value="rating">Rating (Highest)</a-select-option>
                        <a-select-option value="activities">Activities (Most)</a-select-option>
                      </a-select>
                    </a-form-item>
                  </a-col>
                </a-row>

                <a-row :gutter="16">
                  <a-col :span="8">
                    <a-button
                      type="primary"
                      @click="downloadLeaderboardCSV"
                      :loading="exportingLeaderboard"
                      block
                    >
                      <DownloadOutlined /> Download as CSV
                    </a-button>
                  </a-col>
                  <a-col :span="8">
                    <a-button
                      @click="previewLeaderboard"
                      :loading="loadingPreview"
                      block
                    >
                      <EyeOutlined /> Preview Data
                    </a-button>
                  </a-col>
                  <a-col :span="8">
                    <a-button
                      @click="copyEmailsToClipboard"
                      :loading="copyingEmails"
                      block
                    >
                      <CopyOutlined /> Copy Emails Only
                    </a-button>
                  </a-col>
                </a-row>
              </a-form>

              <!-- Preview Table -->
              <div v-if="showLeaderboardPreview" style="margin-top: 24px">
                <a-divider>Preview (Top {{ leaderboardPreviewData.length }} Users)</a-divider>
                <a-table
                  :columns="leaderboardPreviewColumns"
                  :data-source="leaderboardPreviewData"
                  :pagination="{ pageSize: 10 }"
                  row-key="rank"
                  size="small"
                >
                  <template #bodyCell="{ column, record }">
                    <template v-if="column.key === 'rank'">
                      <a-badge
                        v-if="record.rank <= 3"
                        :count="record.rank"
                        :number-style="{ backgroundColor: getRankColor(record.rank) }"
                      />
                      <span v-else>{{ record.rank }}</span>
                    </template>
                    <template v-if="column.key === 'rating'">
                      <a-rate :value="record.avg_rating" disabled allow-half :count="5" style="font-size: 12px" />
                    </template>
                  </template>
                </a-table>
              </div>
            </a-card>
          </div>
        </a-tab-pane>
      </a-tabs>

      <!-- Points Config Tab - Add as new section -->
      <a-card title="Points Configuration" style="margin-top: 24px;" v-if="activeTab === 'points-config'">
        <a-alert
          type="info"
          message="Edit Points Rules"
          description="Configure how many points users earn for different activities. Changes take effect immediately."
          style="margin-bottom: 24px"
        />

        <a-spin :spinning="loadingPointsConfig">
          <a-form layout="vertical">
            <a-row :gutter="16">
              <a-col :span="8" v-for="(value, key) in pointsConfig" :key="key">
                <a-form-item :label="formatPointsLabel(key)">
                  <a-input-number
                    v-model:value="pointsConfig[key]"
                    :min="0"
                    :max="1000"
                    style="width: 100%"
                  />
                </a-form-item>
              </a-col>
            </a-row>
            <a-form-item>
              <a-button type="primary" @click="savePointsConfig" :loading="savingPointsConfig">
                Save Points Configuration
              </a-button>
            </a-form-item>
          </a-form>
        </a-spin>
      </a-card>

      <!-- Ban User Modal -->
      <a-modal
        v-model:open="showBanModal"
        title="Ban User"
        @ok="confirmBanUser"
        :confirm-loading="banLoading"
      >
        <p>Please provide a reason for banning this user:</p>
        <a-textarea
          v-model:value="banReason"
          placeholder="Enter ban reason..."
          :rows="3"
        />
      </a-modal>
    </div>

    <!-- Loading State -->
    <div v-else class="loading-state">
      <a-spin size="large" />
      <p>Checking admin access...</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { message } from 'ant-design-vue'
import {
  SettingOutlined,
  CarOutlined,
  ShopOutlined,
  CalendarOutlined,
  UserOutlined,
  TrophyOutlined,
  StopOutlined,
  CheckOutlined,
  DownloadOutlined,
  EyeOutlined,
  CopyOutlined,
  DeleteOutlined
} from '@ant-design/icons-vue'
import dayjs from 'dayjs'
import { adminAPI } from '@/utils/api'
import { getPublicNameFromRaw } from '@/utils/publicName'

// State
const loading = ref(true)
const accessDenied = ref(false)
const period = ref('week')
const dateRange = ref(null)
const activeTab = ref('rides')

// Feature settings
const pointsRankingEnabled = ref(false)
const featureSettingsLoading = ref(false)

// Stats data
const dashboardStats = ref({})
const rideStats = ref({})
const marketplaceStats = ref({})
const activityStats = ref({})
const pointsLeaderboard = ref([])

// User management
const users = ref([])
const usersLoading = ref(false)
const userSearch = ref('')
const userPagination = ref({
  current: 1,
  pageSize: 20,
  total: 0
})

// Ban modal
const showBanModal = ref(false)
const banReason = ref('')
const banLoading = ref(false)
const userToBan = ref(null)

// Table columns
const leaderboardColumns = [
  { title: 'Rank', dataIndex: 'rank', key: 'rank', width: 80 },
  { title: 'Name', dataIndex: 'name', key: 'name' },
  { title: 'Domain', dataIndex: 'email_domain', key: 'email_domain' },
  { title: 'Points', dataIndex: 'points', key: 'points', sorter: (a, b) => a.points - b.points },
  { title: 'Rides', dataIndex: 'total_carpools', key: 'total_carpools' },
  { title: 'Activities', dataIndex: 'total_activities', key: 'total_activities' },
  { title: 'Sales', dataIndex: 'total_sales', key: 'total_sales' },
  { title: 'Status', key: 'status', width: 100 }
]

const userColumns = [
  { title: 'Name', dataIndex: 'first_name', key: 'name', customRender: ({ record }) => getPublicNameFromRaw(record.first_name, record.last_name, record.email, 'Anonymous') },
  { title: 'Email (Masked)', key: 'email' },
  { title: 'Points', dataIndex: 'points', key: 'points' },
  { title: 'Rides', dataIndex: 'total_carpools', key: 'total_carpools' },
  { title: 'Activities', dataIndex: 'total_activities', key: 'total_activities' },
  { title: 'Status', key: 'status', width: 100 },
  { title: 'Actions', key: 'actions', width: 120 }
]

// ===== Leaderboard Export =====
const exportForm = ref({
  period: 'week',
  limit: 100,
  sortBy: 'points'
})
const exportingLeaderboard = ref(false)
const loadingPreview = ref(false)
const copyingEmails = ref(false)
const showLeaderboardPreview = ref(false)
const leaderboardPreviewData = ref([])

// ===== Points Configuration =====
const pointsConfig = ref({
  carpool_driver: 10,
  carpool_passenger: 5,
  activity_create: 15,
  activity_join: 5,
  activity_checkin: 10,
  marketplace_post: 3,
  marketplace_sale: 8,
  daily_login: 1
})
const loadingPointsConfig = ref(false)
const savingPointsConfig = ref(false)

const leaderboardPreviewColumns = [
  { title: 'Rank', dataIndex: 'rank', key: 'rank', width: 60 },
  { title: 'Email', dataIndex: 'email', key: 'email', width: 250 },
  { title: 'Name', dataIndex: 'name', key: 'name', width: 150 },
  { title: 'Points', dataIndex: 'points', key: 'points', width: 100 },
  { title: 'Rating', dataIndex: 'avg_rating', key: 'rating', width: 120 }
]

// Helper functions
const getStatusColor = (status) => {
  const colors = {
    active: 'green',
    open: 'green',
    available: 'blue',
    pending: 'orange',
    completed: 'purple',
    cancelled: 'red',
    expired: 'gray',
    sold: 'cyan'
  }
  return colors[status?.toLowerCase()] || 'default'
}

const getRankColor = (rank) => {
  if (rank === 1) return '#ffd700'
  if (rank === 2) return '#c0c0c0'
  if (rank === 3) return '#cd7f32'
  return '#1890ff'
}

// Load functions
const loadDashboardStats = async () => {
  try {
    const params = { period: period.value }
    if (dateRange.value && dateRange.value.length === 2) {
      params.start_date = dateRange.value[0].format('YYYY-MM-DD')
      params.end_date = dateRange.value[1].format('YYYY-MM-DD')
    }
    const response = await adminAPI.getDashboardStats(params)
    dashboardStats.value = response.data?.data?.stats || {}
  } catch (error) {
    console.error('Failed to load dashboard stats:', error)
  }
}

const loadRideStats = async () => {
  try {
    const params = { period: period.value }
    if (dateRange.value && dateRange.value.length === 2) {
      params.start_date = dateRange.value[0].format('YYYY-MM-DD')
      params.end_date = dateRange.value[1].format('YYYY-MM-DD')
    }
    const response = await adminAPI.getRideStats(params)
    rideStats.value = response.data?.data || {}
  } catch (error) {
    console.error('Failed to load ride stats:', error)
  }
}

const loadMarketplaceStats = async () => {
  try {
    const params = { period: period.value }
    if (dateRange.value && dateRange.value.length === 2) {
      params.start_date = dateRange.value[0].format('YYYY-MM-DD')
      params.end_date = dateRange.value[1].format('YYYY-MM-DD')
    }
    const response = await adminAPI.getMarketplaceStats(params)
    marketplaceStats.value = response.data?.data || {}
  } catch (error) {
    console.error('Failed to load marketplace stats:', error)
  }
}

const loadActivityStats = async () => {
  try {
    const params = { period: period.value }
    if (dateRange.value && dateRange.value.length === 2) {
      params.start_date = dateRange.value[0].format('YYYY-MM-DD')
      params.end_date = dateRange.value[1].format('YYYY-MM-DD')
    }
    const response = await adminAPI.getActivityStats(params)
    activityStats.value = response.data?.data || {}
  } catch (error) {
    console.error('Failed to load activity stats:', error)
  }
}

const loadPointsLeaderboard = async () => {
  try {
    const params = { period: period.value, limit: 50 }
    const response = await adminAPI.getPointsLeaderboard(params)
    pointsLeaderboard.value = response.data?.data?.users || []
  } catch (error) {
    console.error('Failed to load points leaderboard:', error)
  }
}

const loadUsers = async () => {
  try {
    usersLoading.value = true
    const params = {
      page: userPagination.value.current,
      limit: userPagination.value.pageSize
    }
    if (userSearch.value) {
      params.search = userSearch.value
    }
    const response = await adminAPI.getUserList(params)
    users.value = response.data?.data?.users || []
    userPagination.value.total = response.data?.data?.pagination?.total || 0
  } catch (error) {
    console.error('Failed to load users:', error)
  } finally {
    usersLoading.value = false
  }
}

const loadAllStats = async () => {
  await Promise.all([
    loadDashboardStats(),
    loadRideStats(),
    loadMarketplaceStats(),
    loadActivityStats(),
    loadPointsLeaderboard()
  ])
}

const handleDateRangeChange = () => {
  loadAllStats()
}

const handleUserTableChange = (pagination) => {
  userPagination.value.current = pagination.current
  userPagination.value.pageSize = pagination.pageSize
  loadUsers()
}

const handleBanUser = (user) => {
  userToBan.value = user
  banReason.value = ''
  showBanModal.value = true
}

const confirmBanUser = async () => {
  if (!userToBan.value) return

  try {
    banLoading.value = true
    await adminAPI.banUser(userToBan.value.id, banReason.value)
    message.success('User has been banned')
    showBanModal.value = false
    loadUsers()
  } catch (error) {
    console.error('Failed to ban user:', error)
    message.error(error.response?.data?.error?.message || 'Failed to ban user')
  } finally {
    banLoading.value = false
  }
}

const handleUnbanUser = async (user) => {
  try {
    await adminAPI.unbanUser(user.id)
    message.success('User has been unbanned')
    loadUsers()
  } catch (error) {
    console.error('Failed to unban user:', error)
    message.error(error.response?.data?.error?.message || 'Failed to unban user')
  }
}

const handleDeleteUser = async (user) => {
  try {
    await adminAPI.deleteUser(user.id)
    message.success('User account has been permanently deleted')
    loadUsers()
  } catch (error) {
    console.error('Failed to delete user:', error)
    message.error(error.response?.data?.error?.message || 'Failed to delete user')
  }
}

// ===== Leaderboard Export Methods =====
const fetchLeaderboardData = async () => {
  const params = {
    period: exportForm.value.period,
    limit: exportForm.value.limit,
    sort_by: exportForm.value.sortBy,
    include_email: true // Request full emails for admin export
  }
  const response = await adminAPI.getPointsLeaderboard(params)
  const users = response.data?.data?.users || []

  // Add rank to each user
  return users.map((user, index) => ({
    ...user,
    rank: index + 1,
    name: getPublicNameFromRaw(user.first_name, user.last_name, user.email, 'Anonymous'),
    email: user.email || 'N/A',
    avg_rating: user.avg_rating || 0
  }))
}

const previewLeaderboard = async () => {
  try {
    loadingPreview.value = true
    leaderboardPreviewData.value = await fetchLeaderboardData()
    showLeaderboardPreview.value = true
  } catch (error) {
    console.error('Failed to preview leaderboard:', error)
    message.error('Failed to load preview data')
  } finally {
    loadingPreview.value = false
  }
}

const downloadLeaderboardCSV = async () => {
  try {
    exportingLeaderboard.value = true
    const data = await fetchLeaderboardData()

    if (data.length === 0) {
      message.warning('No data to export')
      return
    }

    // Generate CSV content
    const headers = ['Rank', 'Email', 'Name', 'Points', 'Rating', 'Total Rides', 'Total Activities']
    const csvRows = [headers.join(',')]

    for (const user of data) {
      const row = [
        user.rank,
        `"${user.email}"`, // Quote email to handle special characters
        `"${user.name}"`,
        user.points || 0,
        (user.avg_rating || 0).toFixed(2),
        user.total_carpools || 0,
        user.total_activities || 0
      ]
      csvRows.push(row.join(','))
    }

    const csvContent = csvRows.join('\n')

    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)

    const periodLabel = exportForm.value.period
    const timestamp = dayjs().format('YYYYMMDD_HHmmss')
    link.setAttribute('href', url)
    link.setAttribute('download', `campusgo_leaderboard_${periodLabel}_top${exportForm.value.limit}_${timestamp}.csv`)
    link.style.visibility = 'hidden'

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    message.success(`Downloaded ${data.length} user records`)
  } catch (error) {
    console.error('Failed to download leaderboard:', error)
    message.error('Failed to generate CSV file')
  } finally {
    exportingLeaderboard.value = false
  }
}

const copyEmailsToClipboard = async () => {
  try {
    copyingEmails.value = true
    const data = await fetchLeaderboardData()

    if (data.length === 0) {
      message.warning('No emails to copy')
      return
    }

    const emails = data.map(user => user.email).filter(e => e && e !== 'N/A')
    const emailText = emails.join('\n')

    await navigator.clipboard.writeText(emailText)
    message.success(`Copied ${emails.length} email addresses to clipboard`)
  } catch (error) {
    console.error('Failed to copy emails:', error)
    message.error('Failed to copy emails to clipboard')
  } finally {
    copyingEmails.value = false
  }
}

// ===== Points Configuration Methods =====
const formatPointsLabel = (key) => {
  const labels = {
    carpool_driver: 'Carpool (Driver)',
    carpool_passenger: 'Carpool (Passenger)',
    activity_create: 'Create Activity',
    activity_join: 'Join Activity',
    activity_checkin: 'Activity Check-in',
    marketplace_post: 'Post Item',
    marketplace_sale: 'Complete Sale',
    daily_login: 'Daily Login'
  }
  return labels[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

const loadPointsConfig = async () => {
  try {
    loadingPointsConfig.value = true
    const response = await adminAPI.getPointsConfig()
    if (response.data?.success && response.data?.data) {
      pointsConfig.value = { ...pointsConfig.value, ...response.data.data }
    }
  } catch (error) {
    console.error('Failed to load points config:', error)
    // Use default values if API fails
  } finally {
    loadingPointsConfig.value = false
  }
}

const savePointsConfig = async () => {
  try {
    savingPointsConfig.value = true
    await adminAPI.updatePointsConfig(pointsConfig.value)
    message.success('Points configuration saved successfully')
  } catch (error) {
    console.error('Failed to save points config:', error)
    message.error('Failed to save points configuration')
  } finally {
    savingPointsConfig.value = false
  }
}

// Load feature settings
const loadFeatureSettings = async () => {
  try {
    featureSettingsLoading.value = true
    const response = await adminAPI.getFeatureSettings()
    if (response.data?.success) {
      pointsRankingEnabled.value = response.data.data.points_ranking_enabled
    }
  } catch (error) {
    console.error('Failed to load feature settings:', error)
  } finally {
    featureSettingsLoading.value = false
  }
}

// Toggle points & ranking feature
const togglePointsRanking = async (checked) => {
  try {
    featureSettingsLoading.value = true
    await adminAPI.updateFeatureSettings({ points_ranking_enabled: checked })
    pointsRankingEnabled.value = checked
    message.success(`Points & Ranking ${checked ? 'enabled' : 'disabled'} successfully`)
  } catch (error) {
    console.error('Failed to toggle points ranking:', error)
    message.error('Failed to update feature settings')
  } finally {
    featureSettingsLoading.value = false
  }
}

// Check admin access on mount
onMounted(async () => {
  try {
    // Try to access admin endpoint
    await adminAPI.checkAdmin()
    loading.value = false

    // Load all data
    await Promise.all([
      loadAllStats(),
      loadUsers(),
      loadPointsConfig(),
      loadFeatureSettings()
    ])
  } catch (error) {
    console.error('Admin access check failed:', error)
    if (error.response?.status === 403) {
      accessDenied.value = true
    }
    loading.value = false
  }
})
</script>

<style scoped>
.admin-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px;
}

.admin-header {
  margin-bottom: 24px;
}

.admin-header h1 {
  font-size: 28px;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.admin-header p {
  color: #666;
  margin: 0;
}

.period-selector {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.custom-date-range {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  text-align: center;
}

.stat-card .stat-value {
  font-size: 36px;
  font-weight: bold;
  margin: 16px 0 8px;
}

.stat-card .stat-label {
  color: #666;
  font-size: 14px;
}

.stat-card.rides .stat-value { color: #1890ff; }
.stat-card.marketplace .stat-value { color: #52c41a; }
.stat-card.activities .stat-value { color: #722ed1; }
.stat-card.users .stat-value { color: #fa8c16; }

.feature-toggle-card {
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8eb 100%);
}

.feature-toggle-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: white;
  border-radius: 8px;
}

.feature-toggle-item .feature-info h4 {
  margin: 0 0 4px 0;
  font-size: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.feature-toggle-item .feature-info p {
  margin: 0;
  color: #666;
  font-size: 13px;
}

.admin-tabs {
  background: white;
  border-radius: 8px;
  padding: 16px;
}

.tab-content {
  padding: 16px 0;
}

.stat-breakdown {
  margin-bottom: 24px;
}

.stat-breakdown h3 {
  font-size: 16px;
  margin-bottom: 12px;
  color: #333;
}

.breakdown-items {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.breakdown-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f5f5f5;
  border-radius: 6px;
}

.breakdown-item .count {
  font-weight: 600;
  font-size: 16px;
}

.stat-info {
  padding: 16px;
  background: #fafafa;
  border-radius: 8px;
}

.stat-info p {
  margin: 8px 0;
}

.user-search {
  margin-bottom: 16px;
}

.masked-email {
  font-family: monospace;
  color: #666;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: 16px;
}

.access-denied {
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
}

@media (max-width: 768px) {
  .stats-cards {
    grid-template-columns: repeat(2, 1fr);
  }

  .period-selector {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
