import express from 'express';
import thoughtController, {
  createThoughtValidation,
  getThoughtsValidation,
  getMapThoughtsValidation,
  thoughtIdValidation
} from '../controllers/thought.controller.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import { authenticateToken, requireRegisteredUser } from '../middleware/auth.middleware.js';

const router = express.Router();

// 所有想法路由都需要认证
router.use(authenticateToken);

// 获取想法列表
router.get('/',
  getThoughtsValidation,
  asyncHandler(thoughtController.getThoughts.bind(thoughtController))
);

// 获取地图上的想法点位
router.get('/map',
  getMapThoughtsValidation,
  asyncHandler(thoughtController.getMapThoughts.bind(thoughtController))
);

// 获取我的想法 (需要注册用户)
router.get('/my',
  requireRegisteredUser,
  asyncHandler(thoughtController.getUserThoughts.bind(thoughtController))
);

// 发布想法 (需要注册用户)
router.post('/',
  requireRegisteredUser,
  createThoughtValidation,
  asyncHandler(thoughtController.createThought.bind(thoughtController))
);

// 删除想法 (需要注册用户)
router.delete('/:thoughtId',
  requireRegisteredUser,
  thoughtIdValidation,
  asyncHandler(thoughtController.deleteThought.bind(thoughtController))
);

export default router;
