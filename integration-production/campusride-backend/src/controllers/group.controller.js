import groupService from '../services/group.service.js';
import { body, query, param, validationResult } from 'express-validator';

class GroupController {
  // 创建小组
  async createGroup(req, res) {
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

      const result = await groupService.createGroup({
        ...req.body,
        creator_id: req.user.id
      });

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'CREATE_GROUP_FAILED',
            message: result.error
          }
        });
      }

      res.status(201).json({
        success: true,
        data: { group: result.group }
      });
    } catch (error) {
      console.error('❌ Create group error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: '创建小组失败'
        }
      });
    }
  }

  // 获取所有小组
  async getGroups(req, res) {
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

      const result = await groupService.getGroups(req.query);

      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: {
            code: 'FETCH_GROUPS_FAILED',
            message: result.error
          }
        });
      }

      res.status(200).json({
        success: true,
        data: {
          groups: result.groups,
          total: result.total
        }
      });
    } catch (error) {
      console.error('❌ Get groups error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: '获取小组列表失败'
        }
      });
    }
  }

  // 获取我的小组
  async getMyGroups(req, res) {
    try {
      const userId = req.user.id;
      const result = await groupService.getMyGroups(userId);

      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: {
            code: 'FETCH_MY_GROUPS_FAILED',
            message: result.error
          }
        });
      }

      res.status(200).json({
        success: true,
        data: { groups: result.groups }
      });
    } catch (error) {
      console.error('❌ Get my groups error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: '获取我的小组失败'
        }
      });
    }
  }

  // 加入小组
  async joinGroup(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '小组ID无效',
            details: errors.array()
          }
        });
      }

      const { groupId } = req.params;
      const userId = req.user.id;

      const result = await groupService.joinGroup(groupId, userId);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'JOIN_GROUP_FAILED',
            message: result.error
          }
        });
      }

      res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      console.error('❌ Join group error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: '加入小组失败'
        }
      });
    }
  }

  // 退出小组
  async leaveGroup(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '小组ID无效',
            details: errors.array()
          }
        });
      }

      const { groupId } = req.params;
      const userId = req.user.id;

      const result = await groupService.leaveGroup(groupId, userId);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'LEAVE_GROUP_FAILED',
            message: result.error
          }
        });
      }

      res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      console.error('❌ Leave group error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: '退出小组失败'
        }
      });
    }
  }

  // 获取小组成员
  async getGroupMembers(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '小组ID无效',
            details: errors.array()
          }
        });
      }

      const { groupId } = req.params;
      const result = await groupService.getGroupMembers(groupId);

      if (!result.success) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'FETCH_MEMBERS_FAILED',
            message: result.error
          }
        });
      }

      res.status(200).json({
        success: true,
        data: { members: result.members }
      });
    } catch (error) {
      console.error('❌ Get group members error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: '获取小组成员失败'
        }
      });
    }
  }

  // 删除小组
  async deleteGroup(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '小组ID无效',
            details: errors.array()
          }
        });
      }

      const { groupId } = req.params;
      const userId = req.user.id;

      const result = await groupService.deleteGroup(groupId, userId);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'DELETE_GROUP_FAILED',
            message: result.error
          }
        });
      }

      res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      console.error('❌ Delete group error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: '删除小组失败'
        }
      });
    }
  }

  // 获取小组消息
  async getGroupMessages(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '小组ID无效',
            details: errors.array()
          }
        });
      }

      const { groupId } = req.params;
      const userId = req.user.id;
      const { limit = 50, offset = 0 } = req.query;

      // 首先检查用户是否是小组成员
      const membershipResult = await groupService.checkMembership(groupId, userId);
      if (!membershipResult.success || !membershipResult.isMember) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'ACCESS_DENIED',
            message: '您不是该小组的成员'
          }
        });
      }

      const result = await groupService.getGroupMessages(groupId, { limit, offset });

      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: {
            code: 'FETCH_MESSAGES_FAILED',
            message: result.error
          }
        });
      }

      res.status(200).json({
        success: true,
        data: {
          messages: result.messages,
          total: result.total
        }
      });
    } catch (error) {
      console.error('❌ Get group messages error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: '获取小组消息失败'
        }
      });
    }
  }

  // 发送小组消息
  async sendGroupMessage(req, res) {
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

      const { groupId } = req.params;
      const userId = req.user.id;
      const { content } = req.body;

      // 首先检查用户是否是小组成员
      const membershipResult = await groupService.checkMembership(groupId, userId);
      if (!membershipResult.success || !membershipResult.isMember) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'ACCESS_DENIED',
            message: '您不是该小组的成员'
          }
        });
      }

      const result = await groupService.sendGroupMessage(groupId, userId, content);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'SEND_MESSAGE_FAILED',
            message: result.error
          }
        });
      }

      res.status(201).json({
        success: true,
        data: { message: result.message }
      });
    } catch (error) {
      console.error('❌ Send group message error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: '发送消息失败'
        }
      });
    }
  }
}

