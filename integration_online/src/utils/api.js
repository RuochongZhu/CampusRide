import axios from 'axios';

// 智能检测API地址
function getApiBaseUrl() {
  // 优先使用环境变量
  if (import.meta.env.VITE_API_BASE_URL) {
    console.log('✅ Using VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL);
    return import.meta.env.VITE_API_BASE_URL;
  }

  // 根据域名自动判断
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    console.log('🌍 Hostname:', hostname);

    // 生产域名
    if (hostname === 'campusgo.college' || hostname === 'www.campusgo.college') {
      const url = 'https://campusride-production.up.railway.app';
      console.log('✅ Production detected, using:', url);
      return url;
    }

    // 本地开发
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      const url = 'http://localhost:3001';
      console.log('💻 Development detected, using:', url);
      return url;
    }
  }

  // 默认生产环境
  const defaultUrl = 'https://campusride-production.up.railway.app';
  console.log('⚠️ Using default production URL:', defaultUrl);
  return defaultUrl;
}

const API_BASE_URL = getApiBaseUrl();
console.log('🔧 Final API_BASE_URL:', API_BASE_URL);

// 创建 axios 实例
const api = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// 请求拦截器 - 添加token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 错误处理
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // 只在真正的认证错误时才处理
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname;
      
      // 如果已经在登录页面，不需要重定向
      if (currentPath === '/login' || currentPath === '/register') {
        return Promise.reject(error);
      }
      
      // 检查错误代码，只在token真的过期或无效时才清除
      const errorCode = error.response?.data?.error?.code;
      
      // 只有明确的token过期/无效才清除并跳转
      if (errorCode === 'TOKEN_EXPIRED' || errorCode === 'TOKEN_INVALID') {
        console.warn('🔐 Token expired or invalid, redirecting to login');
        localStorage.removeItem('userToken');
        localStorage.removeItem('userData');
        
        // 保存当前路径以便登录后返回
        const returnPath = currentPath !== '/' ? currentPath : '/home';
        window.location.href = `/login?redirect=${encodeURIComponent(returnPath)}`;
      } else {
        // 其他401错误（如ACCESS_DENIED等）不清除token，只是拒绝请求
        console.log('⚠️ 401 error but not token issue:', errorCode);
      }
    }
    return Promise.reject(error);
  }
);

// 认证相关 API
export const authAPI = {
  // 注册
  register: (data) => api.post('/auth/register', data),

  // 登录
  login: (data) => api.post('/auth/login', data),

  // 登出
  logout: () => api.post('/auth/logout'),

  // 验证邮箱
  verifyEmail: (token) => api.post('/auth/verify-email', { token }),

  // 重发验证邮件
  resendVerification: (email) => api.post('/auth/resend-verification', { email }),

  // 忘记密码
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),

  // 重置密码
  resetPassword: (token, newPassword) => api.post('/auth/reset-password', { token, new_password: newPassword }),

  // 刷新Token
  refreshToken: (refreshToken) => api.post('/auth/refresh', { refresh_token: refreshToken }),
};

// 用户相关 API
export const userAPI = {
  // 获取当前用户信息
  getMe: () => api.get('/users/me'),

  // 获取用户信息
  getUser: (userId) => api.get(`/users/${userId}`),

  // 更新当前用户信息
  updateMe: (data) => api.put('/users/me', data),

  // 删除当前用户账号
  deleteMe: () => api.delete('/users/me'),
};

// 排行榜 API
export const leaderboardAPI = {
  // 获取排行榜 (分页查询)
  getLeaderboard: (params = {}) => api.get('/leaderboard', { params }),

  // 获取当前用户排名
  getMyRank: () => api.get('/leaderboard/me'),

  // 获取用户排名
  getUserRank: (userId) => api.get(`/leaderboard/${userId}`),

  // 获取排行榜统计
  getStats: () => api.get('/leaderboard/stats'),

  // 更新排行榜 (管理员)
  updateLeaderboard: () => api.post('/leaderboard/update'),
};

// 积分相关 API
export const pointsAPI = {
  // 奖励积分
  awardPoints: (data) => api.post('/points/award', data),

  // 扣除积分
  deductPoints: (data) => api.post('/points/deduct', data),

  // 获取当前用户积分
  getMyPoints: () => api.get('/points/me'),

  // 获取用户积分
  getUserPoints: (userId) => api.get(`/points/${userId}`),

  // 获取积分交易记录
  getMyTransactions: () => api.get('/points/transactions/me'),

  // 获取积分统计
  getMyStatistics: () => api.get('/points/statistics/me'),

  // 获取积分规则
  getRules: () => api.get('/points/rules'),
};

