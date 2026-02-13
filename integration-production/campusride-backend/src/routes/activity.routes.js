import express from 'express';
import { authenticateToken, optionalAuth } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import activityController, {
  createActivityValidation,
  updateActivityValidation,
  getActivitiesValidation,
  searchActivitiesValidation,
  activityIdValidation,
  getMyActivitiesValidation,
  getHistoryActivitiesValidation,
  checkinValidation
} from '../controllers/activity.controller.js';
import activityCommentController, {
  addCommentValidation,
  getCommentsValidation,
  commentIdValidation
} from '../controllers/activity-comment.controller.js';
import {
  getChatMessages,
  sendChatMessage,
  deleteChatMessage,
  getChatMembers,
  markAsRead
} from '../controllers/activity-chat.controller.js';

const router = express.Router();

// Activity CRUD routes
router.post('/', 
  authenticateToken,
  createActivityValidation,
  asyncHandler(activityController.createActivity.bind(activityController))
);

router.get('/', 
  optionalAuth,
  getActivitiesValidation,
  asyncHandler(activityController.getActivities.bind(activityController))
);

router.get('/search', 
  optionalAuth,
  searchActivitiesValidation,
  asyncHandler(activityController.searchActivities.bind(activityController))
);

router.get('/my', 
  authenticateToken,
  getMyActivitiesValidation,
  asyncHandler(activityController.getMyActivities.bind(activityController))
);

router.get('/meta', 
  optionalAuth,
  asyncHandler(activityController.getActivityMeta.bind(activityController))
);

// User activity history routes (must be before /:activityId route)
router.get('/history', 
  authenticateToken,
  getHistoryActivitiesValidation,
  asyncHandler(activityController.getHistoryActivities.bind(activityController))
);

// Admin cleanup routes
router.post('/cleanup', 
  authenticateToken,
  asyncHandler(activityController.triggerCleanup.bind(activityController))
);

router.get('/cleanup/stats', 
  authenticateToken,
  asyncHandler(activityController.getCleanupStats.bind(activityController))
);

router.get('/:activityId', 
  optionalAuth,
  activityIdValidation,
  asyncHandler(activityController.getActivityById.bind(activityController))
);

router.put('/:activityId', 
  authenticateToken,
  updateActivityValidation,
  asyncHandler(activityController.updateActivity.bind(activityController))
);

router.delete('/:activityId', 
  authenticateToken,
  activityIdValidation,
  asyncHandler(activityController.deleteActivity.bind(activityController))
);

router.post('/:activityId/publish', 
  authenticateToken,
  activityIdValidation,
  asyncHandler(activityController.publishActivity.bind(activityController))
);

// Activity participation routes
router.post('/:activityId/register', 
  authenticateToken,
  activityIdValidation,
  asyncHandler(activityController.registerForActivity.bind(activityController))
);

router.delete('/:activityId/register', 
  authenticateToken,
  activityIdValidation,
  asyncHandler(activityController.cancelRegistration.bind(activityController))
);

router.post('/:activityId/generate-code',
  authenticateToken,
  activityIdValidation,
  asyncHandler(activityController.generateCheckinCode.bind(activityController))
);

router.post('/:activityId/checkin', 
  authenticateToken,
  checkinValidation,
  asyncHandler(activityController.checkInToActivity.bind(activityController))
);

router.get('/:activityId/participants',
  authenticateToken,
  activityIdValidation,
  asyncHandler(activityController.getActivityParticipants.bind(activityController))
);

// Activity comments routes
router.get('/:activityId/comments',
  optionalAuth,
  getCommentsValidation,
  asyncHandler(activityCommentController.getActivityComments.bind(activityCommentController))
);

router.post('/:activityId/comments',
  authenticateToken,
  addCommentValidation,
  asyncHandler(activityCommentController.addActivityComment.bind(activityCommentController))
);

router.delete('/:activityId/comments/:commentId',
  authenticateToken,
  activityIdValidation,
  commentIdValidation,
  asyncHandler(activityCommentController.deleteActivityComment.bind(activityCommentController))
);

router.get('/:activityId/comments/stats',
  optionalAuth,
  activityIdValidation,
  asyncHandler(activityCommentController.getCommentStats.bind(activityCommentController))
);

// Activity chat (group chat) routes
router.get('/:activityId/chat',
  authenticateToken,
  asyncHandler(getChatMessages)
);

router.post('/:activityId/chat',
  authenticateToken,
  asyncHandler(sendChatMessage)
);

router.delete('/:activityId/chat/:messageId',
  authenticateToken,
  asyncHandler(deleteChatMessage)
);

router.get('/:activityId/chat/members',
  authenticateToken,
  asyncHandler(getChatMembers)
);

router.put('/:activityId/chat/read',
  authenticateToken,
  asyncHandler(markAsRead)
);

export default router;
