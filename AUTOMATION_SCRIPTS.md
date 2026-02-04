# 🔧 自动化修复脚本

## 脚本 1：一键修复 integration_online2025

**文件名：** `fix_online2025.sh`

```bash
#!/bin/bash

set -e  # 遇到错误立即退出

echo "🔧 开始修复 integration_online2025..."
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查目录是否存在
if [ ! -d "integration_online2025" ]; then
    echo -e "${RED}❌ 错误：integration_online2025 目录不存在${NC}"
    exit 1
fi

if [ ! -d "integration-production" ]; then
    echo -e "${RED}❌ 错误：integration-production 目录不存在${NC}"
    exit 1
fi

# 步骤 1：复制 NotificationDropdown 组件
echo -e "${YELLOW}📋 步骤 1：复制 NotificationDropdown 组件...${NC}"
mkdir -p integration_online2025/src/components/common
cp integration-production/src/components/common/NotificationDropdown.vue \
   integration_online2025/src/components/common/NotificationDropdown.vue
echo -e "${GREEN}✅ 完成${NC}"
echo ""

# 步骤 2：复制消息控制器
echo -e "${YELLOW}📋 步骤 2：复制消息控制器...${NC}"
mkdir -p integration_online2025/campusride-backend/src/controllers
cp integration-production/campusride-backend/src/controllers/message.controller.js \
   integration_online2025/campusride-backend/src/controllers/message.controller.js
echo -e "${GREEN}✅ 完成${NC}"
echo ""

# 步骤 3：验证文件
echo -e "${YELLOW}📋 步骤 3：验证文件...${NC}"
if [ -f "integration_online2025/src/components/common/NotificationDropdown.vue" ]; then
    echo -e "${GREEN}✅ NotificationDropdown.vue 存在${NC}"
else
    echo -e "${RED}❌ NotificationDropdown.vue 不存在${NC}"
    exit 1
fi

if [ -f "integration_online2025/campusride-backend/src/controllers/message.controller.js" ]; then
    echo -e "${GREEN}✅ message.controller.js 存在${NC}"
else
    echo -e "${RED}❌ message.controller.js 不存在${NC}"
    exit 1
fi
echo ""

# 步骤 4：显示需要手动修改的文件
echo -e "${YELLOW}📋 步骤 4：需要手动修改的文件${NC}"
echo ""
echo -e "${YELLOW}1️⃣  integration_online2025/src/components/layout/HeaderComponent.vue${NC}"
echo "   - 添加导入：import NotificationDropdown from '@/components/common/NotificationDropdown.vue'"
echo "   - 移除 BellOutlined 导入"
echo "   - 第 54-64 行替换为：<NotificationDropdown />"
echo "   - 删除 handleBellClick 方法"
echo "   - 删除轮询代码"
echo ""
echo -e "${YELLOW}2️⃣  integration_online2025/src/stores/message.js${NC}"
echo "   - 第 14 行添加：const customSelectedThread = ref(null)"
echo "   - 第 16-23 行更新 selectedThread computed"
echo "   - 第 196-198 行更新 closeThread 方法"
echo "   - 第 198 行后添加 selectSystemMessages 方法"
echo "   - 第 198 行后添加 setMessagesLoading 方法"
echo "   - 第 320-349 行更新 return 对象"
echo ""

echo -e "${GREEN}🎉 自动修复完成！${NC}"
echo ""
echo -e "${YELLOW}📖 详细说明请查看：${NC}"
echo "   - PATCH_ONLINE2025_HEADER.md"
echo "   - PATCH_ONLINE2025_MESSAGE_STORE.md"
echo ""
echo -e "${YELLOW}🚀 下一步：${NC}"
echo "   1. 手动修改上述两个文件"
echo "   2. 运行：cd integration_online2025 && npm install && npm run dev"
echo "   3. 打开浏览器：http://localhost:3000"
echo "   4. 测试消息功能"
```

