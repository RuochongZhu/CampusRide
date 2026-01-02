# CampusRide - 校园社交平台

> 一个集成拼车、二手交易、活动组织、积分排行的综合性校园平台

## 🚀 快速开始

### 1. 项目启动
```bash
# 方式1：自动启动脚本
./server-manager.sh start

# 方式2：手动启动
cd integration/campusride-backend && npm run dev &
cd integration && npm run dev
```

### 2. 访问地址
- **前端**: http://localhost:3000
- **后端API**: http://localhost:3001
- **API文档**: http://localhost:3001/api-docs

## 📚 项目结构

```
CampusRide/
├── integration/                  # 主项目目录
│   ├── src/                     # Vue3 前端源码
│   ├── campusride-backend/      # Node.js 后端源码
│   ├── docs/                    # 项目文档（新增）
│   │   ├── ACTIVITY_FEATURE_COMPARISON.md
│   │   ├── PROJECT_SUMMARY.md
│   │   ├── ARCHITECTURE_OVERVIEW.md
│   │   └── LOCALHOST_FIX_GUIDE.md
│   └── README.md               # 技术文档
├── server-manager.sh           # 服务管理脚本
├── start-services.sh          # 简单启动脚本
└── README.md                  # 本文件（项目总览）
```

## ✨ 核心功能

### 1. 🚗 拼车系统 (Carpooling)
- 发布/搜索拼车信息
- 实时位置匹配
- 座位预订管理
- 评价反馈系统

### 2. 🛒 二手市场 (Marketplace)
- 商品发布与浏览
- 分类筛选搜索
- 收藏夹功能
- 交易状态跟踪

### 3. 🎯 活动系统 (Activities)
- **活动创建与管理**
- **参与者注册系统**
- **实时签到功能** ⭐
- **地理位置验证**
- **积分奖励机制**

### 4. 👥 社交群组 (Groups)
- 兴趣群组创建
- 位置分享功能
- 实时消息交流
- 群组活动组织

### 5. 🏆 积分排行 (Leaderboard)
- 用户积分系统
- 排行榜展示
- 积分规则管理
- 激励机制

## 🛠 技术栈

### 前端
- **Vue 3** + Composition API
- **Vite** (构建工具)
- **Tailwind CSS** + Ant Design Vue
- **Pinia** (状态管理)
- **Google Maps API**

### 后端
- **Node.js** + Express
- **Supabase** (PostgreSQL)
- **JWT** 身份认证
- **Socket.io** 实时通信
- **Resend** 邮件服务

## 📖 详细文档

| 文档 | 说明 | 路径 |
|------|------|------|
| 📋 项目总览 | 完整技术栈和API概览 | `/integration/docs/PROJECT_SUMMARY.md` |
| 🔧 Activity功能对比 | 活动系统功能分析 | `/integration/docs/ACTIVITY_FEATURE_COMPARISON.md` |
| 🏗 架构概览 | 系统架构设计 | `/integration/docs/ARCHITECTURE_OVERVIEW.md` |
| 🚨 故障排除 | 常见问题解决方案 | `/integration/docs/LOCALHOST_FIX_GUIDE.md` |
| ⚡ 快速指南 | 开发环境配置 | `/integration/QUICK_START.md` |
| 🐛 问题排查 | 调试指南 | `/integration/TROUBLESHOOTING.md` |

## 🎯 当前开发状态

### ✅ 已完成功能
- [x] 用户认证系统
- [x] 拼车功能完整实现
- [x] 二手市场功能
- [x] 基础活动管理
- [x] 群组社交功能
- [x] 积分排行系统
- [x] **活动实时签到** (新增)

### 🚧 正在开发
- [ ] 完整活动列表页面整合
- [ ] 参与者管理系统
- [ ] 签到码验证系统
- [ ] 推送通知系统

### 📋 待优化
- [ ] 移动端响应式优化
- [ ] 性能优化和缓存
- [ ] 单元测试覆盖
- [ ] 部署CI/CD

## 🔑 环境配置

### 必需的环境变量

#### 前端 (.env)
```env
VITE_API_BASE_URL=http://localhost:3001
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key
```

#### 后端 (.env)
```env
PORT=3001
FRONTEND_URL=http://localhost:3000
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key
JWT_SECRET=your_jwt_secret
RESEND_API_KEY=your_resend_key
```

## 🚨 常见问题

### 服务无法启动？
```bash
# 检查端口占用
lsof -i :3000
lsof -i :3001

# 重启服务
./server-manager.sh restart
```

### API请求失败？
```bash
# 检查后端健康状态
curl http://localhost:3001/api/v1/health

# 查看错误日志
./server-manager.sh logs backend
```

详细解决方案请查看: `/integration/docs/LOCALHOST_FIX_GUIDE.md`

## 📊 API接口

### 主要端点预览
- `POST /api/v1/auth/login` - 用户登录
- `GET /api/v1/activities` - 活动列表
- `POST /api/v1/activities/:id/checkin` - 活动签到 ⭐
- `GET /api/v1/marketplace/items` - 商品列表
- `POST /api/v1/carpooling/rides` - 发布拼车
- `GET /api/v1/leaderboard` - 积分排行

完整API文档: http://localhost:3001/api-docs

## 🔮 路线图

### Q4 2024
- [x] 核心功能开发完成
- [x] 活动签到系统
- [x] 实时位置验证

### Q1 2025
- [ ] 移动端App开发
- [ ] 高级搜索功能
- [ ] 智能推荐系统

### Q2 2025
- [ ] 多校园支持
- [ ] 第三方支付集成
- [ ] 数据分析仪表板

## 🤝 贡献

1. Fork 项目
2. 创建功能分支: `git checkout -b feature/amazing-feature`
3. 提交更改: `git commit -m 'Add some amazing feature'`
4. 推送分支: `git push origin feature/amazing-feature`
5. 提交Pull Request

## 📝 许可证

MIT License - 详见 LICENSE 文件

## 🆘 获取帮助

- 📖 查看 `/integration/docs/` 下的详细文档
- 🐛 提交 Issue 报告问题
- 💬 联系开发团队

---

**🌟 如果这个项目对你有帮助，请给我们一个Star！**

> Built with ❤️ for Cornell University and beyond