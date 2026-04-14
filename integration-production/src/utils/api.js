import axios from 'axios';

// Resolve API base URL - Local development only
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

// 创建 axios 实例
const api = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // Increased from 10s to 30s to handle longer operations
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
let isRefreshing = false;
let refreshSubscribers = [];

// Some routes must remain usable even when a stale/invalid token exists in localStorage.
// Example: password reset and email verification links opened from email.
const isPublicAuthRoute = (path) => {
  return (
    path === '/forgot-password' ||
    path === '/resend-verification' ||
    path.startsWith('/reset-password/') ||
    path.startsWith('/verify-email/')
  );
};

// 处理token刷新后的请求重试
const onRefreshed = (newToken) => {
  refreshSubscribers.map(callback => callback(newToken));
  refreshSubscribers = [];
};

// 订阅token刷新
const subscribeTokenRefresh = (callback) => {
  refreshSubscribers.push(callback);
};

// 响应拦截器 - 错误处理
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    // 网络错误或超时
    if (!error.response) {
      console.error('🌐 Network error or timeout:', error.message);
      // 不自动重定向，让组件处理
      return Promise.reject(error);
    }

    // 只在真正的认证错误时才处理
    if (error.response?.status === 401) {
      const token = localStorage.getItem('userToken');
      if (!token) {
        // 游客访问时不强制跳转登录
        return Promise.reject(error);
      }
      const currentPath = window.location.pathname;

      // // 如果已经在登录页面，不需要重定向
      // if (currentPath === '/login' || currentPath === '/register') {
      //   return Promise.reject(error);
      // }

      // 检查错误代码，只在token真的过期或无效时才处理
      const errorCode = error.response?.data?.error?.code;

      // 只有明确的token过期/无效才尝试刷新
      if (errorCode === 'TOKEN_EXPIRED' || errorCode === 'TOKEN_INVALID') {
        const originalRequest = error.config;
        const refreshToken = localStorage.getItem('refreshToken');

        if (refreshToken && !isRefreshing) {
          isRefreshing = true;

          try {
            // 调用刷新token的API
            const response = await api.post('/auth/refresh', { refresh_token: refreshToken });

            if (response.data.success) {
              const newAccessToken = response.data.data.token;
              const newRefreshToken = response.data.data.refresh_token;

              // 更新本地存储的token
              localStorage.setItem('userToken', newAccessToken);
              localStorage.setItem('refreshToken', newRefreshToken);
              // 更新API请求头
              api.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;

              // 通知所有订阅的请求使用新token重试
              isRefreshing = false;
              onRefreshed(newAccessToken);

              // 重试原请求
              originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
              return api(originalRequest);
            } else {
              // 刷新token失败，清除登录状态
              throw new Error('Failed to refresh token');
            }
          } catch (refreshError) {
            console.error('🔄 Token refresh failed:', refreshError);
            isRefreshing = false;
            
            // 清除登录状态并跳转到登录页
            localStorage.removeItem('userToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('userData');

            // 保存当前路径以便登录后返回
            // 如果已经在登录页面，不需要重定向
            if (currentPath === '/login' || currentPath === '/register') {
              return Promise.reject(error);
            } else if (isPublicAuthRoute(currentPath)) {
              // Don't kick users out of password-reset / email-verification flows.
              return Promise.reject(refreshError);
            } else {
              const returnPath = currentPath !== '/' ? currentPath : '/home';
              window.location.href = `/login?redirect=${encodeURIComponent(returnPath)}`;
              return Promise.reject(refreshError);
            }
          }
        } else if (refreshToken) {
          // 正在刷新token，将请求加入队列
          return new Promise((resolve) => {
            subscribeTokenRefresh((newToken) => {
              originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
              resolve(api(originalRequest));
            });
          });
        } else {
          // 没有refresh token，清除登录状态
          console.warn('🔐 No refresh token available, redirecting to login');
          localStorage.removeItem('userToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('userData');

          // 保存当前路径以便登录后返回
          if (currentPath === '/login' || currentPath === '/register') {
              return Promise.reject(error);
          } else if (isPublicAuthRoute(currentPath)) {
              return Promise.reject(error);
          } else {
            const returnPath = currentPath !== '/' ? currentPath : '/home';
            window.location.href = `/login?redirect=${encodeURIComponent(returnPath)}`;  
          }
        }
      } else if (errorCode === 'INVALID_CREDENTIALS') {
        // 无效的凭证，直接清除登录状态
        console.warn('🔐 Invalid credentials, redirecting to login');
        localStorage.removeItem('userToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userData');

        // 保存当前路径以便登录后返回
        if (currentPath === '/login' || currentPath === '/register') {
              return Promise.reject(error);
        } else if (isPublicAuthRoute(currentPath)) {
              return Promise.reject(error);
        } else {
          const returnPath = currentPath !== '/' ? currentPath : '/home';
          window.location.href = `/login?redirect=${encodeURIComponent(returnPath)}`;
        }
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
  wechatLogin: (data) => api.post('/auth/wechat-login', data),

  // 游客登录
  guestLogin: () => api.post('/auth/guest-login'),

  // 登出
  logout: () => api.post('/auth/logout'),

  // 验证邮箱（GET /auth/verify-email/:token）
  verifyEmail: (token) => api.get(`/auth/verify-email/${token}`),

  // 重发验证邮件
  resendVerification: (email) => api.post('/auth/resend-verification', { email }),

  // 忘记密码
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),

  // 重置密码（POST /auth/reset-password/:token）
  resetPassword: (token, newPassword) => api.post(`/auth/reset-password/${token}`, { password: newPassword }),

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

  /** Ride carpool group chat (driver + passengers who booked); active until departure + 1h */
  getRideGroupChat: (rideId) => api.get(`/carpooling/rides/${rideId}/group-chat`),
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

  // 上传图片
  uploadImage: (data) => api.post('/upload/image', data),

  // 删除图片
  deleteImage: (filename) => api.delete(`/upload/image/${filename}`),

  // 获取商品评论
  getItemComments: (itemId, params = {}) => api.get(`/marketplace/items/${itemId}/comments`, { params }),

  // 创建评论或回复
  createComment: (itemId, data) => api.post(`/marketplace/items/${itemId}/comments`, data),

  // 更新评论
  updateComment: (commentId, data) => api.put(`/marketplace/comments/${commentId}`, data),

  // 删除评论
  deleteComment: (commentId) => api.delete(`/marketplace/comments/${commentId}`),

  // 点赞评论
  likeComment: (commentId) => api.post(`/marketplace/comments/${commentId}/like`),

  // 取消点赞评论
  unlikeComment: (commentId) => api.delete(`/marketplace/comments/${commentId}/like`),
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

  // 获取未读通知数量
  getUnreadCount: () => api.get('/notifications/unread-count'),

  // 获取乘客通知 (Cindy's carpool system)
  getPassengerNotifications: (params = {}) => api.get('/notifications/passenger', { params }),

  // 响应预订请求 (接受/拒绝)
  respondToBooking: (notificationId, action) => api.post(`/notifications/${notificationId}/respond`, { action }),

  // 标记为已读
  markAsRead: (id) => api.put(`/notifications/${id}/read`),

  // 全部标记为已读
  markAllAsRead: () => api.put('/notifications/mark-all-read'),

  // 删除通知
  deleteNotification: (id) => api.delete(`/notifications/${id}`)
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
  markMessagesAsRead: (groupId) => api.put(`/groups/${groupId}/messages/read`),

  // 禁言相关
  muteUser: (groupId, userId, data) => api.post(`/groups/${groupId}/mute/${userId}`, data),
  unmuteUser: (groupId, userId) => api.delete(`/groups/${groupId}/mute/${userId}`),

  // 撤回消息
  deleteMessage: (groupId, messageId, data) => api.delete(`/groups/${groupId}/messages/${messageId}`, { data })
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

  // 检查回复状态 (NEW)
  checkReplyStatus: (threadId) => api.get(`/messages/threads/${threadId}/reply-status`),

  // 获取未读消息数量
  getUnreadCount: () => api.get('/messages/unread-count'),

  // 删除消息
  deleteMessage: (messageId) => api.delete(`/messages/${messageId}`),

  // 归档消息
  archiveMessage: (messageId) => api.put(`/messages/${messageId}/archive`),

  // User blocking functions
  getBlockedUsers: () => api.get('/messages/blocked'),
  blockUser: (userId, data = {}) => api.post(`/messages/block/${userId}`, data),
  unblockUser: (userId) => api.delete(`/messages/block/${userId}`),
  checkBlockStatus: (userId) => api.get(`/messages/block/${userId}/status`),

  // System messages (admin announcements & user feedback)
  getSystemMessages: (params = {}) => api.get('/messages/system', { params }),
  sendSystemMessage: (data) => api.post('/messages/system', data),
  markSystemMessagesAsRead: (messageIds = null) => api.put('/messages/system/read', { message_ids: messageIds }),
  getSystemMessagesUnreadCount: () => api.get('/messages/system/unread-count'),
  deleteSystemMessage: (id) => api.delete(`/messages/system/${id}`),

  // Message reactions
  addReaction: (messageId, emoji) => api.post(`/messages/${messageId}/reactions`, { emoji }),
  removeReaction: (messageId, emoji) => api.delete(`/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`),
};

// ================================================
// 评分系统相关 API
// ================================================
export const ratingAPI = {
  // 创建或更新行程评分
  createRating: (data) => api.post('/ratings', data),

  // 获取用户评分信息
  getUserRating: (userId) => api.get(`/ratings/user/${userId}`),

  // 获取行程的所有评分
  getTripRatings: (tripId) => api.get(`/ratings/trip/${tripId}`),

  // 获取用户收到的评分
  getUserReceivedRatings: (userId, params = {}) => api.get(`/ratings/received/${userId}`, { params }),

  // 检查是否可以评价行程
  canRate: (params = {}) => api.get('/ratings/can-rate', { params }),

  // ========== 活动评分 ==========

  // 创建或更新活动评分
  createActivityRating: (data) => api.post('/ratings/activity', data),

  // 获取活动的所有评分
  getActivityRatings: (activityId) => api.get(`/ratings/activity/${activityId}`),

  // 检查是否可以评价活动
  canRateActivity: (params = {}) => api.get('/ratings/activity/can-rate', { params }),
};

// ================================================
// 好友系统 API
// ================================================
export const friendsAPI = {
  // 获取好友列表
  getFriends: (params = {}) => api.get('/friends', { params }),

  // 添加好友 (with optional intro message)
  addFriend: (userId, data = {}) => api.post(`/friends/${userId}`, data),

  // 删除好友
  removeFriend: (userId) => api.delete(`/friends/${userId}`),

  // 检查好友状态
  checkFriendStatus: (userId) => api.get(`/friends/${userId}/status`),

  // 获取好友请求
  getFriendRequests: () => api.get('/friends/requests'),

  // 接受好友请求
  acceptFriendRequest: (requestId) => api.post(`/friends/requests/${requestId}/accept`),

  // 拒绝好友请求
  rejectFriendRequest: (requestId) => api.post(`/friends/requests/${requestId}/reject`),
};

// ================================================
// Activity 群聊 API
// ================================================
export const activityChatAPI = {
  // 获取 Activity 群聊消息
  getMessages: (activityId, params = {}) => api.get(`/activities/${activityId}/chat`, { params }),

  // 发送群聊消息
  sendMessage: (activityId, data) => api.post(`/activities/${activityId}/chat`, data),

  // 删除群聊消息
  deleteMessage: (activityId, messageId) => api.delete(`/activities/${activityId}/chat/${messageId}`),

  // 获取群聊成员
  getMembers: (activityId) => api.get(`/activities/${activityId}/chat/members`),

  // 标记消息已读
  markAsRead: (activityId) => api.put(`/activities/${activityId}/chat/read`),
};

// ================================================
// 上传相关 API
// ================================================
export const uploadAPI = {
  // 上传图片
  uploadImage: (formData) => api.post('/upload/image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }),

  // 删除图片
  deleteImage: (filename) => api.delete(`/upload/image/${filename}`),
};

// ================================================
// 管理员 API
// ================================================
export const adminAPI = {
  // 检查是否是管理员
  checkAdmin: () => api.get('/admin/dashboard'),

  // 获取仪表盘统计
  getDashboardStats: (params = {}) => api.get('/admin/dashboard', { params }),

  // 获取拼车统计
  getRideStats: (params = {}) => api.get('/admin/stats/rides', { params }),

  // 获取二手市场统计
  getMarketplaceStats: (params = {}) => api.get('/admin/stats/marketplace', { params }),

  // 获取活动统计
  getActivityStats: (params = {}) => api.get('/admin/stats/activities', { params }),

  // 获取积分排行
  getPointsLeaderboard: (params = {}) => api.get('/admin/stats/points', { params }),

  // 获取用户列表
  getUserList: (params = {}) => api.get('/admin/users', { params }),

  // 封禁用户
  banUser: (userId, reason) => api.post(`/admin/users/${userId}/ban`, { reason }),

  // 解封用户
  unbanUser: (userId) => api.post(`/admin/users/${userId}/unban`),

  // 删除用户账户（完全注销）
  deleteUser: (userId) => api.delete(`/admin/users/${userId}`),

  // 获取积分规则配置
  getPointsConfig: () => api.get('/admin/points/config'),

  // 更新积分规则配置
  updatePointsConfig: (data) => api.put('/admin/points/config', data),

  // 获取功能设置
  getFeatureSettings: () => api.get('/admin/features/settings'),

  // 更新功能设置
  updateFeatureSettings: (data) => api.put('/admin/features/settings', data),

  // 检查积分排行功能是否开启（公开接口）
  checkPointsRankingEnabled: () => api.get('/admin/features/points-ranking'),
};

// ================================================
// 用户资料相关 API
// ================================================
export const userProfileAPI = {
  // 获取用户完整资料
  getUserProfile: (userId) => api.get(`/users/${userId}/profile`),

  // 获取用户历史记录
  getUserHistory: (userId, params = {}) => api.get(`/users/${userId}/history`, { params }),

  // 更新用户资料
  updateUserProfile: (data) => api.put('/users/me', data),

  // 上传用户头像
  uploadAvatar: (data) => api.post('/users/avatar', data),

  // 获取用户积分历史
  getUserPointsHistory: (userId, params = {}) => api.get(`/users/${userId}/points/history`, { params }),

  // 获取用户优惠券
  getUserCoupons: (userId, params = {}) => api.get(`/users/${userId}/coupons`, { params }),

  // 使用优惠券
  useCoupon: (couponId) => api.post(`/users/coupons/${couponId}/use`),

  // ========== 隐私设置 ==========

  // 获取隐藏排名状态
  getHideRankStatus: () => api.get('/users/privacy/hide-rank'),

  // 切换隐藏排名
  toggleHideRank: (hide_rank) => api.put('/users/privacy/hide-rank', { hide_rank }),
};

// ================================================
// 系统公告相关 API
// ================================================
export const announcementsAPI = {
  // 获取活跃公告列表
  getAnnouncements: (params = {}) => api.get('/announcements', { params }),

  // 创建公告 (管理员)
  createAnnouncement: (data) => api.post('/announcements', data),

  // 更新公告 (管理员)
  updateAnnouncement: (id, data) => api.put(`/announcements/${id}`, data),

  // 删除公告 (管理员)
  deleteAnnouncement: (id) => api.delete(`/announcements/${id}`),

  // 置顶/取消置顶公告 (管理员)
  togglePin: (id, data) => api.post(`/announcements/${id}/pin`, data)
};

// 导出默认API实例
export default api;
