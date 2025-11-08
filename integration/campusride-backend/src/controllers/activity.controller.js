import activityService from '../services/activity.service.js';
import activityCleanupService from '../services/activity-cleanup.service.js';
import { body, query, param, validationResult } from 'express-validator';

class ActivityController {
  // Create new activity
  async createActivity(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: errors.array()
          }
        });
      }

      const result = await activityService.createActivity({
        ...req.body,
        organizerId: req.user.id
      });

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'CREATE_ACTIVITY_FAILED',
            message: result.error
          }
        });
      }

      res.status(201).json({
        success: true,
        data: {
          activity: result.activity
        }
      });

    } catch (error) {
      console.error('❌ Create activity error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create activity'
        }
      });
    }
  }

  // Get activities with filters
  async getActivities(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            details: errors.array()
          }
        });
      }

      const result = await activityService.getActivities(req.query);

      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: {
            code: 'FETCH_ACTIVITIES_FAILED',
            message: result.error
          }
        });
      }

      res.status(200).json({
        success: true,
        data: {
          activities: result.activities,
          total: result.total,
          hasMore: result.hasMore,
          pagination: {
            limit: parseInt(req.query.limit || 20),
            offset: parseInt(req.query.offset || 0),
            total: result.total
          }
        }
      });

    } catch (error) {
      console.error('❌ Get activities error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch activities'
        }
      });
    }
  }

  // Get activity by ID
  async getActivityById(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid activity ID',
            details: errors.array()
          }
        });
      }

      const { activityId } = req.params;
      const userId = req.user?.id;

      const result = await activityService.getActivityById(activityId, userId);

      if (!result.success) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'ACTIVITY_NOT_FOUND',
            message: result.error
          }
        });
      }

      res.status(200).json({
        success: true,
        data: {
          activity: result.activity
        }
      });

    } catch (error) {
      console.error('❌ Get activity by ID error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch activity'
        }
      });
    }
  }

  // Update activity
  async updateActivity(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: errors.array()
          }
        });
      }

      const { activityId } = req.params;
      const organizerId = req.user.id;

      const result = await activityService.updateActivity(activityId, req.body, organizerId);

      if (!result.success) {
        const statusCode = result.error.includes('not found') || result.error.includes('access denied') ? 404 : 400;
        return res.status(statusCode).json({
          success: false,
          error: {
            code: 'UPDATE_ACTIVITY_FAILED',
            message: result.error
          }
        });
      }

      res.status(200).json({
        success: true,
        data: {
          activity: result.activity
        }
      });

    } catch (error) {
      console.error('❌ Update activity error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update activity'
        }
      });
    }
  }

  // Delete activity
  async deleteActivity(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid activity ID',
            details: errors.array()
          }
        });
      }

      const { activityId } = req.params;
      const organizerId = req.user.id;

      const result = await activityService.deleteActivity(activityId, organizerId);

      if (!result.success) {
        const statusCode = result.error.includes('not found') || result.error.includes('access denied') ? 404 : 400;
        return res.status(statusCode).json({
          success: false,
          error: {
            code: 'DELETE_ACTIVITY_FAILED',
            message: result.error
          }
        });
      }

      res.status(200).json({
        success: true,
        message: result.message
      });

    } catch (error) {
      console.error('❌ Delete activity error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete activity'
        }
      });
    }
  }

  // Publish activity
  async publishActivity(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid activity ID',
            details: errors.array()
          }
        });
      }

      const { activityId } = req.params;
      const organizerId = req.user.id;

      const result = await activityService.publishActivity(activityId, organizerId);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'PUBLISH_ACTIVITY_FAILED',
            message: result.error
          }
        });
      }

      res.status(200).json({
        success: true,
        data: {
          activity: result.activity
        }
      });

    } catch (error) {
      console.error('❌ Publish activity error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to publish activity'
        }
      });
    }
  }

  // Search activities
  async searchActivities(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid search parameters',
            details: errors.array()
          }
        });
      }

      const result = await activityService.searchActivities(req.query);

      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: {
            code: 'SEARCH_ACTIVITIES_FAILED',
            message: result.error
          }
        });
      }

      res.status(200).json({
        success: true,
        data: {
          activities: result.activities,
          total: result.total,
          hasMore: result.hasMore,
          searchQuery: req.query
        }
      });

    } catch (error) {
      console.error('❌ Search activities error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to search activities'
        }
      });
    }
  }

  // Get user's activities
  async getMyActivities(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid parameters',
            details: errors.array()
          }
        });
      }

      const userId = req.user.id;
      const { type = 'organized' } = req.query;

      const result = await activityService.getMyActivities(userId, type);

      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: {
            code: 'FETCH_MY_ACTIVITIES_FAILED',
            message: result.error
          }
        });
      }

      res.status(200).json({
        success: true,
        data: {
          activities: result.activities,
          type
        }
      });

    } catch (error) {
      console.error('❌ Get my activities error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch user activities'
        }
      });
    }
  }

  // Register for activity
  async registerForActivity(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid activity ID',
            details: errors.array()
          }
        });
      }

      const { activityId } = req.params;
      const userId = req.user.id;

      const result = await activityService.registerForActivity(activityId, userId);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'REGISTRATION_FAILED',
            message: result.error
          }
        });
      }

      res.status(201).json({
        success: true,
        data: {
          participation: result.participation
        },
        message: 'Successfully registered for activity'
      });

    } catch (error) {
      console.error('❌ Register for activity error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to register for activity'
        }
      });
    }
  }

  // Cancel registration
  async cancelRegistration(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid activity ID',
            details: errors.array()
          }
        });
      }

      const { activityId } = req.params;
      const userId = req.user.id;

      const result = await activityService.cancelRegistration(activityId, userId);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'CANCELLATION_FAILED',
            message: result.error
          }
        });
      }

      res.status(200).json({
        success: true,
        message: result.message
      });

    } catch (error) {
      console.error('❌ Cancel registration error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to cancel registration'
        }
      });
    }
  }

  // Regenerate check-in code (organizer only)
  async generateCheckinCode(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid activity ID',
            details: errors.array()
          }
        });
      }

      const { activityId } = req.params;
      const organizerId = req.user.id;

      const result = await activityService.regenerateCheckinCode(activityId, organizerId);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'CHECKIN_CODE_REGEN_FAILED',
            message: result.error
          }
        });
      }

      res.status(200).json({
        success: true,
        data: {
          checkinCode: result.code
        }
      });

    } catch (error) {
      console.error('❌ Regenerate check-in code error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to regenerate check-in code'
        }
      });
    }
  }

  // Check in to activity
  async checkInToActivity(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: errors.array()
          }
        });
      }

      const { activityId } = req.params;
      const userId = req.user.id;
      const checkinData = {
        checkinCode: req.body.checkinCode,
        location: req.body.location
      };

      const result = await activityService.checkInToActivity(activityId, userId, checkinData);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'CHECKIN_FAILED',
            message: result.error
          }
        });
      }

      res.status(200).json({
        success: true,
        data: {
          participation: result.participation,
          pointsEarned: result.pointsEarned
        },
        message: 'Successfully checked in to activity'
      });

    } catch (error) {
      console.error('❌ Check in to activity error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to check in to activity'
        }
      });
    }
  }

  // Get user's historical activities (archived/completed)
  async getHistoryActivities(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: errors.array()
          }
        });
      }

      const { type = 'organized', limit = 20, offset = 0 } = req.query;
      const userId = req.user.id;

      const result = await activityService.getHistoryActivities(userId, { type, limit: parseInt(limit), offset: parseInt(offset) });

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'GET_HISTORY_ACTIVITIES_FAILED',
            message: result.error
          }
        });
      }

      res.status(200).json({
        success: true,
        data: {
          activities: result.activities,
          total: result.total,
          hasMore: result.hasMore,
          pagination: {
            limit: parseInt(limit),
            offset: parseInt(offset),
            total: result.total
          }
        }
      });

    } catch (error) {
      console.error('❌ Get history activities error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get history activities'
        }
      });
    }
  }

  // Manual cleanup trigger (admin only)
  async triggerCleanup(req, res) {
    try {
      // Check if user is admin (you can add proper admin check here)
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Admin access required'
          }
        });
      }

      await activityCleanupService.manualCleanup();

      res.status(200).json({
        success: true,
        message: 'Activity cleanup triggered successfully'
      });

    } catch (error) {
      console.error('❌ Trigger cleanup error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to trigger cleanup'
        }
      });
    }
  }

  // Get cleanup statistics
  async getCleanupStats(req, res) {
    try {
      // Check if user is admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Admin access required'
          }
        });
      }

      const stats = await activityCleanupService.getCleanupStats();

      res.status(200).json({
        success: true,
        data: stats
      });

    } catch (error) {
      console.error('❌ Get cleanup stats error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get cleanup stats'
        }
      });
    }
  }

  // Get activity participants (organizers only)
  async getActivityParticipants(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid activity ID',
            details: errors.array()
          }
        });
      }

      const { activityId } = req.params;
      const organizerId = req.user.id;

      const result = await activityService.getActivityParticipants(activityId, organizerId);

      if (!result.success) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'FETCH_PARTICIPANTS_FAILED',
            message: result.error
          }
        });
      }

      res.status(200).json({
        success: true,
        data: {
          participants: result.participants,
          total: result.participants.length
        }
      });

    } catch (error) {
      console.error('❌ Get activity participants error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch activity participants'
        }
      });
    }
  }

  // Get activity categories and types
  async getActivityMeta(req, res) {
    try {
      res.status(200).json({
        success: true,
        data: {
          categories: [
            { value: 'academic', label: '学术活动' },
            { value: 'sports', label: '体育运动' },
            { value: 'social', label: '社交活动' },
            { value: 'volunteer', label: '志愿服务' },
            { value: 'career', label: '职业发展' },
            { value: 'cultural', label: '文化艺术' },
            { value: 'technology', label: '科技创新' }
          ],
          types: [
            { value: 'individual', label: '个人活动' },
            { value: 'team', label: '团队活动' },
            { value: 'competition', label: '竞赛比赛' },
            { value: 'workshop', label: '工作坊' },
            { value: 'seminar', label: '讲座研讨' }
          ],
          statuses: [
            { value: 'draft', label: '草稿' },
            { value: 'published', label: '已发布' },
            { value: 'ongoing', label: '进行中' },
            { value: 'completed', label: '已完成' },
            { value: 'cancelled', label: '已取消' }
          ]
        }
      });
    } catch (error) {
      console.error('❌ Get activity meta error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch activity metadata'
        }
      });
    }
  }
}

