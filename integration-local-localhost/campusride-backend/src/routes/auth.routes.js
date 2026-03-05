import express from 'express';
import { register, login, logout, refreshToken, verifyEmail, resendVerification, forgotPassword, resetPassword, guestLogin, wechatLogin } from '../controllers/auth.controller.js';
import { asyncHandler } from '../middleware/error.middleware.js';

const router = express.Router();

// POST /api/v1/auth/register
router.post('/register', asyncHandler(register));

// POST /api/v1/auth/login  
router.post('/login', asyncHandler(login));

// POST /api/v1/auth/logout
router.post('/logout', asyncHandler(logout));

// POST /api/v1/auth/refresh
router.post('/refresh', asyncHandler(refreshToken));

// GET /api/v1/auth/verify-email/:token
router.get('/verify-email/:token', asyncHandler(verifyEmail));

// POST /api/v1/auth/resend-verification
router.post('/resend-verification', asyncHandler(resendVerification));

// POST /api/v1/auth/forgot-password
router.post('/forgot-password', asyncHandler(forgotPassword));

// POST /api/v1/auth/reset-password/:token
router.post('/reset-password/:token', asyncHandler(resetPassword));

// POST /api/v1/auth/guest-login
router.post('/guest-login', asyncHandler(guestLogin));

// POST /api/v1/auth/wechat-login
router.post('/wechat-login', asyncHandler(wechatLogin));

export default router; 
