import express from 'express';
import { authenticateToken, optionalAuth } from '../middleware/auth.middleware.js';
import {
  getItemComments,
  createComment,
  updateComment,
  deleteComment,
  toggleCommentLike,
  getUserComments
} from '../controllers/comments.controller.js';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Comment:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         content:
 *           type: string
 *         images:
 *           type: array
 *           items:
 *             type: string
 *         is_edited:
 *           type: boolean
 *         likes_count:
 *           type: integer
 *         replies_count:
 *           type: integer
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *         user:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             first_name:
 *               type: string
 *             last_name:
 *               type: string
 *             avatar_url:
 *               type: string
 *         user_has_liked:
 *           type: boolean
 *         replies:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Comment'
 */

/**
 * @swagger
 * /api/v1/marketplace/items/{itemId}/comments:
 *   get:
 *     summary: Get comments for a marketplace item
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: itemId
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
 *           default: 10
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [created_at, likes_count]
 *           default: created_at
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: Comments retrieved successfully
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
 *                     $ref: '#/components/schemas/Comment'
 *                 pagination:
 *                   type: object
 */
router.get('/items/:itemId/comments', optionalAuth, getItemComments);

/**
 * @swagger
 * /api/v1/marketplace/items/{itemId}/comments:
 *   post:
 *     summary: Create a new comment on a marketplace item
 *     tags: [Comments]
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
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 2000
 *               parent_id:
 *                 type: string
 *                 format: uuid
 *                 description: ID of parent comment for replies
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Comment created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Comment'
 *                 message:
 *                   type: string
 */
router.post('/items/:itemId/comments', authenticateToken, createComment);

/**
 * @swagger
 * /api/v1/marketplace/comments/{commentId}:
 *   put:
 *     summary: Update a comment
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
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
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 2000
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Comment updated successfully
 */
router.put('/comments/:commentId', authenticateToken, updateComment);

/**
 * @swagger
 * /api/v1/marketplace/comments/{commentId}:
 *   delete:
 *     summary: Delete a comment
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Comment deleted successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: Comment not found
 */
router.delete('/comments/:commentId', authenticateToken, deleteComment);

/**
 * @swagger
 * /api/v1/marketplace/comments/{commentId}/like:
 *   post:
 *     summary: Toggle like on a comment
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Like toggled successfully
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
 *                     comment_id:
 *                       type: string
 *                     is_liked:
 *                       type: boolean
 *                     likes_count:
 *                       type: integer
 *                 message:
 *                   type: string
 */
router.post('/comments/:commentId/like', authenticateToken, toggleCommentLike);

/**
 * @swagger
 * /api/v1/marketplace/comments/my:
 *   get:
 *     summary: Get current user's comments
 *     tags: [Comments]
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
 *         description: User comments retrieved successfully
 */
router.get('/comments/my', authenticateToken, getUserComments);

export default router;