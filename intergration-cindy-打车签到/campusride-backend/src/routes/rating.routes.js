import express from 'express';
import {
  createRating,
  getUserRating,
  getTripRatings,
  getUserReceivedRatings,
  canRateUser
} from '../controllers/rating.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = express.Router();

// 所有评分路由都需要认证
router.use(authenticateToken);

/**
 * @route   POST /api/v1/ratings
 * @desc    Create or update a rating for a user after a completed trip
 * @access  Private
 * @body    { tripId, rateeId, score, comment?, roleOfRater }
 */
router.post('/', createRating);

/**
 * @route   GET /api/v1/ratings/user/:userId
 * @desc    Get average rating for a user
 * @access  Private
 * @returns { avgRating, totalRatings, isNew }
 */
router.get('/user/:userId', getUserRating);

/**
 * @route   GET /api/v1/ratings/trip/:tripId
 * @desc    Get all ratings for a specific trip
 * @access  Private
 * @returns Array of ratings with rater and ratee info
 */
router.get('/trip/:tripId', getTripRatings);

/**
 * @route   GET /api/v1/ratings/received/:userId
 * @desc    Get all ratings received by a user (paginated)
 * @access  Private
 * @query   ?page=1&limit=10
 */
router.get('/received/:userId', getUserReceivedRatings);

/**
 * @route   GET /api/v1/ratings/can-rate
 * @desc    Check if current user can rate another user for a specific trip
 * @access  Private
 * @query   ?tripId=xxx&rateeId=xxx
 */
router.get('/can-rate', canRateUser);

export default router;
