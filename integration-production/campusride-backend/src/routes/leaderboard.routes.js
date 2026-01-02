import express from 'express';
import { asyncHandler } from '../middleware/error.middleware.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.middleware.js';
import {
  getLeaderboard,
  getUserRanking,
  getMyRanking,
  getLeaderboardStats,
  updateLeaderboard,
  getLeaderboardValidation,
  getUserRankingValidation,
  getMyRankingValidation
} from '../controllers/leaderboard.controller.js';

const router = express.Router();

// GET /api/v1/leaderboard - 获取排行榜（公开访问）
router.get('/', getLeaderboardValidation, asyncHandler(getLeaderboard));

// GET /api/v1/leaderboard/me - 获取当前用户排名（可选认证）
router.get('/me', optionalAuth, getMyRankingValidation, asyncHandler(getMyRanking));

// GET /api/v1/leaderboard/stats - 获取排行榜统计信息（需要认证）
router.get('/stats', authenticateToken, asyncHandler(getLeaderboardStats));

// GET /api/v1/leaderboard/:userId - 获取指定用户排名（需要认证）
router.get('/:userId', authenticateToken, getUserRankingValidation, asyncHandler(getUserRanking));

// POST /api/v1/leaderboard/update - 更新排行榜（管理员功能）
router.post('/update', authenticateToken, asyncHandler(updateLeaderboard));

export default router;
