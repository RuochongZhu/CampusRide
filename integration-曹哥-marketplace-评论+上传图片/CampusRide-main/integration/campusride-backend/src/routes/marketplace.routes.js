import express from 'express';
import {
  createItem,
  getItems,
  getItemById,
  updateItem,
  deleteItem,
  getMyItems,
  favoriteItem,
  unfavoriteItem,
  getMyFavorites,
  searchItems
} from '../controllers/marketplace.controller.js';
import {
  getComments,
  createComment,
  deleteComment,
  updateComment,
  toggleLike,
  toggleDislike,
  getLikeStatus
} from '../controllers/marketplace-comments.controller.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import { authenticateToken, requireRegisteredUser, optionalAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

// Items management - Public endpoints (guests can view with optional auth)
// GET /api/v1/marketplace/items - List/search items
router.get('/items', optionalAuth, asyncHandler(getItems));

// GET /api/v1/marketplace/items/search
router.get('/items/search', optionalAuth, asyncHandler(searchItems));

// GET /api/v1/marketplace/items/:id - View item details (increments view count)
router.get('/items/:id', optionalAuth, asyncHandler(getItemById));

// Comments - Public read, auth required for write
// GET /api/v1/marketplace/items/:itemId/comments (guests can view)
router.get('/items/:itemId/comments', optionalAuth, asyncHandler(getComments));

// Protected endpoints - require authentication
router.use(authenticateToken);

// POST /api/v1/marketplace/items (requires registered user)
router.post('/items', requireRegisteredUser, asyncHandler(createItem));

// PUT /api/v1/marketplace/items/:id (requires registered user)
router.put('/items/:id', requireRegisteredUser, asyncHandler(updateItem));

// DELETE /api/v1/marketplace/items/:id (requires registered user)
router.delete('/items/:id', requireRegisteredUser, asyncHandler(deleteItem));

// My items (requires registered user)
// GET /api/v1/marketplace/my-items
router.get('/my-items', requireRegisteredUser, asyncHandler(getMyItems));

// Favorites management (requires registered user)
// POST /api/v1/marketplace/items/:id/favorite
router.post('/items/:id/favorite', requireRegisteredUser, asyncHandler(favoriteItem));

// DELETE /api/v1/marketplace/items/:id/favorite (requires registered user)
router.delete('/items/:id/favorite', requireRegisteredUser, asyncHandler(unfavoriteItem));

// GET /api/v1/marketplace/favorites (requires registered user)
router.get('/favorites', requireRegisteredUser, asyncHandler(getMyFavorites));

// Comments write operations (requires registered user)
// POST /api/v1/marketplace/items/:itemId/comments (requires registered user)
router.post('/items/:itemId/comments', requireRegisteredUser, asyncHandler(createComment));

// PUT /api/v1/marketplace/comments/:commentId (requires registered user)
router.put('/comments/:commentId', requireRegisteredUser, asyncHandler(updateComment));

// DELETE /api/v1/marketplace/comments/:commentId (requires registered user)
router.delete('/comments/:commentId', requireRegisteredUser, asyncHandler(deleteComment));

// POST /api/v1/marketplace/comments/:commentId/like (requires registered user)
router.post('/comments/:commentId/like', requireRegisteredUser, asyncHandler(toggleLike));

// POST /api/v1/marketplace/comments/:commentId/dislike (requires registered user)
router.post('/comments/:commentId/dislike', requireRegisteredUser, asyncHandler(toggleDislike));

// POST /api/v1/marketplace/comments/like-status (requires registered user)
router.post('/comments/like-status', requireRegisteredUser, asyncHandler(getLikeStatus));

export default router; 