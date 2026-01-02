#!/bin/bash

echo "🚀 启动前端服务..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

cd /Users/xinyuepan/Desktop/intergration-backup_副本

echo "当前目录: $(pwd)"
echo ""

# 清理旧进程
echo "清理旧进程..."
pkill -f "intergration-backup_副本.*vite" 2>/dev/null
sleep 2

echo ""
echo "启动 Vite 开发服务器..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

npm run dev







