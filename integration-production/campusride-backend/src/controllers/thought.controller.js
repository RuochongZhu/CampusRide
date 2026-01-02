import thoughtService from '../services/thought.service.js';
import { body, query, param, validationResult } from 'express-validator';

class ThoughtController {
  // 发布想法
  async createThought(req, res) {
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

      const result = await thoughtService.createThought({
        ...req.body,
        user_id: req.user.id
      });

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'CREATE_THOUGHT_FAILED',
            message: result.error
          }
        });
      }

      res.status(201).json({
        success: true,
        data: { thought: result.thought }
      });
    } catch (error) {
      console.error('❌ Create thought error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: '发布想法失败'
        }
      });
    }
  }

  // 获取想法列表
  async getThoughts(req, res) {
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

      const result = await thoughtService.getThoughts(req.query);

      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: {
            code: 'FETCH_THOUGHTS_FAILED',
            message: result.error
          }
        });
      }

      res.status(200).json({
        success: true,
        data: { thoughts: result.thoughts }
      });
    } catch (error) {
      console.error('❌ Get thoughts error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: '获取想法列表失败'
        }
      });
    }
  }

  // 获取地图上的想法点位
  async getMapThoughts(req, res) {
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

      const result = await thoughtService.getMapThoughts(req.query);

      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: {
            code: 'FETCH_MAP_THOUGHTS_FAILED',
            message: result.error
          }
        });
      }

      res.status(200).json({
        success: true,
        data: { thoughts: result.thoughts }
      });
    } catch (error) {
      console.error('❌ Get map thoughts error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: '获取地图想法失败'
        }
      });
    }
  }

  // 删除想法
  async deleteThought(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '想法ID无效',
            details: errors.array()
          }
        });
      }

      const { thoughtId } = req.params;
      const userId = req.user.id;

      const result = await thoughtService.deleteThought(thoughtId, userId);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'DELETE_THOUGHT_FAILED',
            message: result.error
          }
        });
      }

      res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      console.error('❌ Delete thought error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: '删除想法失败'
        }
      });
    }
  }

  // 获取用户的想法
  async getUserThoughts(req, res) {
    try {
      const userId = req.user.id;
      const result = await thoughtService.getUserThoughts(userId);

      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: {
            code: 'FETCH_USER_THOUGHTS_FAILED',
            message: result.error
          }
        });
      }

      res.status(200).json({
        success: true,
        data: { thoughts: result.thoughts }
      });
    } catch (error) {
      console.error('❌ Get user thoughts error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: '获取用户想法失败'
        }
      });
    }
  }
}

// 验证规则
export const createThoughtValidation = [
  body('content').isString().isLength({ min: 1, max: 500 }).withMessage('内容必须是1-500个字符'),
  body('group_id').optional().isUUID().withMessage('小组ID必须是有效的UUID'),
  body('location').isObject().withMessage('位置必须是对象'),
  body('location.lat').isFloat({ min: -90, max: 90 }).withMessage('纬度必须在-90到90之间'),
  body('location.lng').isFloat({ min: -180, max: 180 }).withMessage('经度必须在-180到180之间'),
  body('location.address').optional().isString().withMessage('地址必须是字符串')
];

export const getThoughtsValidation = [
  query('group_id').optional().isUUID().withMessage('小组ID必须是有效的UUID'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit必须是1-100之间的整数'),
  query('offset').optional().isInt({ min: 0 }).withMessage('offset必须是非负整数')
];

export const getMapThoughtsValidation = [
  query('group_id').optional().isUUID().withMessage('小组ID必须是有效的UUID')
];

export const thoughtIdValidation = [
  param('thoughtId').isUUID().withMessage('想法ID必须是有效的UUID')
];

export default new ThoughtController();