---

## 脚本 2：一键修复 integration_backup_local_1.2.9

**文件名：** `fix_backup_local.sh`

```bash
#!/bin/bash

set -e

echo "🔧 开始修复 integration_backup_local_1.2.9..."
echo ""

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 检查目录
if [ ! -d "integration_backup_local_1.2.9" ]; then
    echo -e "${RED}❌ 错误：integration_backup_local_1.2.9 目录不存在${NC}"
    exit 1
fi

if [ ! -d "integration-production" ]; then
    echo -e "${RED}❌ 错误：integration-production 目录不存在${NC}"
    exit 1
fi

# 步骤 1：复制 NotificationDropdown
echo -e "${YELLOW}📋 步骤 1：复制 NotificationDropdown 组件...${NC}"
mkdir -p integration_backup_local_1.2.9/src/components/common
cp integration-production/src/components/common/NotificationDropdown.vue \
   integration_backup_local_1.2.9/src/components/common/NotificationDropdown.vue
echo -e "${GREEN}✅ 完成${NC}"
echo ""

# 步骤 2：复制消息控制器
echo -e "${YELLOW}📋 步骤 2：复制消息控制器...${NC}"
mkdir -p integration_backup_local_1.2.9/campusride-backend/src/controllers
cp integration-production/campusride-backend/src/controllers/message.controller.js \
   integration_backup_local_1.2.9/campusride-backend/src/controllers/message.controller.js
echo -e "${GREEN}✅ 完成${NC}"
echo ""

# 步骤 3：验证文件
echo -e "${YELLOW}📋 步骤 3：验证文件...${NC}"
if [ -f "integration_backup_local_1.2.9/src/components/common/NotificationDropdown.vue" ]; then
    echo -e "${GREEN}✅ NotificationDropdown.vue 存在${NC}"
else
    echo -e "${RED}❌ NotificationDropdown.vue 不存在${NC}"
    exit 1
fi

if [ -f "integration_backup_local_1.2.9/campusride-backend/src/controllers/message.controller.js" ]; then
    echo -e "${GREEN}✅ message.controller.js 存在${NC}"
else
    echo -e "${RED}❌ message.controller.js 不存在${NC}"
    exit 1
fi
echo ""

# 步骤 4：显示需要手动修改的文件
echo -e "${YELLOW}📋 步骤 4：需要手动修改的文件${NC}"
echo ""
echo -e "${YELLOW}1️⃣  integration_backup_local_1.2.9/src/stores/message.js${NC}"
echo "   - 第 220-244 行修复 addNewMessage bug"
echo "   - 第 116-134 行优化 markThreadAsRead 性能"
echo "   - 添加 customSelectedThread 状态"
echo "   - 更新 selectedThread computed"
echo "   - 更新 closeThread 方法"
echo "   - 添加 selectSystemMessages 方法"
echo "   - 添加 setMessagesLoading 方法"
echo "   - 更新 return 对象"
echo ""
echo -e "${YELLOW}2️⃣  integration_backup_local_1.2.9/src/components/layout/HeaderComponent.vue${NC}"
echo "   - 添加导入：import NotificationDropdown from '@/components/common/NotificationDropdown.vue'"
echo "   - 移除 BellOutlined 导入"
echo "   - 第 54-64 行替换为：<NotificationDropdown />"
echo "   - 删除 handleBellClick 方法"
echo "   - 删除轮询代码"
echo ""

echo -e "${GREEN}🎉 自动修复完成！${NC}"
echo ""
echo -e "${YELLOW}📖 详细说明请查看：${NC}"
echo "   - FIXING_GUIDE.md（修复方案 B）"
echo ""
echo -e "${YELLOW}🚀 下一步：${NC}"
echo "   1. 手动修改上述两个文件"
echo "   2. 运行：cd integration_backup_local_1.2.9 && npm install && npm run dev"
echo "   3. 打开浏览器：http://localhost:3000"
echo "   4. 测试消息功能"
```

