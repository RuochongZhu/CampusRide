import pointsService from '../services/points.service.js';
import { body, query, param, validationResult } from 'express-validator';

class PointsController {
  // Award points to user
  async awardPoints(req, res) {
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

      const result = await pointsService.awardPoints(req.body);

      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: {
            code: 'AWARD_POINTS_FAILED',
            message: result.error
          }
        });
      }

      res.status(200).json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('❌ Award points error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to award points'
        }
      });
    }
  }

  // Deduct points from user
  async deductPoints(req, res) {
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

      const result = await pointsService.deductPoints(req.body);

      if (!result.success) {
        const statusCode = result.error === 'Insufficient points' ? 400 : 500;
        return res.status(statusCode).json({
          success: false,
          error: {
            code: result.error === 'Insufficient points' ? 'INSUFFICIENT_POINTS' : 'DEDUCT_POINTS_FAILED',
            message: result.error,
            available: result.available,
            required: result.required
          }
        });
      }

      res.status(200).json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('❌ Deduct points error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to deduct points'
        }
      });
    }
  }

  // Get user's current points
  async getUserPoints(req, res) {
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

      const { userId } = req.params;
      
      // Check if user is requesting their own points or if admin
      if (userId !== req.user.userId && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: {
            code: 'PERMISSION_DENIED',
            message: 'You can only view your own points'
          }
        });
      }

      const result = await pointsService.getUserPoints(userId);

      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: {
            code: 'GET_POINTS_FAILED',
            message: result.error
          }
        });
      }

      res.status(200).json({
        success: true,
        data: {
          userId,
          points: result.points
        }
      });

    } catch (error) {
      console.error('❌ Get user points error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get user points'
        }
      });
    }
  }

  // Get current user's points
  async getMyPoints(req, res) {
    try {
      const userId = req.user.userId;
      const result = await pointsService.getUserPoints(userId);

      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: {
            code: 'GET_POINTS_FAILED',
            message: result.error
          }
        });
      }

      res.status(200).json({
        success: true,
        data: {
          userId,
          points: result.points
        }
      });

    } catch (error) {
      console.error('❌ Get my points error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get your points'
        }
      });
    }
  }

  // Get transaction history
  async getTransactions(req, res) {
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

      const userId = req.user.userId;
      const {
        limit = 20,
        offset = 0,
        transactionType,
        source,
        startDate,
        endDate
      } = req.query;

      const result = await pointsService.getTransactionHistory(userId, {
        limit: parseInt(limit),
        offset: parseInt(offset),
        transactionType,
        source,
        startDate,
        endDate
      });

      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: {
            code: 'GET_TRANSACTIONS_FAILED',
            message: result.error
          }
        });
      }

      res.status(200).json({
        success: true,
        data: {
          transactions: result.transactions,
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
      console.error('❌ Get transactions error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get transaction history'
        }
      });
    }
  }

  // Get points statistics
  async getStatistics(req, res) {
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

      const userId = req.user.userId;
      const { period = 'month' } = req.query;

      const result = await pointsService.getPointsStatistics(userId, period);

      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: {
            code: 'GET_STATISTICS_FAILED',
            message: result.error
          }
        });
      }

      res.status(200).json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('❌ Get statistics error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get points statistics'
        }
      });
    }
  }

  // Transfer points between users
  async transferPoints(req, res) {
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

      const fromUserId = req.user.userId;
      const { toUserId, points, reason } = req.body;

      const result = await pointsService.transferPoints(fromUserId, toUserId, points, reason);

      if (!result.success) {
        const statusCode = result.error.includes('Insufficient points') ? 400 : 500;
        return res.status(statusCode).json({
          success: false,
          error: {
            code: result.error.includes('Insufficient points') ? 'INSUFFICIENT_POINTS' : 'TRANSFER_FAILED',
            message: result.error,
            available: result.available,
            required: result.required
          }
        });
      }

      res.status(200).json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('❌ Transfer points error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to transfer points'
        }
      });
    }
  }

  // Get points rules
  async getRules(req, res) {
    try {
      const rules = pointsService.getPointsRules();

      res.status(200).json({
        success: true,
        data: {
          rules
        }
      });

    } catch (error) {
      console.error('❌ Get points rules error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get points rules'
        }
      });
    }
  }

  // Daily login points
  async dailyLogin(req, res) {
    try {
      const userId = req.user.userId;
      const result = await pointsService.awardDailyLoginPoints(userId);

      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: {
            code: 'DAILY_LOGIN_FAILED',
            message: result.error
          }
        });
      }

      res.status(200).json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('❌ Daily login points error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to process daily login'
        }
      });
    }
  }

  // Admin endpoint to get any user's points
  async getAnyUserPoints(req, res) {
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

      const { userId } = req.params;
      const result = await pointsService.getUserPoints(userId);

      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: {
            code: 'GET_POINTS_FAILED',
            message: result.error
          }
        });
      }

      res.status(200).json({
        success: true,
        data: {
          userId,
          points: result.points
        }
      });

    } catch (error) {
      console.error('❌ Get any user points error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get user points'
        }
      });
    }
  }
}

// Validation middlewares
export const awardPointsValidation = [
  body('userId').isString().notEmpty().withMessage('userId is required'),
  body('points').optional().isInt({ min: 1 }).withMessage('points must be a positive integer'),
  body('ruleType').optional().isString(),
  body('source').optional().isString().isLength({ max: 50 }),
  body('reason').optional().isString().isLength({ max: 500 }),
  body('metadata').optional().isObject(),
  body('multiplier').optional().isInt({ min: 1 })
];

export const deductPointsValidation = [
  body('userId').isString().notEmpty().withMessage('userId is required'),
  body('points').isInt({ min: 1 }).withMessage('points must be a positive integer'),
  body('reason').isString().notEmpty().withMessage('reason is required'),
  body('source').optional().isString().isLength({ max: 50 }),
  body('metadata').optional().isObject()
];

export const userIdValidation = [
  param('userId').isString().notEmpty().withMessage('Invalid user ID')
];

export const getTransactionsValidation = [
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 }),
  query('transactionType').optional().isIn(['earned', 'deducted']),
  query('source').optional().isString(),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601()
];

export const getStatisticsValidation = [
  query('period').optional().isIn(['week', 'month', 'year'])
];

export const transferPointsValidation = [
  body('toUserId').isString().notEmpty().withMessage('toUserId is required'),
  body('points').isInt({ min: 1 }).withMessage('points must be a positive integer'),
  body('reason').optional().isString().isLength({ max: 500 })
];

export default new PointsController();