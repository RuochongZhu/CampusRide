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
import { asyncHandler } from '../middleware/error.middleware.js';
import { authenticateToken, requireRegisteredUser } from '../middleware/auth.middleware.js';

const router = express.Router();

// All marketplace routes require authentication
router.use(authenticateToken);

// Items management
// POST /api/v1/marketplace/items (requires registered user)
router.post('/items', requireRegisteredUser, asyncHandler(createItem));

// GET /api/v1/marketplace/items - List/search items (guests can view)
router.get('/items', asyncHandler(getItems));

// GET /api/v1/marketplace/items/search (guests can view)
router.get('/items/search', asyncHandler(searchItems));

// GET /api/v1/marketplace/items/:id (guests can view)
router.get('/items/:id', asyncHandler(getItemById));

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

export default router; 