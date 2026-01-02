import express from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import {
  getFriends,
  addFriend,
  removeFriend,
  checkFriendStatus,
  getFriendRequests,
  acceptFriendRequest,
  rejectFriendRequest
} from '../controllers/friends.controller.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get friends list
router.get('/', getFriends);

// Get friend requests
router.get('/requests', getFriendRequests);

// Accept friend request
router.post('/requests/:requestId/accept', acceptFriendRequest);

// Reject friend request
router.post('/requests/:requestId/reject', rejectFriendRequest);

// Check friend status with user
router.get('/:userId/status', checkFriendStatus);

// Add friend (send request)
router.post('/:userId', addFriend);

// Remove friend
router.delete('/:userId', removeFriend);

export default router;
