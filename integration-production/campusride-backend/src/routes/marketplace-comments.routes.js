import express from 'express';
import {
  getItemComments,
  createComment,
  likeComment,
  unlikeComment,
  deleteComment
} from '../controllers/marketplace-comments.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Get comments for an item (public)
router.get('/items/:itemId/comments', getItemComments);

// Create comment (requires auth)
router.post('/items/:itemId/comments', authenticateToken, createComment);

// Like/unlike comment (requires auth)
router.post('/comments/:commentId/like', authenticateToken, likeComment);
router.delete('/comments/:commentId/like', authenticateToken, unlikeComment);

// Delete comment (requires auth)
router.delete('/comments/:commentId', authenticateToken, deleteComment);

export default router;