// 拼车相关 API
export const rideshareAPI = {
  // 获取拼车列表
  getRides: (params = {}) => api.get('/rideshare/rides', { params }),

  // 创建拼车
  createRide: (data) => api.post('/rideshare/rides', data),

  // 获取拼车详情
  getRide: (id) => api.get(`/rideshare/rides/${id}`),

  // 更新拼车
  updateRide: (id, data) => api.put(`/rideshare/rides/${id}`, data),

  // 删除拼车
  deleteRide: (id) => api.delete(`/rideshare/rides/${id}`),

  // 预订拼车
  bookRide: (rideId, data) => api.post(`/rideshare/rides/${rideId}/book`, data),

  // 获取我的拼车预订
  getMyBookings: () => api.get('/rideshare/bookings/me'),
};

// ================================================
// Carpooling 拼车相关 API
// ================================================
export const carpoolingAPI = {
  // 获取拼车列表
  getRides: (params = {}) => api.get('/carpooling/rides', { params }),

  // 创建拼车
  createRide: (data) => api.post('/carpooling/rides', data),

  // 获取拼车详情
  getRide: (id) => api.get(`/carpooling/rides/${id}`),

  // 更新拼车
  updateRide: (id, data) => api.put(`/carpooling/rides/${id}`, data),

  // 删除拼车
  deleteRide: (id) => api.delete(`/carpooling/rides/${id}`),

  // 预订拼车
  bookRide: (rideId, data) => api.post(`/carpooling/rides/${rideId}/book`, data),

  // 获取我发布的拼车
  getMyRides: (params = {}) => api.get('/carpooling/my-rides', { params }),

  // 获取我的拼车预订
  getMyBookings: (params = {}) => api.get('/carpooling/my-bookings', { params }),

  // 取消预订
  cancelBooking: (bookingId) => api.delete(`/carpooling/bookings/${bookingId}`),

  // 完成行程
  completeRide: (rideId) => api.post(`/carpooling/rides/${rideId}/complete`),
};

// 市场相关 API
export const marketplaceAPI = {
  // 获取商品列表
  getItems: (params = {}) => api.get('/marketplace/items', { params }),

  // 搜索商品
  searchItems: (params = {}) => api.get('/marketplace/items/search', { params }),

  // 创建商品
  createItem: (data) => api.post('/marketplace/items', data),

  // 获取商品详情
  getItem: (id) => api.get(`/marketplace/items/${id}`),

  // 更新商品
  updateItem: (id, data) => api.put(`/marketplace/items/${id}`, data),

  // 删除商品
  deleteItem: (id) => api.delete(`/marketplace/items/${id}`),

  // 获取我的商品
  getMyItems: (params = {}) => api.get('/marketplace/my-items', { params }),

  // 收藏商品
  favoriteItem: (id) => api.post(`/marketplace/items/${id}/favorite`),

  // 取消收藏
  unfavoriteItem: (id) => api.delete(`/marketplace/items/${id}/favorite`),

  // 获取我的收藏
  getMyFavorites: (params = {}) => api.get('/marketplace/favorites', { params }),
};

// 活动相关 API
export const activitiesAPI = {
  // 获取活动列表
  getActivities: (params = {}) => api.get('/activities', { params }),

  // 搜索活动
  searchActivities: (params = {}) => api.get('/activities/search', { params }),

  // 创建活动
  createActivity: (data) => api.post('/activities', data),

  // 获取活动详情
  getActivity: (id) => api.get(`/activities/${id}`),

  // 更新活动
  updateActivity: (id, data) => api.put(`/activities/${id}`, data),

  // 删除活动
  deleteActivity: (id) => api.delete(`/activities/${id}`),

  // 发布活动
  publishActivity: (id) => api.post(`/activities/${id}/publish`),

  // 参加活动
  joinActivity: (id) => api.post(`/activities/${id}/register`),

  // 退出活动
  leaveActivity: (id) => api.delete(`/activities/${id}/register`),

  // 活动签到
  checkinActivity: (id, data) => api.post(`/activities/${id}/checkin`, data),

  // 生成签到码
  generateCheckinCode: (id) => api.post(`/activities/${id}/generate-code`),

  // 获取我的活动
  getMyActivities: (params = {}) => api.get('/activities/my', { params }),

  // 获取活动参与者
  getActivityParticipants: (id) => api.get(`/activities/${id}/participants`),

  // 获取活动元数据
  getActivityMeta: () => api.get('/activities/meta'),

  // 获取历史活动
  getHistoryActivities: (params = {}) => api.get('/activities/history', { params }),

  // 清理过期活动
  cleanupActivities: () => api.post('/activities/cleanup'),

  // 获取清理统计
  getCleanupStats: () => api.get('/activities/cleanup/stats'),

  // 活动评论相关
  addComment: (activityId, data) => api.post(`/activities/${activityId}/comments`, data),
  getComments: (activityId, params = {}) => api.get(`/activities/${activityId}/comments`, { params }),
  updateComment: (activityId, commentId, data) => api.put(`/activities/${activityId}/comments/${commentId}`, data),
  deleteComment: (activityId, commentId) => api.delete(`/activities/${activityId}/comments/${commentId}`)
};

