# Marketplace 代码结构分析

## 后端文件位置

### 商品管理
- **路由**: `CampusRide-main/integration/campusride-backend/src/routes/marketplace.routes.js`
- **控制器**: `CampusRide-main/integration/campusride-backend/src/controllers/marketplace.controller.js`

### 消息系统
- **路由**: `CampusRide-main/integration/campusride-backend/src/routes/marketplace-messages.routes.js`
- **控制器**: `CampusRide-main/integration/campusride-backend/src/controllers/marketplace-messages.controller.js`

### 文件上传
- **路由**: `CampusRide-main/integration/campusride-backend/src/routes/upload.routes.js`
- **控制器**: `CampusRide-main/integration/campusride-backend/src/controllers/upload.controller.js`

## 数据库表

### 商品表
- **文件**: `database/migrations/004_marketplace_schema.sql`
- **表**: marketplace_items (商品), item_favorites (收藏)

### 评论表
- **文件**: `database/migrations/005_marketplace_comments_schema.sql`
- **表**: marketplace_comments (评论), marketplace_comment_likes (点赞)

### 消息表
- **文件**: `database/migrations/006_marketplace_messages_schema.sql`
- **表**: marketplace_conversations, marketplace_messages

## 前端文件

### 主页面
- **文件**: `src/views/MarketplaceView.vue` (441 行)
- **功能**: 商品列表、搜索、筛选、发布、收藏

### API 客户端
- **文件**: `src/utils/api.js`
- **对象**: marketplaceAPI

## 已实现功能

- [x] 商品 CRUD
- [x] 商品搜索和筛选
- [x] 收藏功能
- [x] 文件上传 API
- [x] 消息系统
- [x] 浏览次数统计

## 需要实现的功能

1. **删除商品** (后端已实现，前端 UI 缺失)
2. **图片上传** (后端完整，前端组件缺失)
3. **评论系统** (数据库完整，后端 API 缺失)
4. **收藏列表页** (后端完整，前端页面缺失)
5. **我的商品页** (后端完整，前端页面缺失)