// Validation middlewares
export const createActivityValidation = [
  body('title').isString().isLength({ min: 3, max: 255 }).withMessage('Title must be 3-255 characters'),
  body('description').isString().isLength({ min: 5, max: 2000 }).withMessage('Description must be 5-2000 characters'),
  body('category').isIn(['academic', 'sports', 'social', 'volunteer', 'career', 'cultural', 'technology']).withMessage('Invalid category'),
  body('type').isIn(['individual', 'team', 'competition', 'workshop', 'seminar']).withMessage('Invalid type'),
  body('location').isString().notEmpty().withMessage('Location is required'),
  body('locationCoordinates').optional().isObject(),
  body('startTime').isISO8601().withMessage('Invalid start time format'),
  body('endTime').isISO8601().withMessage('Invalid end time format'),
  body('registrationDeadline').optional().isISO8601().withMessage('Invalid registration deadline format'),
  body('maxParticipants').optional().isInt({ min: 1 }).withMessage('Max participants must be positive'),
  body('entryFee').optional().isFloat({ min: 0 }).withMessage('Entry fee must be non-negative'),
  body('entryFeePoints').optional().isInt({ min: 0 }).withMessage('Entry fee points must be non-negative'),
  body('rewardPoints').optional().isInt({ min: 0 }).withMessage('Reward points must be non-negative'),
  body('requirements').optional().isString().isLength({ max: 1000 }),
  body('tags').optional().isArray(),
  body('imageUrls').optional().isArray(),
  body('contactInfo').optional().isObject(),
  body('locationVerification').optional().isBoolean(),
  body('autoComplete').optional().isBoolean(),
  body('group_id').optional().custom(value => value === null || typeof value === 'string').withMessage('Group ID must be null or string'),
  body('status').optional().isIn(['draft', 'published', 'cancelled'])
];

