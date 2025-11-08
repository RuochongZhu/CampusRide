import express from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import messageController from '../controllers/message.controller.js';

const router = express.Router();

// All message routes require authentication
router.use(authenticateToken);

// Message CRUD operations
router.post('/', asyncHandler(messageController.sendMessage.bind(messageController)));
router.get('/', asyncHandler(messageController.getMessages.bind(messageController)));
router.get('/threads', asyncHandler(messageController.getMessageThreads.bind(messageController)));
router.get('/threads/:threadId', asyncHandler(messageController.getThreadMessages.bind(messageController)));
router.post('/threads/:threadId/reply', asyncHandler(messageController.replyToThread.bind(messageController)));
router.put('/threads/:threadId/read', asyncHandler(messageController.markThreadAsRead.bind(messageController)));
router.get('/unread-count', asyncHandler(messageController.getUnreadCount.bind(messageController)));

// Message management
router.delete('/:messageId', asyncHandler(messageController.deleteMessage.bind(messageController)));
router.put('/:messageId/archive', asyncHandler(messageController.archiveMessage.bind(messageController)));

export default router;