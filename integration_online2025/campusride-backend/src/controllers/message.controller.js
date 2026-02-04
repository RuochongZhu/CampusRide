import messageService from '../services/message.service.js';
import { body, param, query, validationResult } from 'express-validator';

class MessageController {
  // Send a new message
  async sendMessage(req, res) {
    try {
      // Validation rules (updated to support both receiver_id and receiver_email)
      await body('receiver_id').optional().isUUID().withMessage('Valid receiver ID is required').run(req);
      await body('receiver_email').optional().isEmail().withMessage('Valid receiver email is required').run(req);
      await body('subject').optional().trim().isLength({ min: 2, max: 255 }).withMessage('Subject must be 2-255 characters').run(req);
      await body('content').trim().isLength({ min: 1, max: 2000 }).withMessage('Content must be 1-2000 characters').run(req);
      await body('message_type').optional().isIn(['activity_inquiry', 'activity_update', 'general', 'support']).withMessage('Invalid message type').run(req);
      await body('context_type').optional().isString().withMessage('Context type must be string').run(req);
      await body('context_id').optional().isString().withMessage('Context ID must be string').run(req);
      await body('priority').optional().isIn(['low', 'normal', 'high']).withMessage('Invalid priority').run(req);

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Validation failed',
            details: errors.array()
          }
        });
      }

      // Check that either receiver_id or receiver_email is provided
      if (!req.body.receiver_id && !req.body.receiver_email) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Either receiver_id or receiver_email is required'
          }
        });
      }

      const userId = req.user.id;
      const messageData = {
        activityId: req.body.activityId,
        senderId: userId,
        receiverId: req.body.receiver_id,
        receiverEmail: req.body.receiver_email,
        subject: req.body.subject,
        content: req.body.content,
        messageType: req.body.message_type || 'general',
        contextType: req.body.context_type || 'general',
        contextId: req.body.context_id,
        priority: req.body.priority || 'normal'
      };

      const result = await messageService.sendMessage(messageData);

      res.status(201).json({
        success: true,
        data: result,
        message: 'Message sent successfully'
      });
    } catch (error) {
      console.error('❌ Error sending message:', error);

      // Handle reply restriction errors with specific status
      if (error.message.includes('REPLY_REQUIRED')) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'REPLY_REQUIRED',
            message: 'You must wait for the recipient to reply before sending more messages'
          }
        });
      }

      res.status(500).json({
        success: false,
        error: {
          message: error.message || 'Failed to send message'
        }
      });
    }
  }

  // Get messages for current user
  async getMessages(req, res) {
    try {
      await query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer').run(req);
      await query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100').run(req);
      await query('type').optional().isIn(['sent', 'received', 'all']).withMessage('Invalid type filter').run(req);
      await query('unreadOnly').optional().isBoolean().withMessage('unreadOnly must be boolean').run(req);

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Validation failed',
            details: errors.array()
          }
        });
      }

      const userId = req.user.id;
      const filters = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
        type: req.query.type || 'all',
        unreadOnly: req.query.unreadOnly === 'true'
      };

      const result = await messageService.getMessages(userId, filters);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('❌ Error getting messages:', error);
      res.status(500).json({
        success: false,
        error: {
          message: error.message || 'Failed to get messages'
        }
      });
    }
  }

  // Get message threads for current user
  async getMessageThreads(req, res) {
    try {
      await query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer').run(req);
      await query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100').run(req);
      await query('with_user_id').optional().isUUID().withMessage('with_user_id must be a valid UUID').run(req);

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Validation failed',
            details: errors.array()
          }
        });
      }

      const userId = req.user.id;
      const filters = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
        with_user_id: req.query.with_user_id || null
      };

      const result = await messageService.getMessageThreads(userId, filters);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('❌ Error getting message threads:', error);
      res.status(500).json({
        success: false,
        error: {
          message: error.message || 'Failed to get message threads'
        }
      });
    }
  }

  // Get messages in a specific thread
  async getThreadMessages(req, res) {
    try {
      await param('threadId').isUUID().withMessage('Valid thread ID is required').run(req);
      await query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer').run(req);
      await query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100').run(req);

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Validation failed',
            details: errors.array()
          }
        });
      }

      const userId = req.user.id;
      const { threadId } = req.params;
      const filters = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 50
      };

      const result = await messageService.getThreadMessages(userId, threadId, filters);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('❌ Error getting thread messages:', error);
      res.status(500).json({
        success: false,
        error: {
          message: error.message || 'Failed to get thread messages'
        }
      });
    }
  }

  // Reply to a message thread
  async replyToThread(req, res) {
    try {
      await param('threadId').isUUID().withMessage('Valid thread ID is required').run(req);
      await body('content').trim().isLength({ min: 1, max: 2000 }).withMessage('Content must be 1-2000 characters').run(req);
      await body('replyToId').optional().isUUID().withMessage('Valid reply-to message ID is required').run(req);

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Validation failed',
            details: errors.array()
          }
        });
      }

      const userId = req.user.id;
      const { threadId } = req.params;
      const { content, replyToId } = req.body;

      const result = await messageService.replyToThread(userId, threadId, content, replyToId);

      res.status(201).json({
        success: true,
        data: result,
        message: 'Reply sent successfully'
      });
    } catch (error) {
      console.error('❌ Error replying to thread:', error);

      // Handle reply restriction errors with specific status
      if (error.message.includes('REPLY_REQUIRED')) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'REPLY_REQUIRED',
            message: 'You must wait for the recipient to reply before sending more messages'
          }
        });
      }

      res.status(500).json({
        success: false,
        error: {
          message: error.message || 'Failed to send reply'
        }
      });
    }
  }

  // Mark thread as read
  async markThreadAsRead(req, res) {
    try {
      await param('threadId').isUUID().withMessage('Valid thread ID is required').run(req);

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Validation failed',
            details: errors.array()
          }
        });
      }

      const userId = req.user.id;
      const { threadId } = req.params;

      const result = await messageService.markThreadAsRead(userId, threadId);

      res.json({
        success: true,
        data: result,
        message: 'Thread marked as read'
      });
    } catch (error) {
      console.error('❌ Error marking thread as read:', error);
      res.status(500).json({
        success: false,
        error: {
          message: error.message || 'Failed to mark thread as read'
        }
      });
    }
  }

  // Get unread message count
  async getUnreadCount(req, res) {
    try {
      const userId = req.user.id;
      const result = await messageService.getUnreadCount(userId);

      res.json({
        success: true,
        data: { count: result }
      });
    } catch (error) {
      console.error('❌ Error getting unread count:', error);
      res.status(500).json({
        success: false,
        error: {
          message: error.message || 'Failed to get unread count'
        }
      });
    }
  }

  // Delete a message
  async deleteMessage(req, res) {
    try {
      await param('messageId').isUUID().withMessage('Valid message ID is required').run(req);

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Validation failed',
            details: errors.array()
          }
        });
      }

      const userId = req.user.id;
      const { messageId } = req.params;

      const result = await messageService.deleteMessage(userId, messageId);

      res.json({
        success: true,
        data: result,
        message: 'Message deleted successfully'
      });
    } catch (error) {
      console.error('❌ Error deleting message:', error);
      res.status(500).json({
        success: false,
        error: {
          message: error.message || 'Failed to delete message'
        }
      });
    }
  }

  // Archive a message
  async archiveMessage(req, res) {
    try {
      await param('messageId').isUUID().withMessage('Valid message ID is required').run(req);

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Validation failed',
            details: errors.array()
          }
        });
      }

      const userId = req.user.id;
      const { messageId } = req.params;

      const result = await messageService.archiveMessage(userId, messageId);

      res.json({
        success: true,
        data: result,
        message: 'Message archived successfully'
      });
    } catch (error) {
      console.error('❌ Error archiving message:', error);

      // Handle reply restriction errors with specific status
      if (error.message.includes('REPLY_REQUIRED')) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'REPLY_REQUIRED',
            message: 'You must wait for the recipient to reply before sending more messages'
          }
        });
      }

      res.status(500).json({
        success: false,
        error: {
          message: error.message || 'Failed to archive message'
        }
      });
    }
  }

  // Check reply status for a thread (NEW METHOD)
  async checkReplyStatus(req, res) {
    try {
      await param('threadId').isUUID().withMessage('Valid thread ID is required').run(req);

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Validation failed',
            details: errors.array()
          }
        });
      }

      const userId = req.user.id;
      const { threadId } = req.params;

      const result = await messageService.getReplyStatus(threadId, userId);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('❌ Error checking reply status:', error);
      res.status(500).json({
        success: false,
        error: {
          message: error.message || 'Failed to check reply status'
        }
      });
    }
  }

  // =====================
  // User Blocking Endpoints
  // =====================

  // Block a user
  async blockUser(req, res) {
    try {
      await param('userId').isUUID().withMessage('Valid user ID is required').run(req);
      await body('reason').optional().isString().isLength({ max: 500 }).withMessage('Reason must be less than 500 characters').run(req);

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Validation failed',
            details: errors.array()
          }
        });
      }

      const blockerId = req.user.id;
      const blockedId = req.params.userId;
      const { reason } = req.body;

      const result = await messageService.blockUser(blockerId, blockedId, reason);

      res.status(201).json({
        success: true,
        data: result,
        message: 'User blocked successfully'
      });
    } catch (error) {
      console.error('❌ Error blocking user:', error);

      if (error.message === 'Cannot block yourself') {
        return res.status(400).json({
          success: false,
          error: { message: error.message }
        });
      }

      if (error.message === 'User is already blocked') {
        return res.status(409).json({
          success: false,
          error: { message: error.message }
        });
      }

      res.status(500).json({
        success: false,
        error: {
          message: error.message || 'Failed to block user'
        }
      });
    }
  }

  // Unblock a user
  async unblockUser(req, res) {
    try {
      await param('userId').isUUID().withMessage('Valid user ID is required').run(req);

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Validation failed',
            details: errors.array()
          }
        });
      }

      const blockerId = req.user.id;
      const blockedId = req.params.userId;

      const result = await messageService.unblockUser(blockerId, blockedId);

      res.json({
        success: true,
        data: result,
        message: 'User unblocked successfully'
      });
    } catch (error) {
      console.error('❌ Error unblocking user:', error);

      if (error.message === 'Block relationship not found') {
        return res.status(404).json({
          success: false,
          error: { message: error.message }
        });
      }

      res.status(500).json({
        success: false,
        error: {
          message: error.message || 'Failed to unblock user'
        }
      });
    }
  }

  // Check if a user is blocked
  async checkBlockStatus(req, res) {
    try {
      await param('userId').isUUID().withMessage('Valid user ID is required').run(req);

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Validation failed',
            details: errors.array()
          }
        });
      }

      const blockerId = req.user.id;
      const blockedId = req.params.userId;

      const isBlocked = await messageService.isUserBlocked(blockerId, blockedId);
      const messagingStatus = await messageService.isMessagingBlocked(blockerId, blockedId);

      res.json({
        success: true,
        data: {
          is_blocked_by_me: isBlocked,
          messaging_blocked: messagingStatus.blocked,
          blocked_by: messagingStatus.blockedBy || null
        }
      });
    } catch (error) {
      console.error('❌ Error checking block status:', error);
      res.status(500).json({
        success: false,
        error: {
          message: error.message || 'Failed to check block status'
        }
      });
    }
  }

  // Get list of blocked users
  async getBlockedUsers(req, res) {
    try {
      const userId = req.user.id;

      const result = await messageService.getBlockedUsers(userId);

      res.json({
        success: true,
        data: {
          blocked_users: result,
          count: result.length
        }
      });
    } catch (error) {
      console.error('❌ Error getting blocked users:', error);
      res.status(500).json({
        success: false,
        error: {
          message: error.message || 'Failed to get blocked users'
        }
      });
    }
  }

  // =====================
  // Message Reactions
  // =====================

  // Add a reaction to a message
  async addReaction(req, res) {
    try {
      await param('messageId').isUUID().withMessage('Valid message ID is required').run(req);
      await body('emoji').trim().isLength({ min: 1, max: 10 }).withMessage('Emoji is required').run(req);

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Validation failed',
            details: errors.array()
          }
        });
      }

      const userId = req.user.id;
      const { messageId } = req.params;
      const { emoji } = req.body;

      const result = await messageService.addReaction(userId, messageId, emoji);

      res.status(201).json({
        success: true,
        data: result,
        message: 'Reaction added successfully'
      });
    } catch (error) {
      console.error('❌ Error adding reaction:', error);
      res.status(500).json({
        success: false,
        error: {
          message: error.message || 'Failed to add reaction'
        }
      });
    }
  }

  // Remove a reaction from a message
  async removeReaction(req, res) {
    try {
      await param('messageId').isUUID().withMessage('Valid message ID is required').run(req);
      await param('emoji').trim().isLength({ min: 1, max: 10 }).withMessage('Emoji is required').run(req);

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Validation failed',
            details: errors.array()
          }
        });
      }

      const userId = req.user.id;
      const { messageId, emoji } = req.params;

      const result = await messageService.removeReaction(userId, messageId, emoji);

      res.json({
        success: true,
        data: result,
        message: 'Reaction removed successfully'
      });
    } catch (error) {
      console.error('❌ Error removing reaction:', error);
      res.status(500).json({
        success: false,
        error: {
          message: error.message || 'Failed to remove reaction'
        }
      });
    }
  }
}

export default new MessageController();