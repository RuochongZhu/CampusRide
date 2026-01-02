import express from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import {
  isAdmin,
  getDashboardStats,
  getRideStats,
  getMarketplaceStats,
  getActivityStats,
  getPointsLeaderboard,
  getUserList,
  banUser,
  unbanUser,
  deleteRide,
  deleteMarketplaceItem,
  deleteActivity,
  getAllPosts,
  grantAdminRole,
  revokeAdminRole,
  grantMerchantRole,
  revokeMerchantRole,
  getMerchantList,
  sendSystemAnnouncement,
  getSystemAnnouncements,
  distributeWeeklyCoupons
} from '../controllers/admin.controller.js';

const router = express.Router();

// All routes require authentication and admin access
router.use(authenticateToken);
router.use(isAdmin);

// Dashboard statistics
router.get('/dashboard', getDashboardStats);

// Ride statistics
router.get('/stats/rides', getRideStats);

// Marketplace statistics
router.get('/stats/marketplace', getMarketplaceStats);

// Activity statistics
router.get('/stats/activities', getActivityStats);

// Points leaderboard
router.get('/stats/points', getPointsLeaderboard);

// User management
router.get('/users', getUserList);
router.post('/users/:userId/ban', banUser);
router.post('/users/:userId/unban', unbanUser);

// Role management
router.post('/users/:userId/grant-admin', grantAdminRole);
router.post('/users/:userId/revoke-admin', revokeAdminRole);
router.post('/users/:userId/grant-merchant', grantMerchantRole);
router.post('/users/:userId/revoke-merchant', revokeMerchantRole);
router.get('/merchants', getMerchantList);

// System announcements
router.post('/announcements', sendSystemAnnouncement);
router.get('/announcements', getSystemAnnouncements);

// Post management
router.get('/posts', getAllPosts);
router.delete('/rides/:rideId', deleteRide);
router.delete('/marketplace/:itemId', deleteMarketplaceItem);
router.delete('/activities/:activityId', deleteActivity);

// Weekly coupon distribution
router.post('/coupons/distribute', distributeWeeklyCoupons);

export default router;
