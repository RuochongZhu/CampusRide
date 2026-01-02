// user-profile.routes.js
// Routes for user profile management

import express from 'express';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import {
  getUserProfile,
  getUserHistory,
  updateUserProfile,
  uploadAvatar,
  getUserPointsHistory,
  getUserCoupons,
  useCoupon,
  toggleHideRank,
  getHideRankStatus
} from '../controllers/user-profile.controller.js';

const router = express.Router();

// ================================================
// 用户资料相关路由
// ================================================

// GET /api/v1/users/:userId/profile - 获取用户完整资料
router.get('/:userId/profile', getUserProfile);

// GET /api/v1/users/:userId/history - 获取用户历史记录
router.get('/:userId/history', authenticateToken, getUserHistory);

// PUT /api/v1/users/profile - 更新用户资料（需要认证）
router.put('/profile', authenticateToken, updateUserProfile);

// POST /api/v1/users/avatar - 上传用户头像（需要认证）
router.post('/avatar', authenticateToken, uploadAvatar);

// GET /api/v1/users/:userId/points/history - 获取用户积分历史
router.get('/:userId/points/history', authenticateToken, getUserPointsHistory);

// ================================================
// 隐私设置相关路由
// ================================================

// GET /api/v1/users/privacy/hide-rank - 获取隐藏排名状态
router.get('/privacy/hide-rank', authenticateToken, getHideRankStatus);

// PUT /api/v1/users/privacy/hide-rank - 切换隐藏排名
router.put('/privacy/hide-rank', authenticateToken, toggleHideRank);

// ================================================
// 优惠券相关路由
// ================================================

// GET /api/v1/users/:userId/coupons - 获取用户优惠券
router.get('/:userId/coupons', authenticateToken, getUserCoupons);

// POST /api/v1/users/coupons/:couponId/use - 使用优惠券
router.post('/coupons/:couponId/use', authenticateToken, useCoupon);

export default router;