import notificationService from '../services/notification.service.js';
import { body, query, param, validationResult } from 'express-validator';

class NotificationController {
  // Send notification (admin/system use)
  async sendNotification(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: errors.array()
          }
        });
      }

      const {
        userId,
        type,
        title,
        content,
        data,
        channels,
        priority
      } = req.body;

      const result = await notificationService.sendNotification({
        userId,
        type,
        title,
        content,
        data,
        channels,
        priority
      });

      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: {
            code: 'NOTIFICATION_SEND_FAILED',
            message: result.error
          }
        });
      }

      res.status(200).json({
        success: true,
        data: {
          notificationId: result.notificationId,
          results: result.results
        }
      });

    } catch (error) {
      console.error('❌ Send notification error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to send notification'
        }
      });
    }
  }

  // Send batch notification
  async sendBatchNotification(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: errors.array()
          }
        });
      }

      const { userIds, ...notificationOptions } = req.body;

      const result = await notificationService.sendBatchNotification(
        userIds,
        notificationOptions
      );

      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: {
            code: 'BATCH_NOTIFICATION_FAILED',
            message: result.error
          }
        });
      }

      res.status(200).json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('❌ Send batch notification error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to send batch notification'
        }
      });
    }
  }

  // Broadcast notification to all users
  async broadcastNotification(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: errors.array()
          }
        });
      }

      const result = await notificationService.broadcastNotification(req.body);

      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: {
            code: 'BROADCAST_FAILED',
            message: result.error
          }
        });
      }

      res.status(200).json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('❌ Broadcast notification error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to broadcast notification'
        }
      });
    }
  }

  // Get user notifications
  async getNotifications(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: errors.array()
          }
        });
      }

      const userId = req.user.userId;
      const {
        limit = 20,
        offset = 0,
        unreadOnly = false,
        type = null
      } = req.query;

      const result = await notificationService.getNotifications(userId, {
        limit: parseInt(limit),
        offset: parseInt(offset),
        unreadOnly: unreadOnly === 'true',
        type
      });

      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: {
            code: 'FETCH_FAILED',
            message: result.error
          }
        });
      }

      res.status(200).json({
        success: true,
        data: {
          notifications: result.notifications,
          total: result.total,
          hasMore: result.hasMore,
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
  }

  // Get unread count
  async getUnreadCount(req, res) {
    try {
      const userId = req.user.userId;

      const result = await notificationService.getUnreadCount(userId);

      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: {
            code: 'COUNT_FAILED',
            message: result.error
          }
        });
      }

      res.status(200).json({
        success: true,
        data: {
          unreadCount: result.count
        }
      });

    } catch (error) {
      console.error('❌ Get unread count error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get unread count'
        }
      });
    }
  }

  // Mark notification as read
  async markAsRead(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: errors.array()
          }
        });
      }

      const userId = req.user.userId;
      const { notificationId } = req.params;

      const result = await notificationService.markAsRead(userId, notificationId);

      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: {
            code: 'MARK_READ_FAILED',
            message: result.error
          }
        });
      }

      res.status(200).json({
        success: true,
        data: {
          notification: result.notification
        }
      });

    } catch (error) {
      console.error('❌ Mark as read error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to mark notification as read'
        }
      });
    }
  }

  // Mark all notifications as read
  async markAllAsRead(req, res) {
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
        data: {
          markedCount: result.markedCount
        }
      });

    } catch (error) {
      console.error('❌ Mark all as read error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to mark all notifications as read'
        }
      });
    }
  }

  // Delete notification
  async deleteNotification(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: errors.array()
          }
        });
      }

      const userId = req.user.userId;
      const { notificationId } = req.params;

      const result = await notificationService.deleteNotification(userId, notificationId);

      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: {
            code: 'DELETE_FAILED',
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
  }

  // Get available notification templates
  async getTemplates(req, res) {
    try {
      const templates = notificationService.getTemplates();

      res.status(200).json({
        success: true,
        data: {
          templates
        }
      });

    } catch (error) {
      console.error('❌ Get templates error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get templates'
        }
      });
    }
  }
}

// Validation middlewares
export const sendNotificationValidation = [
  body('userId').isString().notEmpty().withMessage('userId is required'),
  body('type').optional().isString(),
  body('title').optional().isString().isLength({ max: 200 }),
  body('content').isString().notEmpty().withMessage('content is required'),
  body('data').optional().isObject(),
  body('channels').optional().isArray(),
  body('priority').optional().isIn(['low', 'medium', 'high'])
];

export const batchNotificationValidation = [
  body('userIds').isArray({ min: 1 }).withMessage('userIds must be a non-empty array'),
  body('userIds.*').isString().notEmpty().withMessage('Each userId must be a non-empty string'),
  body('type').optional().isString(),
  body('title').optional().isString().isLength({ max: 200 }),
  body('content').isString().notEmpty().withMessage('content is required'),
  body('data').optional().isObject(),
  body('channels').optional().isArray(),
  body('priority').optional().isIn(['low', 'medium', 'high'])
];

export const broadcastNotificationValidation = [
  body('type').optional().isString(),
  body('title').optional().isString().isLength({ max: 200 }),
  body('content').isString().notEmpty().withMessage('content is required'),
  body('data').optional().isObject(),
  body('channels').optional().isArray(),
  body('priority').optional().isIn(['low', 'medium', 'high'])
];

export const getNotificationsValidation = [
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 }),
  query('unreadOnly').optional().isBoolean(),
  query('type').optional().isString()
];

export const notificationIdValidation = [
  param('notificationId').isUUID().withMessage('Invalid notification ID')
];

export default new NotificationController();