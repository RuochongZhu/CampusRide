import express from 'express';
import { asyncHandler } from '../middleware/error.middleware.js';
import { authenticateToken, requireRegisteredUser } from '../middleware/auth.middleware.js';
import { body, query, param, validationResult } from 'express-validator';
import notificationService from '../services/notification.service.js';

const router = express.Router();

// All notification routes require authentication
router.use(authenticateToken);

// GET /api/v1/notifications - Get user's notifications (requires registered user)
router.get('/', 
  requireRegisteredUser,
  [
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 }),
    query('type').optional().isString(),
    query('is_read').optional().isBoolean()
  ],
  asyncHandler(async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            details: errors.array()
          }
        });
      }

      const userId = req.user.userId;
      const { limit = 20, offset = 0, type, is_read } = req.query;

      const result = await notificationService.getUserNotifications(userId, {
        limit: parseInt(limit),
        offset: parseInt(offset),
        type,
        isRead: is_read !== undefined ? is_read === 'true' : undefined
      });

      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: {
            code: 'FETCH_NOTIFICATIONS_FAILED',
            message: result.error
          }
        });
      }

      res.status(200).json({
        success: true,
        data: {
          notifications: result.notifications,
          total: result.total,
          unreadCount: result.unreadCount,
          pagination: {
            limit: parseInt(limit),
            offset: parseInt(offset),
            total: result.total
          }
        }
      });

    } catch (error) {
      console.error('❌ Get notifications error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch notifications'
        }
      });
    }
  })
);

// PUT /api/v1/notifications/:id/read - Mark notification as read (requires registered user)
router.put('/:id/read', 
  requireRegisteredUser,
  [
    param('id').isUUID().withMessage('Invalid notification ID')
  ],
  asyncHandler(async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid notification ID',
            details: errors.array()
          }
        });
      }

      const userId = req.user.userId;
      const notificationId = req.params.id;

      const result = await notificationService.markAsRead(notificationId, userId);

      if (!result.success) {
        const statusCode = result.error.includes('not found') ? 404 : 400;
        return res.status(statusCode).json({
          success: false,
          error: {
            code: 'MARK_READ_FAILED',
            message: result.error
          }
        });
      }

      res.status(200).json({
        success: true,
        message: 'Notification marked as read'
      });

    } catch (error) {
      console.error('❌ Mark notification read error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to mark notification as read'
        }
      });
    }
  })
);

// PUT /api/v1/notifications/mark-all-read - Mark all notifications as read (requires registered user)
router.put('/mark-all-read', 
  requireRegisteredUser,
  asyncHandler(async (req, res) => {
    try {
      const userId = req.user.userId;

      const result = await notificationService.markAllAsRead(userId);

      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: {
            code: 'MARK_ALL_READ_FAILED',
            message: result.error
          }
        });
      }

      res.status(200).json({
        success: true,
        message: 'All notifications marked as read',
        data: {
          markedCount: result.markedCount
        }
      });

    } catch (error) {
      console.error('❌ Mark all notifications read error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to mark all notifications as read'
        }
      });
    }
  })
);

// DELETE /api/v1/notifications/:id - Delete notification (requires registered user)
router.delete('/:id', 
  requireRegisteredUser,
  [
    param('id').isUUID().withMessage('Invalid notification ID')
  ],
  asyncHandler(async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid notification ID',
            details: errors.array()
          }
        });
      }

      const userId = req.user.userId;
      const notificationId = req.params.id;

      const result = await notificationService.deleteNotification(notificationId, userId);

      if (!result.success) {
        const statusCode = result.error.includes('not found') ? 404 : 400;
        return res.status(statusCode).json({
          success: false,
          error: {
            code: 'DELETE_NOTIFICATION_FAILED',
            message: result.error
          }
        });
      }

      res.status(200).json({
        success: true,
        message: 'Notification deleted successfully'
      });

    } catch (error) {
      console.error('❌ Delete notification error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete notification'
        }
      });
    }
  })
);

export default router;