---

## 脚本 3：测试所有版本

**文件名：** `test_all_versions.sh`

```bash
#!/bin/bash

echo "🧪 开始测试所有版本..."
echo ""

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 测试函数
test_version() {
    local version=$1
    local port=$2

    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}🧪 测试版本：$version${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""

    if [ ! -d "$version" ]; then
        echo -e "${RED}❌ 目录不存在：$version${NC}"
        return 1
    fi

    cd "$version"

    # 检查必要文件
    echo -e "${YELLOW}📋 检查必要文件...${NC}"

    if [ -f "src/components/common/NotificationDropdown.vue" ]; then
        echo -e "${GREEN}✅ NotificationDropdown.vue 存在${NC}"
    else
        echo -e "${RED}❌ NotificationDropdown.vue 不存在${NC}"
    fi

    if [ -f "src/stores/message.js" ]; then
        echo -e "${GREEN}✅ message.js 存在${NC}"
    else
        echo -e "${RED}❌ message.js 不存在${NC}"
    fi

    if [ -f "src/components/layout/HeaderComponent.vue" ]; then
        echo -e "${GREEN}✅ HeaderComponent.vue 存在${NC}"
    else
        echo -e "${RED}❌ HeaderComponent.vue 不存在${NC}"
    fi

    echo ""

    # 检查代码质量
    echo -e "${YELLOW}📋 检查代码质量...${NC}"

    if npm run lint 2>/dev/null; then
        echo -e "${GREEN}✅ 代码检查通过${NC}"
    else
        echo -e "${YELLOW}⚠️  代码检查有警告${NC}"
    fi

    echo ""

    # 显示启动命令
    echo -e "${YELLOW}🚀 启动命令：${NC}"
    echo "   npm install"
    echo "   npm run dev"
    echo "   浏览器打开：http://localhost:$port"
    echo ""

    cd ..
}

# 测试所有版本
test_version "integration-production" "3000"
test_version "integration_online2025" "3001"
test_version "integration_backup_local_1.2.9" "3002"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🎉 测试完成！${NC}"
echo ""
echo -e "${YELLOW}📝 测试检查清单：${NC}"
echo "   □ 小铃铛显示"
echo "   □ 红点显示"
echo "   □ 未读计数正确"
echo "   □ 打开消息后红点消失"
echo "   □ 实时更新正常"
echo "   □ 系统消息功能"
echo "   □ 用户阻止功能"
echo "   □ 消息反应功能"
```

---

## 使用方法

### 在 macOS/Linux 上运行

```bash
# 1. 给脚本添加执行权限
chmod +x fix_online2025.sh
chmod +x fix_backup_local.sh
chmod +x test_all_versions.sh

# 2. 运行修复脚本
./fix_online2025.sh
# 或
./fix_backup_local.sh

# 3. 运行测试脚本
./test_all_versions.sh
```

### 在 Windows 上运行

```bash
# 使用 Git Bash 或 WSL
bash fix_online2025.sh
bash fix_backup_local.sh
bash test_all_versions.sh
```

---

## 脚本 4：生成测试报告

**文件名：** `generate_test_report.sh`

