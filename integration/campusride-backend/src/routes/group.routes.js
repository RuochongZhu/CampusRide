import express from 'express';
import groupController, {
  createGroupValidation,
  getGroupsValidation,
  groupIdValidation
} from '../controllers/group.controller.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import { authenticateToken, requireRegisteredUser } from '../middleware/auth.middleware.js';

const router = express.Router();

// 所有小组路由都需要认证
router.use(authenticateToken);

// 获取所有小组 (guest可以查看)
router.get('/',
  getGroupsValidation,
  asyncHandler(groupController.getGroups.bind(groupController))
);

// 获取我的小组 (需要注册用户)
router.get('/my',
  requireRegisteredUser,
  asyncHandler(groupController.getMyGroups.bind(groupController))
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

// 删除小组 (需要注册用户)
router.delete('/:groupId',
  requireRegisteredUser,
  groupIdValidation,
  asyncHandler(groupController.deleteGroup.bind(groupController))
);

export default router;
