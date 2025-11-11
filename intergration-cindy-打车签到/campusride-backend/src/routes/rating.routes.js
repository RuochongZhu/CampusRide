import express from 'express';
import {
  createRating,
  getMyRatingStatus,
  getUserAverageRating,
  getTripRatings
} from '../controllers/rating.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = express.Router();

// 创建评分（需要认证）
router.post('/', authenticateToken, createRating);

// 获取我的评分状态（针对某个行程）
router.get('/my', authenticateToken, getMyRatingStatus);

// 获取用户的平均评分（公开）
router.get('/average/:userId', getUserAverageRating);

// 获取行程的所有评分（公开）
router.get('/trip/:tripId', getTripRatings);

export default router;