```bash
#!/bin/bash

echo "📊 生成测试报告..."
echo ""

# 创建报告文件
REPORT_FILE="TEST_REPORT_$(date +%Y%m%d_%H%M%S).md"

cat > "$REPORT_FILE" << 'EOF'
# 📊 CampusRide 消息计数功能测试报告

**测试日期：** $(date)
**测试人员：** [请填写]
**测试环境：** [请填写]

---

## 📋 测试版本

### integration-production
- **状态：** ✅ 参考标准
- **预期结果：** 所有功能正常

### integration_online2025
- **状态：** ⚠️ 修复中
- **预期结果：** 修复后与 production 相同

### integration_backup_local_1.2.9
- **状态：** ⚠️ 修复中
- **预期结果：** 修复后与 production 相同

---

## 🧪 测试场景

### 场景 1：基础未读计数显示

**步骤：**
1. 使用账户 A 登录
2. 使用账户 B 登录（另一个浏览器）
3. A 发送消息给 B
4. 观察 B 的小铃铛

**预期结果：**
- ✅ 小铃铛显示红点
- ✅ 红点显示数字 "1"
- ✅ 消息在 30 秒内出现

**测试结果：**
- integration-production: [ ] 通过 [ ] 失败
- integration_online2025: [ ] 通过 [ ] 失败
- integration_backup_local_1.2.9: [ ] 通过 [ ] 失败

**备注：**
```
[请填写测试备注]
```

---

### 场景 2：打开消息后红点消失

**步骤：**
1. 继续场景 1 的状态
2. B 点击小铃铛
3. B 打开消息页面
4. B 点击消息线程查看消息
5. B 返回首页

**预期结果：**
- ✅ 打开消息页面后红点立即消失
- ✅ 未读计数变为 0
- ✅ 返回首页后仍无红点
- ✅ 刷新页面后仍无红点

**测试结果：**
- integration-production: [ ] 通过 [ ] 失败
- integration_online2025: [ ] 通过 [ ] 失败
- integration_backup_local_1.2.9: [ ] 通过 [ ] 失败

**备注：**
```
[请填写测试备注]
```

---

### 场景 3：多条消息计数

**步骤：**
1. A 连续发送 5 条消息给 B
2. 观察 B 的小铃铛

**预期结果：**
- ✅ 小铃铛显示 "5"
- ✅ 每条消息都被计数
- ✅ 打开消息后全部标记为已读
- ✅ 红点消失

**测试结果：**
- integration-production: [ ] 通过 [ ] 失败
- integration_online2025: [ ] 通过 [ ] 失败
- integration_backup_local_1.2.9: [ ] 通过 [ ] 失败

**备注：**
```
[请填写测试备注]
```

---

### 场景 4：实时更新（Socket.IO）

**步骤：**
1. B 打开消息页面
2. A 发送新消息
3. 观察 B 的消息列表

**预期结果：**
- ✅ 消息立即出现（< 1 秒）
- ✅ 不需要刷新页面
- ✅ 消息自动标记为已读
- ✅ 小铃铛保持 0

**测试结果：**
- integration-production: [ ] 通过 [ ] 失败
- integration_online2025: [ ] 通过 [ ] 失败
- integration_backup_local_1.2.9: [ ] 通过 [ ] 失败

**备注：**
```
[请填写测试备注]
```

---

### 场景 5：轮询更新（30秒）

**步骤：**
1. B 打开首页（不打开消息页面）
2. A 发送消息
3. 等待 30 秒
4. 观察小铃铛

**预期结果：**
- ✅ 30 秒后小铃铛显示红点
- ✅ 显示正确的未读计数
- ✅ 不需要手动刷新

**测试结果：**
- integration-production: [ ] 通过 [ ] 失败
- integration_online2025: [ ] 通过 [ ] 失败
- integration_backup_local_1.2.9: [ ] 通过 [ ] 失败

**备注：**
```
[请填写测试备注]
```

---

### 场景 6：打开消息线程时的 bug 测试（关键）

**步骤：**
1. B 打开消息页面
2. A 发送消息
3. B 正在查看消息线程
4. A 再发送一条消息
5. 观察未读计数

**预期结果（正确）：**
- ✅ 未读计数保持 0（不是 1）
- ✅ 小铃铛无红点
- ✅ 消息自动标记为已读

**测试结果：**
- integration-production: [ ] 通过 [ ] 失败
- integration_online2025: [ ] 通过 [ ] 失败
- integration_backup_local_1.2.9: [ ] 通过 [ ] 失败

**备注：**
```
[请填写测试备注]
```

---

## 📊 总体评分

| 版本 | 场景1 | 场景2 | 场景3 | 场景4 | 场景5 | 场景6 | 总分 |
|------|-------|-------|-------|-------|-------|-------|------|
| integration-production | [ ]/10 | [ ]/10 | [ ]/10 | [ ]/10 | [ ]/10 | [ ]/10 | [ ]/60 |
| integration_online2025 | [ ]/10 | [ ]/10 | [ ]/10 | [ ]/10 | [ ]/10 | [ ]/10 | [ ]/60 |
| integration_backup_local_1.2.9 | [ ]/10 | [ ]/10 | [ ]/10 | [ ]/10 | [ ]/10 | [ ]/10 | [ ]/60 |

---

## ✅ 最终验收

```
微信水平的消息计数功能：

