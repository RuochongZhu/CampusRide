# CampusRide 后端开发文档中心

## 📚 文档概览

欢迎来到 CampusRide 后端开发文档中心！本项目采用双模块并行开发架构，由两位开发者协作完成。

### 👥 开发团队

- **Cursor AI**: 负责基础架构、用户系统、拼车系统、二手市场
- **Claude Code**: 负责活动系统、积分系统、排行榜、实时通信

## 🗂️ 文档导航

### 🚀 快速开始

- [**快速启动指南**](./quick-start-guide.md) - 新手必读，包含环境搭建和开发流程

### 🏗️ 架构设计

- [**架构决策记录**](./architecture-decisions.md) - 重要的技术选型和架构决策
- [**API 标准规范**](./api-standards-specification.md) - 统一的 API 设计和命名规范

### 📋 模块文档

- [**模块 1 - Claude Code 负责**](./backend-module-1-claude-code.md)

  - 用户认证系统
  - 活动管理系统
  - 排行榜系统
  - 实时通信功能

- [**模块 2 - Cursor AI 负责**](./backend-module-2-cursor-ai.md)
  - 项目基础架构
  - 拼车系统
  - 二手市场系统
  - 通知系统
  - 文件管理系统

### 🧪 测试与质量

- [**集成测试规范**](./integration-testing-standards.md) - 模块间集成测试指南
- [**开发反馈系统**](./development-feedback-system.md) - 代码审查和反馈机制

## 📊 开发进度追踪

### Sprint 1 (第 1 周) - ✅ 已完成

- [x] **Cursor AI**: 基础架构搭建 ✅
- [x] **Cursor AI**: 用户认证系统 ✅
- [x] **Claude Code**: Socket.io 集成 ✅
- [x] **Claude Code**: 通知服务接口 ✅

### Sprint 2 (第 2 周) - ✅ 已完成

- [x] **Cursor AI**: 拼车系统开发 ✅
- [x] **Claude Code**: 活动管理系统 ✅
- [x] **共同**: 接口集成测试 ✅

### Sprint 3 (第 3 周) - ✅ 已完成

- [x] **Cursor AI**: 二手市场系统 ✅
- [x] **Claude Code**: 积分和排行榜 ✅
- [x] **共同**: 系统集成和优化 ✅

### 🎯 最终完善阶段 - ✅ 已完成

- [x] **Cursor AI**: 测试框架和API文档 ✅
- [x] **Cursor AI**: 部署配置和启动脚本 ✅
- [x] **Cursor AI**: 项目文档和README ✅
- [x] **共同**: 最终验证和集成 ✅

### 🏆 项目状态

**完成度**: 🚀 100% - 所有核心功能已完成  
**质量**: ✅ 生产就绪  
**协作**: 🤝 双AI协作成功  
**文档**: 📖 完整且详细

状态说明: ✅ 已完成 | ⏳ 进行中 | 🚧 已开始 | 📅 计划中

## 🛠️ 开发工具

### 推荐的开发环境

- **IDE**: VSCode with ESLint, Prettier
- **API 测试**: Postman / Insomnia
- **数据库工具**: pgAdmin / DBeaver
- **Git GUI**: SourceTree / GitKraken

### 常用命令

```bash
# 开发
npm run dev              # 启动开发服务器
npm run dev:cursor-ai    # 只启动Cursor AI模块
npm run dev:claude-code  # 只启动Claude Code模块

# 测试
npm test                 # 运行所有测试
npm run test:coverage    # 测试覆盖率
npm run test:integration # 集成测试

# 代码质量
npm run lint            # 代码检查
npm run format          # 代码格式化

# 数据库
npm run db:migrate      # 运行迁移
npm run db:seed         # 填充测试数据
npm run db:reset        # 重置数据库
```

## 📞 获取帮助

### 遇到问题？

1. 先查看相关文档
2. 检查 [常见问题](./quick-start-guide.md#常见问题)
3. 在开发反馈系统中记录问题
4. 联系相应的负责人

### 文档问题

如果发现文档有误或需要更新，请：

1. 创建 Issue 描述问题
2. 提交 PR 进行修正
3. @相关负责人审查

## 🔄 文档更新记录

| 日期       | 更新内容                   | 更新者 |
| ---------- | -------------------------- | ------ |
| 2024-01-25 | 整合外部文档到 docs 文件夹 | System |
| 2024-01-25 | 创建快速启动指南           | System |
| 2024-01-25 | 添加架构决策记录           | System |

---

**记住**: 好的文档是项目成功的关键！请保持文档与代码同步更新。
