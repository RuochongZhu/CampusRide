import express from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import {
  startItemConversation,
  sendMessage,
  getUserConversations,
  getConversationMessages,
  getUnreadMessagesCount
} from '../controllers/marketplace-messages.controller.js';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     MarketplaceConversation:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         item_id:
 *           type: string
 *           format: uuid
 *         buyer_id:
 *           type: string
 *           format: uuid
 *         seller_id:
 *           type: string
 *           format: uuid
 *         status:
 *           type: string
 *           enum: [active, closed, archived]
 *         message_count:
 *           type: integer
 *         last_message_at:
 *           type: string
 *           format: date-time
 *         created_at:
 *           type: string
 *           format: date-time
 *         item:
 *           type: object
 *         other_user:
 *           type: object
 *         latest_message:
 *           type: object
 *         unread_count:
 *           type: integer
 *
 *     MarketplaceMessage:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         conversation_id:
 *           type: string
 *           format: uuid
 *         sender_id:
 *           type: string
 *           format: uuid
 *         message:
 *           type: string
 *         message_type:
 *           type: string
 *           enum: [inquiry, reply, offer, system]
 *         is_read:
 *           type: boolean
 *         created_at:
 *           type: string
 *           format: date-time
 *         sender:
 *           type: object
 */

/**
 * @swagger
 * /api/v1/marketplace/items/{itemId}/message:
 *   post:
 *     summary: Start a conversation about a marketplace item
 *     tags: [Marketplace Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 1000
 *                 description: Initial message to seller
 *     responses:
 *       201:
 *         description: Conversation started successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     conversationId:
 *                       type: string
 *                       format: uuid
 *                     message:
 *                       $ref: '#/components/schemas/MarketplaceMessage'
 *                     item:
 *                       type: object
 *                 message:
 *                   type: string
 *       400:
 *         description: Bad request or validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Item not found
 */
router.post('/items/:itemId/message', authenticateToken, startItemConversation);

/**
 * @swagger
 * /api/v1/marketplace/conversations/{conversationId}/messages:
 *   post:
 *     summary: Send a message in an existing conversation
 *     tags: [Marketplace Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 1000
 *     responses:
 *       201:
 *         description: Message sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/MarketplaceMessage'
 *                 message:
 *                   type: string
 */
router.post('/conversations/:conversationId/messages', authenticateToken, sendMessage);

/**
 * @swagger
 * /api/v1/marketplace/conversations/{conversationId}/messages:
 *   get:
 *     summary: Get messages in a conversation
 *     tags: [Marketplace Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Messages retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     messages:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/MarketplaceMessage'
 *                     conversation_id:
 *                       type: string
 *                       format: uuid
 *                     pagination:
 *                       type: object
 */
router.get('/conversations/:conversationId/messages', authenticateToken, getConversationMessages);

/**
 * @swagger
 * /api/v1/marketplace/conversations:
 *   get:
 *     summary: Get conversations for current user
 *     tags: [Marketplace Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Conversations retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/MarketplaceConversation'
 *                 pagination:
 *                   type: object
 */
router.get('/conversations', authenticateToken, getUserConversations);

/**
 * @swagger
 * /api/v1/marketplace/conversations/unread-count:
 *   get:
 *     summary: Get unread message count for marketplace conversations
 *     tags: [Marketplace Messages]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Unread count retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     count:
 *                       type: integer
 */
router.get('/conversations/unread-count', authenticateToken, getUnreadMessagesCount);

export default router;