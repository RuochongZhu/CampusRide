import express from 'express';
import visibilityController, {
  updateVisibilityValidation,
  getVisibleUsersValidation
} from '../controllers/visibility.controller.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import { authenticateToken, requireRegisteredUser } from '../middleware/auth.middleware.js';

const router = express.Router();

// 所有可见性路由都需要认证
router.use(authenticateToken);

// 获取我的可见性状态 (需要注册用户)
router.get('/my',
  requireRegisteredUser,
  asyncHandler(visibilityController.getMyVisibility.bind(visibilityController))
);

// 更新可见性 (需要注册用户)
router.put('/',
  requireRegisteredUser,
  updateVisibilityValidation,
  asyncHandler(visibilityController.updateVisibility.bind(visibilityController))
);

// 获取地图上可见的用户
router.get('/map',
  getVisibleUsersValidation,
  asyncHandler(visibilityController.getVisibleUsers.bind(visibilityController))
);

export default router;
