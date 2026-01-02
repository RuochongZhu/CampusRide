import express from 'express';
import activityCheckinController, {
  activityIdValidation,
  checkinValidation,
  checkinHistoryValidation
} from '../controllers/activity-checkin.controller.js';
import { requireRegisteredUser } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../middleware/error.middleware.js';

const router = express.Router();

// 检查用户是否可以签到
router.get('/activities/:activityId/checkin/eligibility',
  requireRegisteredUser,
  activityIdValidation,
  asyncHandler(activityCheckinController.checkCheckinEligibility.bind(activityCheckinController))
);

// 执行签到
router.post('/activities/:activityId/checkin',
  requireRegisteredUser,
  checkinValidation,
  asyncHandler(activityCheckinController.performCheckin.bind(activityCheckinController))
);

// 获取活动签到统计 (仅活动组织者可查看)
router.get('/activities/:activityId/checkin/stats',
  requireRegisteredUser,
  activityIdValidation,
  asyncHandler(activityCheckinController.getActivityCheckinStats.bind(activityCheckinController))
);

// 获取用户签到历史
router.get('/checkins/history',
  requireRegisteredUser,
  checkinHistoryValidation,
  asyncHandler(activityCheckinController.getUserCheckinHistory.bind(activityCheckinController))
);

export default router;