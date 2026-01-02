import express from 'express';
import { authenticateToken, requireRegisteredUser } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import messageController from '../controllers/message.controller.js';
import systemMessageController from '../controllers/system-message.controller.js';

const router = express.Router();

// All message routes require authentication
router.use(authenticateToken);
// Messaging is for registered users only (prevents guest UUID errors)
router.use(requireRegisteredUser);

// System messages routes (for admin announcements & user feedback)
router.get('/system', asyncHandler(systemMessageController.getSystemMessages));
router.post('/system', asyncHandler(systemMessageController.sendSystemMessage));
router.put('/system/read', asyncHandler(systemMessageController.markSystemMessagesAsRead));
router.get('/system/unread-count', asyncHandler(systemMessageController.getSystemMessagesUnreadCount));
router.delete('/system/:id', asyncHandler(systemMessageController.deleteSystemMessage));

// Message CRUD operations
router.post('/', asyncHandler(messageController.sendMessage.bind(messageController)));
router.get('/', asyncHandler(messageController.getMessages.bind(messageController)));
router.get('/threads', asyncHandler(messageController.getMessageThreads.bind(messageController)));
router.get('/threads/:threadId', asyncHandler(messageController.getThreadMessages.bind(messageController)));
router.post('/threads/:threadId/reply', asyncHandler(messageController.replyToThread.bind(messageController)));
router.put('/threads/:threadId/read', asyncHandler(messageController.markThreadAsRead.bind(messageController)));
router.get('/threads/:threadId/reply-status', asyncHandler(messageController.checkReplyStatus.bind(messageController)));
router.get('/unread-count', asyncHandler(messageController.getUnreadCount.bind(messageController)));

// Message management
router.delete('/:messageId', asyncHandler(messageController.deleteMessage.bind(messageController)));
router.put('/:messageId/archive', asyncHandler(messageController.archiveMessage.bind(messageController)));

// Message reactions
router.post('/:messageId/reactions', asyncHandler(messageController.addReaction.bind(messageController)));
router.delete('/:messageId/reactions/:emoji', asyncHandler(messageController.removeReaction.bind(messageController)));

// User blocking routes
router.get('/blocked', asyncHandler(messageController.getBlockedUsers.bind(messageController)));
router.post('/block/:userId', asyncHandler(messageController.blockUser.bind(messageController)));
router.delete('/block/:userId', asyncHandler(messageController.unblockUser.bind(messageController)));
router.get('/block/:userId/status', asyncHandler(messageController.checkBlockStatus.bind(messageController)));

export default router;
