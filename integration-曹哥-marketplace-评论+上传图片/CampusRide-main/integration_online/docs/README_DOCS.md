# 📚 CampusRide 文档索引

## 核心文档（已整理）

### 1. 📖 [PROJECT_HANDOVER.md](./PROJECT_HANDOVER.md)
**完整的项目交接文档** - 必读！

包含内容：
- ✅ 项目概述与技术栈
- ✅ 完整的数据库设计（已有 + 待开发）
- ✅ 环境配置详解（如何替换 Supabase/Resend）
- ✅ 前后端运行逻辑详解
- ✅ 已实现功能清单
- ✅ Carpooling 开发指南（含完整SQL）
- ✅ 常见问题解答

**适合**: 新接手的开发者完整阅读

---

### 2. 📋 [QUICK_REFERENCE.md](./QUICK_REFERENCE.md)
**快速参考卡片**

包含内容：
- ⚡ 一分钟快速启动
- 🔑 必须替换的配置清单
- 📊 数据库表概览
- 🛠️ 常用命令速查
- 🎯 下一步开发提示

**适合**: 日常开发快速查阅

---

### 3. 🛠️ [server-manager.sh](./server-manager.sh)
**服务管理脚本** - 必须保留！

功能：
- 启动/停止/重启前后端服务
- 清理缓存
- 查看日志
- 检查服务状态

使用:
```bash
./server-manager.sh start    # 启动
./server-manager.sh stop     # 停止
./server-manager.sh restart  # 重启
./server-manager.sh status   # 状态
./server-manager.sh logs     # 日志
```

---

## 临时文档（可清理）

以下文档是开发过程中创建的临时文件，内容已整合到上述核心文档中：

- ❌ `marketplace_migration.sql` - 已整合到 PROJECT_HANDOVER.md
- ❌ `setup-marketplace-db.sh` - 一次性使用
- ❌ `run-migration.sh` - 一次性使用
- ❌ `diagnose-marketplace.sh` - 调试工具（已完成）
- ❌ `FUNCTION_CHECK.md` - 功能检查（已确认）
- ❌ `MARKETPLACE_INTEGRATION.md` - 已整合
- ❌ `START_GUIDE.md` - 已整合到 QUICK_REFERENCE.md

---

## 清理临时文件

运行清理脚本：
```bash
./cleanup-docs.sh
```

清理后将只保留3个核心文件：
1. PROJECT_HANDOVER.md
2. QUICK_REFERENCE.md
3. server-manager.sh

---

## 数据库迁移文件位置

原始迁移文件（保留）：
```
integration/campusride-backend/database/migrations/
├── 004_marketplace_schema.sql  ✅ Marketplace (已运行)
└── (待添加) 005_carpooling_schema.sql  ⏳ Carpooling (待创建)
```

---

## 目录结构概览

```
CampusRide/
├── PROJECT_HANDOVER.md          ← 📖 完整交接文档
├── QUICK_REFERENCE.md           ← 📋 快速参考
├── server-manager.sh            ← 🛠️ 服务管理
├── cleanup-docs.sh              ← 🧹 清理脚本
├── README.md                    ← (如果有的话)
└── integration/
    ├── src/                     ← 前端源码
    │   ├── views/              ← 页面组件
    │   ├── utils/api.js        ← API调用
    │   └── router/index.js     ← 路由配置
    └── campusride-backend/      ← 后端源码
        ├── .env                 ← 🔑 配置文件
        ├── src/
        │   ├── controllers/    ← 控制器
        │   ├── routes/         ← 路由
        │   └── services/       ← 服务层
        └── database/
            └── migrations/      ← 数据库迁移
```

---

## 快速开始（新开发者）

### 第一次设置

1. **阅读文档**
   ```bash
   # 先看快速参考
   cat QUICK_REFERENCE.md

   # 再看完整交接文档
   cat PROJECT_HANDOVER.md
   ```

2. **配置环境**
   ```bash
   cd integration/campusride-backend
   cp .env.example .env
   # 编辑 .env，替换 Supabase 和 Resend 配置
   ```

3. **安装依赖**
   ```bash
   # 后端
   cd integration/campusride-backend
   npm install

   # 前端
   cd ../
   npm install
   ```

4. **启动服务**
   ```bash
   cd ../..
   ./server-manager.sh start
   ```

### 日常开发

```bash
# 每天开始工作
./server-manager.sh start

# 遇到问题时
./server-manager.sh restart

# 完成工作
./server-manager.sh stop
```

---

## 技术支持

如有问题，按顺序查看：
1. `QUICK_REFERENCE.md` - 快速解答
2. `PROJECT_HANDOVER.md` - 详细说明
3. 后端日志: `tail -f /tmp/backend.log`
4. API文档: http://localhost:3001/api-docs

---

**建议**:
- ✅ 保留此 README_DOCS.md 作为文档导航
- ✅ 运行 `./cleanup-docs.sh` 清理临时文件
- ✅ 将核心文档提交到版本控制

**最后更新**: 2025年10月3日
