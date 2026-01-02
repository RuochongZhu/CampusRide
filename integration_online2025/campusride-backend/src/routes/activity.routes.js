import express from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
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

const router = express.Router();

// All activity routes require authentication
router.use(authenticateToken);

// Activity CRUD routes
router.post('/', 
  createActivityValidation,
  asyncHandler(activityController.createActivity.bind(activityController))
);

router.get('/', 
  getActivitiesValidation,
  asyncHandler(activityController.getActivities.bind(activityController))
);

router.get('/search', 
  searchActivitiesValidation,
  asyncHandler(activityController.searchActivities.bind(activityController))
);

router.get('/my', 
  getMyActivitiesValidation,
  asyncHandler(activityController.getMyActivities.bind(activityController))
);

router.get('/meta', 
  asyncHandler(activityController.getActivityMeta.bind(activityController))
);

// User activity history routes (must be before /:activityId route)
router.get('/history', 
  getHistoryActivitiesValidation,
  asyncHandler(activityController.getHistoryActivities.bind(activityController))
);

// Admin cleanup routes
router.post('/cleanup', 
  asyncHandler(activityController.triggerCleanup.bind(activityController))
);

router.get('/cleanup/stats', 
  asyncHandler(activityController.getCleanupStats.bind(activityController))
);

router.get('/:activityId', 
  activityIdValidation,
  asyncHandler(activityController.getActivityById.bind(activityController))
);

router.put('/:activityId', 
  updateActivityValidation,
  asyncHandler(activityController.updateActivity.bind(activityController))
);

router.delete('/:activityId', 
  activityIdValidation,
  asyncHandler(activityController.deleteActivity.bind(activityController))
);

router.post('/:activityId/publish', 
  activityIdValidation,
  asyncHandler(activityController.publishActivity.bind(activityController))
);

// Activity participation routes
router.post('/:activityId/register', 
  activityIdValidation,
  asyncHandler(activityController.registerForActivity.bind(activityController))
);

router.delete('/:activityId/register', 
  activityIdValidation,
  asyncHandler(activityController.cancelRegistration.bind(activityController))
);

router.post('/:activityId/generate-code',
  activityIdValidation,
  asyncHandler(activityController.generateCheckinCode.bind(activityController))
);

router.post('/:activityId/checkin', 
  checkinValidation,
  asyncHandler(activityController.checkInToActivity.bind(activityController))
);

router.get('/:activityId/participants',
  activityIdValidation,
  asyncHandler(activityController.getActivityParticipants.bind(activityController))
);

// Activity comments routes
router.get('/:activityId/comments',
  getCommentsValidation,
  asyncHandler(activityCommentController.getActivityComments.bind(activityCommentController))
);

router.post('/:activityId/comments',
  addCommentValidation,
  asyncHandler(activityCommentController.addActivityComment.bind(activityCommentController))
);

router.delete('/:activityId/comments/:commentId',
  activityIdValidation,
  commentIdValidation,
  asyncHandler(activityCommentController.deleteActivityComment.bind(activityCommentController))
);

router.get('/:activityId/comments/stats',
  activityIdValidation,
  asyncHandler(activityCommentController.getCommentStats.bind(activityCommentController))
);

export default router;
