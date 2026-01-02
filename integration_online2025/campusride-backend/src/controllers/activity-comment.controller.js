import activityCommentService from '../services/activity-comment.service.js';
import { body, param, query, validationResult } from 'express-validator';

class ActivityCommentController {
  // 获取活动评论
  async getActivityComments(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '请求参数无效',
            details: errors.array()
          }
        });
      }

      const { activityId } = req.params;
      const { limit = 50, offset = 0 } = req.query;

      const result = await activityCommentService.getActivityComments(activityId, {
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: {
            code: 'FETCH_COMMENTS_FAILED',
            message: result.error
          }
        });
      }

      res.status(200).json({
        success: true,
        data: {
          comments: result.comments,
          total: result.total
        }
      });
    } catch (error) {
      console.error('❌ Get activity comments error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: '获取评论失败'
        }
      });
    }
  }

  // 添加活动评论
  async addActivityComment(req, res) {
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

      const { activityId } = req.params;
      const userId = req.user.id;
      const { content } = req.body;

      const result = await activityCommentService.addActivityComment(
        activityId,
        userId,
        content
      );

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'ADD_COMMENT_FAILED',
            message: result.error
          }
        });
      }

      res.status(201).json({
        success: true,
        data: { comment: result.comment }
      });
    } catch (error) {
      console.error('❌ Add activity comment error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: '添加评论失败'
        }
      });
    }
  }

  // 删除活动评论
  async deleteActivityComment(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '请求参数无效',
            details: errors.array()
          }
        });
      }

      const { activityId, commentId } = req.params;
      const userId = req.user.id;

      const result = await activityCommentService.deleteActivityComment(
        commentId,
        userId
      );

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'DELETE_COMMENT_FAILED',
            message: result.error
          }
        });
      }

      res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      console.error('❌ Delete activity comment error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: '删除评论失败'
        }
      });
    }
  }

  // 获取评论统计
  async getCommentStats(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '请求参数无效',
            details: errors.array()
          }
        });
      }

      const { activityId } = req.params;

      const result = await activityCommentService.getCommentStats(activityId);

      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: {
            code: 'FETCH_STATS_FAILED',
            message: result.error
          }
        });
      }

      res.status(200).json({
        success: true,
        data: { commentCount: result.commentCount }
      });
    } catch (error) {
      console.error('❌ Get comment stats error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: '获取评论统计失败'
        }
      });
    }
  }
}

// 验证规则
export const activityIdValidation = [
  param('activityId').isUUID().withMessage('活动ID必须是有效的UUID')
];

export const commentIdValidation = [
  param('commentId').isUUID().withMessage('评论ID必须是有效的UUID')
];

export const addCommentValidation = [
  param('activityId').isUUID().withMessage('活动ID必须是有效的UUID'),
  body('content')
    .isString()
    .isLength({ min: 5, max: 2000 })
    .withMessage('评论内容必须是5-2000个字符')
    .trim()
];

export const getCommentsValidation = [
  param('activityId').isUUID().withMessage('活动ID必须是有效的UUID'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('limit必须是1-100之间的整数'),
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('offset必须是非负整数')
];

export default new ActivityCommentController();