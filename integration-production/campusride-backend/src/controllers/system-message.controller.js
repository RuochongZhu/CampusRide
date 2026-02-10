import systemMessageService from '../services/system-message.service.js';

/**
 * Get system messages
 * GET /messages/system
 */
export const getSystemMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const isGuest = req.user?.isGuest || req.user?.role === 'guest';
    const { limit = 100, offset = 0 } = req.query;

    const result = await systemMessageService.getSystemMessages(userId, {
      limit: parseInt(limit),
      offset: parseInt(offset),
      isGuest: isGuest
    });

    res.json(result);
  } catch (error) {
    console.error('Error getting system messages:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get system messages', code: 'SYSTEM_MESSAGE_ERROR' }
    });
  }
};

/**
 * Send a system message
 * POST /messages/system
 */
export const sendSystemMessage = async (req, res) => {
  try {
    // Check if user is guest
    if (req.user?.isGuest || req.user?.role === 'guest') {
      return res.status(403).json({
        success: false,
        error: { 
          message: 'Guest users cannot send system messages', 
          code: 'GUEST_NOT_ALLOWED' 
        }
      });
    }

    const userId = req.user.id;
    const userRole = req.user.role || 'user';
    const { content, message_type } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        error: { message: 'Message content is required', code: 'INVALID_INPUT' }
      });
    }

    // Ensure only admin can send announcement type messages
    if (message_type === 'announcement' && userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        error: { 
          message: 'Only administrators can send announcements', 
          code: 'ADMIN_ONLY' 
        }
      });
    }

    const result = await systemMessageService.sendSystemMessage(userId, userRole, {
      content,
      message_type
    });

    res.status(201).json(result);
  } catch (error) {
    console.error('Error sending system message:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to send system message', code: 'SYSTEM_MESSAGE_ERROR' }
    });
  }
};

/**
 * Mark system messages as read
 * PUT /messages/system/read
 */
export const markSystemMessagesAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { message_ids } = req.body;

    const result = await systemMessageService.markSystemMessagesAsRead(userId, message_ids);

    res.json(result);
  } catch (error) {
    console.error('Error marking system messages as read:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to mark messages as read', code: 'SYSTEM_MESSAGE_ERROR' }
    });
  }
};

/**
 * Get unread count for system messages
 * GET /messages/system/unread-count
 */
export const getSystemMessagesUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const isGuest = req.user?.isGuest || req.user?.role === 'guest';

    const result = await systemMessageService.getSystemMessagesUnreadCount(userId, isGuest);

    res.json(result);
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get unread count', code: 'SYSTEM_MESSAGE_ERROR' }
    });
  }
};

/**
 * Delete a system message
 * DELETE /messages/system/:id
 */
export const deleteSystemMessage = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role || 'user';
    const { id: messageId } = req.params;

    const result = await systemMessageService.deleteSystemMessage(messageId, userId, userRole);

    if (!result.success) {
      return res.status(403).json({
        success: false,
        error: { message: result.error, code: 'NOT_AUTHORIZED' }
      });
    }

    res.json(result);
  } catch (error) {
    console.error('Error deleting system message:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to delete system message', code: 'SYSTEM_MESSAGE_ERROR' }
    });
  }
};

export default {
  getSystemMessages,
  sendSystemMessage,
  markSystemMessagesAsRead,
  getSystemMessagesUnreadCount,
  deleteSystemMessage
};