UI 表现：
□ 小铃铛显示（右上角）
□ 红点显示（未读消息时）
□ 红点显示数字（未读消息数量，99+ 显示）
□ 点击小铃铛打开消息页面

功能准确性：
□ 打开消息后红点消失
□ 消息自动标记为已读
□ 多条消息计数正确
□ 刷新页面后状态保持

实时性：
□ 消息实时更新（Socket.IO < 1秒）
□ 消息轮询更新（30秒）
□ 页面隐藏时不轮询（优化）

高级功能：
□ 系统消息显示
□ 用户阻止功能
□ 消息反应功能
□ 多标签页同步

性能：
□ 页面加载快速
□ 消息更新流畅
□ 无内存泄漏
□ 无不必要的 API 调用
```

---

## 📝 总结

**测试结论：**
```
[请填写测试结论]
```

**发现的问题：**
```
[请列出发现的问题]
```

**建议：**
```
[请提出改进建议]
```

**签名：**
- 测试人员：________________
- 日期：________________
- 审核人员：________________
- 日期：________________

EOF

echo -e "${GREEN}✅ 报告已生成：$REPORT_FILE${NC}"
echo ""
echo "📖 请填写以下信息："
echo "   - 测试人员"
echo "   - 测试环境"
echo "   - 各场景的测试结果"
echo "   - 总体评分"
echo "   - 测试结论"
```

---

## 快速开始

### 1. 复制脚本到项目根目录

```bash
# 将所有脚本放在 /Users/zhuricardo/Desktop/CampusRide/CampusRide/ 目录下
```

### 2. 运行修复脚本

```bash
# 修复 integration_online2025
chmod +x fix_online2025.sh
./fix_online2025.sh

# 修复 integration_backup_local_1.2.9
chmod +x fix_backup_local.sh
./fix_backup_local.sh
```

### 3. 手动修改文件

按照脚本输出的指示，手动修改相应的文件

### 4. 运行测试

```bash
chmod +x test_all_versions.sh
./test_all_versions.sh
```

### 5. 生成报告

```bash
chmod +x generate_test_report.sh
./generate_test_report.sh
```

---

## 脚本说明

| 脚本 | 功能 | 运行时间 |
|------|------|---------|
| `fix_online2025.sh` | 自动复制文件到 integration_online2025 | < 1 分钟 |
| `fix_backup_local.sh` | 自动复制文件到 integration_backup_local_1.2.9 | < 1 分钟 |
| `test_all_versions.sh` | 检查所有版本的文件和代码质量 | 2-3 分钟 |
| `generate_test_report.sh` | 生成测试报告模板 | < 1 分钟 |

---

## 注意事项

1. **脚本需要 bash 环境** - 在 Windows 上使用 Git Bash 或 WSL
2. **需要手动修改文件** - 脚本只复制文件，代码修改需要手动完成
3. **备份重要文件** - 修改前建议备份原文件
4. **按顺序执行** - 先运行修复脚本，再手动修改，最后运行测试脚本

---

**所有脚本已准备就绪，可以开始修复了！** 🚀
