import express from 'express';
import groupController, {
  createGroupValidation,
  getGroupsValidation,
  groupIdValidation,
  sendGroupMessageValidation,
  getGroupMessagesValidation
} from '../controllers/group.controller.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import { authenticateToken, requireRegisteredUser } from '../middleware/auth.middleware.js';

const router = express.Router();

// 所有小组路由都需要认证
router.use(authenticateToken);

// 获取我的小组 (需要注册用户) - 必须放在 /:groupId 之前
router.get('/my',
  requireRegisteredUser,
  asyncHandler(groupController.getMyGroups.bind(groupController))
);

// 获取所有小组 (guest可以查看)
router.get('/',
  getGroupsValidation,
  asyncHandler(groupController.getGroups.bind(groupController))
);

// 创建小组 (需要注册用户)
router.post('/',
  requireRegisteredUser,
  createGroupValidation,
  asyncHandler(groupController.createGroup.bind(groupController))
);

// 获取小组成员
router.get('/:groupId/members',
  groupIdValidation,
  asyncHandler(groupController.getGroupMembers.bind(groupController))
);

// 加入小组 (需要注册用户)
router.post('/:groupId/join',
  requireRegisteredUser,
  groupIdValidation,
  asyncHandler(groupController.joinGroup.bind(groupController))
);

// 退出小组 (需要注册用户)
router.delete('/:groupId/leave',
  requireRegisteredUser,
  groupIdValidation,
  asyncHandler(groupController.leaveGroup.bind(groupController))
);

// 获取小组消息 (需要注册用户) - 必须放在 DELETE /:groupId 之前
router.get('/:groupId/messages',
  requireRegisteredUser,
  getGroupMessagesValidation,
  asyncHandler(groupController.getGroupMessages.bind(groupController))
);

// 发送小组消息 (需要注册用户)
router.post('/:groupId/messages',
  requireRegisteredUser,
  sendGroupMessageValidation,
  asyncHandler(groupController.sendGroupMessage.bind(groupController))
);

// 禁言用户 (需要注册用户)
router.post('/:groupId/mute/:userId',
  requireRegisteredUser,
  groupIdValidation,
  asyncHandler(groupController.muteUser.bind(groupController))
);

// 取消禁言用户 (需要注册用户)
router.delete('/:groupId/mute/:userId',
  requireRegisteredUser,
  groupIdValidation,
  asyncHandler(groupController.unmuteUser.bind(groupController))
);

// 撤回消息 (需要注册用户)
router.delete('/:groupId/messages/:messageId',
  requireRegisteredUser,
  groupIdValidation,
  asyncHandler(groupController.deleteMessage.bind(groupController))
);

// 删除小组 (需要注册用户) - 必须放在最后
router.delete('/:groupId',
  requireRegisteredUser,
  groupIdValidation,
  asyncHandler(groupController.deleteGroup.bind(groupController))
);

export default router;
