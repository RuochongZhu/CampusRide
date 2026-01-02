// rating.routes.js
// Routes for rating system

import express from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import {
  createRating,
  getUserRating,
  getTripRatings,
  getUserReceivedRatings,
  canRate,
  createActivityRating,
  getActivityRatings,
  canRateActivity
} from '../controllers/rating.controller.js';

const router = express.Router();

// ================================================
// 行程评分相关路由
// ================================================

// POST /api/v1/ratings - 创建或更新行程评分
router.post('/', authenticateToken, createRating);

// GET /api/v1/ratings/user/:userId - 获取用户评分信息
router.get('/user/:userId', getUserRating);

// GET /api/v1/ratings/trip/:tripId - 获取行程的所有评分
router.get('/trip/:tripId', authenticateToken, getTripRatings);

// GET /api/v1/ratings/received/:userId - 获取用户收到的评分
router.get('/received/:userId', authenticateToken, getUserReceivedRatings);

// GET /api/v1/ratings/can-rate - 检查是否可以评价行程
router.get('/can-rate', authenticateToken, canRate);

// ================================================
// 活动评分相关路由
// ================================================

// POST /api/v1/ratings/activity - 创建或更新活动评分
router.post('/activity', authenticateToken, createActivityRating);

// GET /api/v1/ratings/activity/:activityId - 获取活动的所有评分
router.get('/activity/:activityId', authenticateToken, getActivityRatings);

// GET /api/v1/ratings/activity/can-rate - 检查是否可以评价活动
router.get('/activity/can-rate', authenticateToken, canRateActivity);

export default router;