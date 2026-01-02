import activityCheckinService from '../services/activity-checkin.service.js';
import { body, param, query, validationResult } from 'express-validator';

class ActivityCheckinController {

  // 检查用户是否可以签到
  async checkCheckinEligibility(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '参数验证失败',
            details: errors.array()
          }
        });
      }

      const { activityId } = req.params;
      const userId = req.user.id;

      const result = await activityCheckinService.canUserCheckin(activityId, userId);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'CHECKIN_CHECK_FAILED',
            message: result.error
          }
        });
      }

      res.status(200).json({
        success: true,
        data: {
          canCheckin: result.canCheckin,
          reason: result.reason,
          checkinPeriod: result.checkinPeriod,
          requiresLocation: result.requiresLocation,
          verificationRadius: result.verificationRadius,
          activityLocation: result.activityLocation,
          activity: {
            id: result.activity.id,
            title: result.activity.title,
            startTime: result.activity.start_time,
            endTime: result.activity.end_time
          }
        }
      });

    } catch (error) {
      console.error('❌ Check checkin eligibility error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: '检查签到资格失败'
        }
      });
    }
  }

  // 执行签到
  async performCheckin(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '签到数据无效',
            details: errors.array()
          }
        });
      }

      const { activityId } = req.params;
      const userId = req.user.id;
      const { userLocation, deviceInfo } = req.body;

      // 获取客户端IP
      const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;

      const checkinData = {
        userLocation,
        deviceInfo: {
          ...deviceInfo,
          userAgent: req.headers['user-agent'],
          ip: clientIP
        }
      };

      const result = await activityCheckinService.performCheckin(activityId, userId, checkinData);

      if (!result.success) {
        const statusCode = result.error.includes('距离') ? 400 :
                          result.error.includes('时间') ? 400 : 500;
        return res.status(statusCode).json({
          success: false,
          error: {
            code: 'CHECKIN_FAILED',
            message: result.error,
            distance: result.distance,
            requiredRadius: result.requiredRadius
          }
        });
      }

      res.status(200).json({
        success: true,
        message: result.message,
        data: {
          checkinTime: result.checkinTime,
          distance: result.distance,
          locationVerified: result.locationVerified,
          pointsAwarded: result.pointsAwarded
        }
      });

    } catch (error) {
      console.error('❌ Perform checkin error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: '签到失败'
        }
      });
    }
  }

  // 获取活动签到统计
  async getActivityCheckinStats(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '活动ID无效',
            details: errors.array()
          }
        });
      }

      const { activityId } = req.params;

      const result = await activityCheckinService.getActivityCheckinStats(activityId);

      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: {
            code: 'STATS_FETCH_FAILED',
            message: result.error
          }
        });
      }

      res.status(200).json({
        success: true,
        data: result.stats
      });

    } catch (error) {
      console.error('❌ Get activity checkin stats error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: '获取签到统计失败'
        }
      });
    }
  }

  // 获取用户签到历史
  async getUserCheckinHistory(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '查询参数无效',
            details: errors.array()
          }
        });
      }

      const userId = req.user.id;
      const { limit = 20, offset = 0 } = req.query;

      const result = await activityCheckinService.getUserCheckinHistory(userId, {
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: {
            code: 'HISTORY_FETCH_FAILED',
            message: result.error
          }
        });
      }

      res.status(200).json({
        success: true,
        data: {
          checkins: result.checkins,
          total: result.total
        }
      });

    } catch (error) {
      console.error('❌ Get user checkin history error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: '获取签到历史失败'
        }
      });
    }
  }
}

// 验证规则
export const activityIdValidation = [
  param('activityId').isUUID().withMessage('活动ID必须是有效的UUID')
];

export const checkinValidation = [
  param('activityId').isUUID().withMessage('活动ID必须是有效的UUID'),
  body('userLocation').optional().isObject().withMessage('用户位置必须是对象'),
  body('userLocation.latitude').optional().isFloat({ min: -90, max: 90 }).withMessage('纬度必须在-90到90之间'),
  body('userLocation.longitude').optional().isFloat({ min: -180, max: 180 }).withMessage('经度必须在-180到180之间'),
  body('userLocation.accuracy').optional().isFloat({ min: 0 }).withMessage('位置精度必须是非负数'),
  body('deviceInfo').optional().isObject().withMessage('设备信息必须是对象')
];

export const checkinHistoryValidation = [
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit必须是1-100之间的整数'),
  query('offset').optional().isInt({ min: 0 }).withMessage('offset必须是非负整数')
];

export default new ActivityCheckinController();