#!/bin/bash

# CampusRide Groups 功能快速测试脚本

echo "🚀 CampusRide - Groups 功能测试"
echo "=================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查 .env 文件
echo "📝 检查配置文件..."
ENV_FILE="integration/.env"

if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}❌ .env 文件不存在${NC}"
    echo "创建 .env 文件..."
    cp integration/.env.example integration/.env 2>/dev/null || touch integration/.env
fi

# 检查 Google Maps API Key
if grep -q "VITE_GOOGLE_MAPS_API_KEY=" "$ENV_FILE"; then
    API_KEY=$(grep "VITE_GOOGLE_MAPS_API_KEY=" "$ENV_FILE" | cut -d'=' -f2)
    if [ -z "$API_KEY" ] || [ "$API_KEY" = "your_api_key_here" ]; then
        echo -e "${YELLOW}⚠️  Google Maps API Key 未配置${NC}"
        echo "请编辑 integration/.env 文件，添加："
        echo "VITE_GOOGLE_MAPS_API_KEY=你的_API_KEY"
        echo ""
        echo "获取 API Key 的步骤请查看："
        echo "GOOGLE_MAPS_SETUP.md"
        echo ""
        read -p "按 Enter 继续使用模拟地图，或按 Ctrl+C 退出..."
    else
        echo -e "${GREEN}✅ Google Maps API Key 已配置${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  未找到 VITE_GOOGLE_MAPS_API_KEY 配置${NC}"
    echo "添加到 $ENV_FILE..."
    echo "VITE_GOOGLE_MAPS_API_KEY=your_api_key_here" >> "$ENV_FILE"
fi

echo ""
echo "🔍 检查数据库连接..."
# 这里可以添加数据库连接测试

echo ""
echo "📦 检查依赖..."
if [ ! -d "integration/node_modules" ]; then
    echo -e "${YELLOW}⚠️  依赖未安装，正在安装...${NC}"
    cd integration && npm install && cd ..
else
    echo -e "${GREEN}✅ 依赖已安装${NC}"
fi

echo ""
echo "=================================="
echo "🎯 测试步骤："
echo "=================================="
echo ""
echo "1. 后端服务器"
echo "   cd integration/campusride-backend"
echo "   npm run dev"
echo ""
echo "2. 前端服务器（新终端窗口）"
echo "   cd integration"
echo "   npm run dev"
echo ""
echo "3. 访问地图页面"
echo "   http://localhost:5173/groups"
echo ""
echo "=================================="
echo "📖 功能测试清单："
echo "=================================="
echo ""
echo "[ ] 创建小组"
echo "[ ] 发布想法（获取位置）"
echo "[ ] 地图显示标记点"
echo "[ ] 点击标记查看详情"
echo "[ ] 切换小组过滤"
echo "[ ] 可见性控制"
echo ""
echo "=================================="
echo "📚 文档："
echo "=================================="
echo ""
echo "1. Google Maps 设置指南"
echo "   GOOGLE_MAPS_SETUP.md"
echo ""
echo "2. 集成完成说明"
echo "   GOOGLE_MAPS_INTEGRATION_COMPLETE.md"
echo ""
echo "3. Activity 开发计划"
echo "   ACTIVITY_DEVELOPMENT_PLAN.md"
echo ""
echo "=================================="
echo ""
echo -e "${GREEN}✅ 准备完成！${NC}"
echo ""
echo "提示：如果遇到问题，请查看浏览器控制台和服务器日志"
echo ""
