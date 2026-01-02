import express from 'express';
import {
  getNotifications,
  getUnreadCount,
  respondToNotification,
  markAsRead,
  markAllAsRead,
  getPassengerNotifications
} from '../controllers/notification.controller.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import { authenticateToken, requireRegisteredUser } from '../middleware/auth.middleware.js';

const router = express.Router();

// 所有路由都需要认证
router.use(authenticateToken, requireRegisteredUser);

// 获取司机的通知（预订请求）
// GET /api/v1/notifications
router.get('/', asyncHandler(getNotifications));

// 获取未读通知数量
// GET /api/v1/notifications/unread-count
router.get('/unread-count', asyncHandler(getUnreadCount));

// 获取乘客的通知（预订确认/拒绝）
// GET /api/v1/notifications/passenger
router.get('/passenger', asyncHandler(getPassengerNotifications));

// 响应预订请求（接受/拒绝）
// POST /api/v1/notifications/:id/respond
router.post('/:id/respond', asyncHandler(respondToNotification));

// 标记通知为已读
// PATCH /api/v1/notifications/:id/read
router.patch('/:id/read', asyncHandler(markAsRead));

// 标记所有通知为已读
// POST /api/v1/notifications/mark-all-read
router.post('/mark-all-read', asyncHandler(markAllAsRead));

export default router;