// 验证规则
export const createGroupValidation = [
  body('name').isString().isLength({ min: 1, max: 100 }).withMessage('小组名称必须是1-100个字符'),
  body('description').optional().isString().isLength({ max: 1000 }).withMessage('描述最多1000个字符'),
  body('cover_image').optional().custom((value) => {
    // 允许空字符串或有效的URL
    if (!value || value.trim() === '') return true;
    return /^https?:\/\/.+/.test(value);
  }).withMessage('封面图片必须是有效的URL或留空')
];

export const getGroupsValidation = [
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit必须是1-100之间的整数'),
  query('offset').optional().isInt({ min: 0 }).withMessage('offset必须是非负整数'),
  query('search').optional().isString().isLength({ max: 100 }).withMessage('搜索词最多100个字符')
];

  // 禁言用户
  async muteUser(req, res) {
    try {
      const { groupId, userId } = req.params;
      const adminId = req.user.id;
      const { reason } = req.body;

      // 检查是否是管理员
      const adminCheck = await groupService.isGroupAdmin(groupId, adminId);
      if (!adminCheck.success || !adminCheck.isAdmin) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'NOT_ADMIN',
            message: '只有群组管理员可以禁言用户'
          }
        });
      }

      const result = await groupService.muteUser(groupId, userId, adminId, reason);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'MUTE_FAILED',
            message: result.error
          }
        });
      }

      res.status(200).json({
        success: true,
        data: result.data
      });
    } catch (error) {
      console.error('❌ Mute user error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: '禁言用户失败'
        }
      });
    }
  }

  // 取消禁言用户
  async unmuteUser(req, res) {
    try {
      const { groupId, userId } = req.params;
      const adminId = req.user.id;

      // 检查是否是管理员
      const adminCheck = await groupService.isGroupAdmin(groupId, adminId);
      if (!adminCheck.success || !adminCheck.isAdmin) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'NOT_ADMIN',
            message: '只有群组管理员可以取消禁言'
          }
        });
      }

      const result = await groupService.unmuteUser(groupId, userId);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'UNMUTE_FAILED',
            message: result.error
          }
        });
      }

      res.status(200).json({
        success: true,
        data: result.data
      });
    } catch (error) {
      console.error('❌ Unmute user error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: '取消禁言失败'
        }
      });
    }
  }

  // 撤回消息
  async deleteMessage(req, res) {
    try {
      const { groupId, messageId } = req.params;
      const deletedByUserId = req.user.id;
      const { reason } = req.body;

      // 检查是否是管理员
      const adminCheck = await groupService.isGroupAdmin(groupId, deletedByUserId);
      if (!adminCheck.success || !adminCheck.isAdmin) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'NOT_ADMIN',
            message: '只有群组管理员可以撤回消息'
          }
        });
      }

      const result = await groupService.deleteMessage(messageId, deletedByUserId, reason);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'DELETE_MESSAGE_FAILED',
            message: result.error
          }
        });
      }

      res.status(200).json({
        success: true,
        data: result.message
      });
    } catch (error) {
      console.error('❌ Delete message error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: '撤回消息失败'
        }
      });
    }
  }
}

export const groupIdValidation = [
  param('groupId').isUUID().withMessage('小组ID必须是有效的UUID')
];

export const sendGroupMessageValidation = [
  param('groupId').isUUID().withMessage('小组ID必须是有效的UUID'),
  body('content').isString().isLength({ min: 1, max: 2000 }).withMessage('消息内容必须是1-2000个字符')
];

export const getGroupMessagesValidation = [
  param('groupId').isUUID().withMessage('小组ID必须是有效的UUID'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit必须是1-100之间的整数'),
  query('offset').optional().isInt({ min: 0 }).withMessage('offset必须是非负整数')
];

export default new GroupController();