export const updateActivityValidation = [
  param('activityId').isUUID().withMessage('Invalid activity ID'),
  body('title').optional().isString().isLength({ min: 5, max: 255 }),
  body('description').optional().isString().isLength({ min: 20, max: 2000 }),
  body('category').optional().isIn(['academic', 'sports', 'social', 'volunteer', 'career', 'cultural', 'technology']),
  body('type').optional().isIn(['individual', 'team', 'competition', 'workshop', 'seminar']),
  body('location').optional().isString().notEmpty(),
  body('locationCoordinates').optional().isObject(),
  body('startTime').optional().isISO8601(),
  body('endTime').optional().isISO8601(),
  body('registrationDeadline').optional().isISO8601(),
  body('maxParticipants').optional().isInt({ min: 1 }),
  body('entryFee').optional().isFloat({ min: 0 }),
  body('entryFeePoints').optional().isInt({ min: 0 }),
  body('rewardPoints').optional().isInt({ min: 0 }),
  body('requirements').optional().isString().isLength({ max: 1000 }),
  body('tags').optional().isArray(),
  body('imageUrls').optional().isArray(),
  body('contactInfo').optional().isObject(),
  body('locationVerification').optional().isBoolean(),
  body('autoComplete').optional().isBoolean(),
  body('status').optional().isIn(['draft', 'published', 'cancelled'])
];