// ================================================
// 活动签到相关 API
// ================================================
export const checkinAPI = {
  // 检查签到资格
  checkEligibility: (activityId) => api.get(`/activities/${activityId}/checkin/eligibility`),

  // 执行签到
  performCheckin: (activityId, data) => api.post(`/activities/${activityId}/checkin`, data),

  // 获取活动签到统计
  getActivityStats: (activityId) => api.get(`/activities/${activityId}/checkin/stats`),

  // 获取用户签到历史
  getUserHistory: (params = {}) => api.get('/checkins/history', { params })
};

// 通知相关 API
export const notificationsAPI = {
  // 获取通知列表
  getNotifications: (params = {}) => api.get('/notifications', { params }),

  // 标记为已读
  markAsRead: (id) => api.put(`/notifications/${id}/read`),

  // 全部标记为已读
  markAllAsRead: () => api.put('/notifications/mark-all-read'),

  // 删除通知
  deleteNotification: (id) => api.delete(`/notifications/${id}`),

  // 获取未读消息数量
  getUnreadCount: () => api.get('/notifications/unread-count'),
};

// 健康检查 API
export const healthAPI = {
  // 健康检查
  check: () => api.get('/health'),
};

// ================================================
// 小组相关 API
// ================================================
export const groupAPI = {
  // 获取所有小组
  getGroups: (params) => api.get('/groups', { params }),

  // 获取我的小组
  getMyGroups: () => api.get('/groups/my'),

  // 创建小组
  createGroup: (data) => api.post('/groups', data),

  // 加入小组
  joinGroup: (groupId) => api.post(`/groups/${groupId}/join`),

  // 退出小组
  leaveGroup: (groupId) => api.delete(`/groups/${groupId}/leave`),

  // 获取小组成员
  getMembers: (groupId) => api.get(`/groups/${groupId}/members`),

  // 删除小组
  deleteGroup: (groupId) => api.delete(`/groups/${groupId}`),

  // 群组聊天相关
  getGroupMessages: (groupId, params = {}) => api.get(`/groups/${groupId}/messages`, { params }),
  sendGroupMessage: (groupId, data) => api.post(`/groups/${groupId}/messages`, data),
  deleteGroupMessage: (groupId, messageId) => api.delete(`/groups/${groupId}/messages/${messageId}`),
  markMessagesAsRead: (groupId) => api.put(`/groups/${groupId}/messages/read`)
};

// ================================================
// 想法相关 API
// ================================================
export const thoughtAPI = {
  // 获取想法列表
  getThoughts: (params) => api.get('/thoughts', { params }),

  // 获取地图上的想法点位
  getMapThoughts: (params) => api.get('/thoughts/map', { params }),

  // 获取我的想法
  getMyThoughts: () => api.get('/thoughts/my'),

  // 发布想法
  postThought: (data) => api.post('/thoughts', data),

  // 删除想法
  deleteThought: (thoughtId) => api.delete(`/thoughts/${thoughtId}`),
};

// ================================================
// 可见性相关 API
// ================================================
export const visibilityAPI = {
  // 获取我的可见性状态
  getMyVisibility: () => api.get('/visibility/my'),

  // 更新可见性
  updateVisibility: (data) => api.put('/visibility', data),

  // 获取地图上可见的用户
  getMapUsers: (params) => api.get('/visibility/map', { params }),
};

// ================================================
// 消息相关 API
// ================================================
export const messagesAPI = {
  // 发送消息
  sendMessage: (data) => api.post('/messages', data),

  // 获取消息列表
  getMessages: (params = {}) => api.get('/messages', { params }),

  // 获取消息线程
  getMessageThreads: (params = {}) => api.get('/messages/threads', { params }),

  // 获取线程中的消息
  getThreadMessages: (threadId, params = {}) => api.get(`/messages/threads/${threadId}`, { params }),

  // 回复消息线程
  replyToThread: (threadId, data) => api.post(`/messages/threads/${threadId}/reply`, data),

  // 标记线程为已读
  markThreadAsRead: (threadId) => api.put(`/messages/threads/${threadId}/read`),

  // 获取未读消息数量
  getUnreadCount: () => api.get('/messages/unread-count'),

  // 删除消息
  deleteMessage: (messageId) => api.delete(`/messages/${messageId}`),

  // 归档消息
  archiveMessage: (messageId) => api.put(`/messages/${messageId}/archive`),
};

// 导出默认API实例
export default api;
