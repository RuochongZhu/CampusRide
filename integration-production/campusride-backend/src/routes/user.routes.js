import express from 'express';
import { getProfile, updateProfile, getUserById, batchGetUsers, deleteMyAccount } from '../controllers/user.controller.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import { authenticateToken, requireRegisteredUser } from '../middleware/auth.middleware.js';

const router = express.Router();

// All user routes require authentication
router.use(authenticateToken);

// GET /api/v1/users/me - current user (frontend expects this route)
router.get('/me', asyncHandler(getProfile));

// PUT /api/v1/users/me - update current user (registered users only)
router.put('/me', requireRegisteredUser, asyncHandler(updateProfile));

// DELETE /api/v1/users/me - delete current user account (registered users only)
router.delete('/me', requireRegisteredUser, asyncHandler(deleteMyAccount));

// GET /api/v1/users/profile (guests can view their own profile)
router.get('/profile', asyncHandler(getProfile));

// PUT /api/v1/users/profile (requires registered user)
router.put('/profile', requireRegisteredUser, asyncHandler(updateProfile));

// POST /api/v1/users/batch - For batch queries (leaderboard, etc.) (guests can view)
router.post('/batch', asyncHandler(batchGetUsers));

// GET /api/v1/users/:id - For internal use by other modules (guests can view)
router.get('/:id', asyncHandler(getUserById));

export default router; 