export const getActivitiesValidation = [
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 }),
  query('category').optional().isIn(['academic', 'sports', 'social', 'volunteer', 'career', 'cultural', 'technology']),
  query('type').optional().isIn(['individual', 'team', 'competition', 'workshop', 'seminar']),
  query('status').optional().isString(),
  query('organizerId').optional().isUUID(),
  query('search').optional().isString().isLength({ max: 100 }),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('location').optional().isString(),
  query('featured').optional().isBoolean(),
  query('sortBy').optional().isIn(['start_time', 'created_at', 'title', 'current_participants', 'view_count']),
  query('sortOrder').optional().isIn(['asc', 'desc'])
];

export const searchActivitiesValidation = [
  query('query').optional().isString().isLength({ min: 2, max: 100 }),
  query('category').optional().isIn(['academic', 'sports', 'social', 'volunteer', 'career', 'cultural', 'technology']),
  query('location').optional().isString(),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('maxDistance').optional().isFloat({ min: 0 }),
  query('userLocation').optional().isString(),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 })
];

export const activityIdValidation = [
  param('activityId').isUUID().withMessage('Invalid activity ID')
];

export const getMyActivitiesValidation = [
  query('type').optional().isIn(['organized', 'registered']).withMessage('Type must be organized or registered')
];

export const checkinValidation = [
  param('activityId').isUUID().withMessage('Invalid activity ID'),
  body('checkinCode').optional().isString().isLength({ min: 6, max: 6 }).withMessage('Checkin code must be 6 characters'),
  body('location').optional().isObject().withMessage('Location must be an object with lat and lng')
];

export const getHistoryActivitiesValidation = [
  query('type').optional().isIn(['organized', 'participated']).withMessage('Type must be organized or participated'),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 })
];

export default new ActivityController();
