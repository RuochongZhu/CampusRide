import leaderboardService from '../services/leaderboard.service.js';
import { query, param, validationResult } from 'express-validator';

// 获取排行榜
export const getLeaderboard = async (req, res, next) => {
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

    const {
      category = 'overall',
      timePeriod = 'week',
      limit = 50,
      offset = 0
    } = req.query;

    const result = await leaderboardService.getLeaderboard(category, timePeriod, parseInt(limit), parseInt(offset));

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'GET_LEADERBOARD_FAILED',
          message: result.error
        }
      });
    }

    res.status(200).json({
      success: true,
      data: result.data
    });

  } catch (error) {
    console.error('❌ Get leaderboard error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get leaderboard'
      }
    });
  }
};

// 获取用户个人排名
export const getUserRanking = async (req, res, next) => {
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
    const { category = 'overall', timePeriod = 'week' } = req.query;

    // 检查权限：用户只能查看自己的排名，除非是管理员
    if (userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'PERMISSION_DENIED',
          message: 'You can only view your own ranking'
        }
      });
    }

    const result = await leaderboardService.getUserRanking(userId, category, timePeriod);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'GET_USER_RANKING_FAILED',
          message: result.error
        }
      });
    }

    res.status(200).json({
      success: true,
      data: result.data
    });

  } catch (error) {
    console.error('❌ Get user ranking error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get user ranking'
      }
    });
  }
};

// 获取当前用户排名
export const getMyRanking = async (req, res, next) => {
  try {
    const { category = 'overall', timePeriod = 'week' } = req.query;

    // 如果没有用户信息（未登录），返回默认信息
    if (!req.user) {
      return res.status(200).json({
        success: true,
        data: {
          user: null,
          message: 'Please login to see your ranking'
        }
      });
    }

    // 如果是游客用户，返回游客信息
    if (req.user.isGuest) {
      return res.status(200).json({
        success: true,
        data: {
          user: {
            id: 'guest',
            first_name: 'Guest',
            last_name: 'User',
            name: 'Guest User',
            rank: 0,
            rankChange: 0,
            points: 0,
            university: 'Cornell University',
            major: 'Guest',
            isGuest: true
          }
        }
      });
    }

    const result = await leaderboardService.getUserRanking(req.user.id, category, timePeriod);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'GET_MY_RANKING_FAILED',
          message: result.error
        }
      });
    }

    res.status(200).json({
      success: true,
      data: result.data
    });

  } catch (error) {
    console.error('❌ Get my ranking error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get my ranking'
      }
    });
  }
};

// 获取排行榜统计信息
export const getLeaderboardStats = async (req, res, next) => {
  try {
    const result = await leaderboardService.getLeaderboardStats();

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'GET_LEADERBOARD_STATS_FAILED',
          message: result.error
        }
      });
    }

    res.status(200).json({
      success: true,
      data: result.data
    });

  } catch (error) {
    console.error('❌ Get leaderboard stats error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get leaderboard stats'
      }
    });
  }
};

// 更新排行榜（管理员功能）
export const updateLeaderboard = async (req, res, next) => {
  try {
    // 检查管理员权限
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'PERMISSION_DENIED',
          message: 'Only administrators can update leaderboard'
        }
      });
    }

    const result = await leaderboardService.updateLeaderboard();

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'UPDATE_LEADERBOARD_FAILED',
          message: result.error
        }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Leaderboard updated successfully'
    });

  } catch (error) {
    console.error('❌ Update leaderboard error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update leaderboard'
      }
    });
  }
};

// 验证中间件
export const getLeaderboardValidation = [
  query('category').optional().isIn(['overall', 'drivers', 'socializers', 'sellers', 'citizens']).withMessage('Invalid category'),
  query('timePeriod').optional().isIn(['week', 'month', 'all']).withMessage('Invalid time period'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be non-negative')
];

export const getUserRankingValidation = [
  param('userId').isString().notEmpty().withMessage('userId is required'),
  query('category').optional().isIn(['overall', 'drivers', 'socializers', 'sellers', 'citizens']).withMessage('Invalid category'),
  query('timePeriod').optional().isIn(['week', 'month', 'all']).withMessage('Invalid time period')
];

export const getMyRankingValidation = [
  query('category').optional().isIn(['overall', 'drivers', 'socializers', 'sellers', 'citizens']).withMessage('Invalid category'),
  query('timePeriod').optional().isIn(['week', 'month', 'all']).withMessage('Invalid time period')
];
