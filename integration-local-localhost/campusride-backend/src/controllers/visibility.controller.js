import visibilityService from '../services/visibility.service.js';
import { body, query, validationResult } from 'express-validator';

class VisibilityController {
  // 更新用户可见性
  async updateVisibility(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '输入数据无效',
            details: errors.array()
          }
        });
      }

      const userId = req.user.id;
      const result = await visibilityService.updateVisibility(userId, req.body);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'UPDATE_VISIBILITY_FAILED',
            message: result.error
          }
        });
      }

      res.status(200).json({
        success: true,
        data: { visibility: result.visibility }
      });
    } catch (error) {
      console.error('❌ Update visibility error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: '更新可见性失败'
        }
      });
    }
  }

  // 获取地图上可见的用户
  async getVisibleUsers(req, res) {
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

      const result = await visibilityService.getVisibleUsers(req.query);

      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: {
            code: 'FETCH_VISIBLE_USERS_FAILED',
            message: result.error
          }
        });
      }

      res.status(200).json({
        success: true,
        data: { users: result.users }
      });
    } catch (error) {
      console.error('❌ Get visible users error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: '获取可见用户失败'
        }
      });
    }
  }

  // 获取我的可见性状态
  async getMyVisibility(req, res) {
    try {
      const userId = req.user.id;
      const result = await visibilityService.getMyVisibility(userId);

      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: {
            code: 'FETCH_MY_VISIBILITY_FAILED',
            message: result.error
          }
        });
      }

      res.status(200).json({
        success: true,
        data: { visibility: result.visibility }
      });
    } catch (error) {
      console.error('❌ Get my visibility error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: '获取可见性状态失败'
        }
      });
    }
  }
}

// 验证规则
export const updateVisibilityValidation = [
  body('is_visible')
    .isBoolean()
    .withMessage('is_visible必须是布尔值'),
  body('current_location')
    .optional({ nullable: true })
    .custom((value) => {
      // Allow null
      if (value === null || value === undefined) {
        return true;
      }
      // Must be an object if not null
      if (typeof value !== 'object') {
        throw new Error('当前位置必须是对象或 null');
      }
      // If object is provided, validate lat and lng
      if (value.lat !== undefined) {
        const lat = parseFloat(value.lat);
        if (isNaN(lat) || lat < -90 || lat > 90) {
          throw new Error('纬度必须在-90到90之间');
        }
      }
      if (value.lng !== undefined) {
        const lng = parseFloat(value.lng);
        if (isNaN(lng) || lng < -180 || lng > 180) {
          throw new Error('经度必须在-180到180之间');
        }
      }
      return true;
    })
];

export const getVisibleUsersValidation = [
  query('group_id').optional().isUUID().withMessage('小组ID必须是有效的UUID')
];

export default new VisibilityController();
