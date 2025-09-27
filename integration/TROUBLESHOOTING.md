# CampusRide Integration 故障排除指南

## 🔧 常见问题诊断清单

### 1. 环境检查
```bash
# 检查 Node.js 版本 (需要 >= 18.0.0)
node --version

# 检查 npm 版本
npm --version

# 检查端口占用情况
lsof -i :3000
lsof -i :3001

# 清理僵尸进程
pkill -f node
```

### 2. 依赖安装问题

#### 问题: npm 权限错误
```bash
# 错误: EACCES permission denied
# 解决方案:
npm install --cache /tmp/npm-cache

# 或者使用 yarn
yarn install
```

#### 问题: 依赖版本冲突
```bash
# 清理并重新安装
rm -rf node_modules package-lock.json
npm install

# 强制清理缓存
npm cache clean --force
```

### 3. 数据库连接问题

#### 检查清单:
- [ ] Supabase URL 格式正确 (https://xxx.supabase.co)
- [ ] API 密钥没有多余空格
- [ ] 网络连接正常
- [ ] Supabase 项目处于活跃状态

#### 测试数据库连接:
```bash
cd campusride-backend
node -e "
import { supabaseAdmin } from './src/config/database.js';
supabaseAdmin.from('users').select('count').single().then(console.log).catch(console.error);
"
```

### 4. 邮件服务问题

#### 检查清单:
- [ ] Resend API Key 正确
- [ ] 发件邮箱域名已验证
- [ ] API 调用频率未超限

#### 测试邮件发送:
```bash
curl -X POST "https://api.resend.com/emails" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "test@yourdomain.com",
    "to": "recipient@example.com",
    "subject": "Test Email",
    "text": "Test message"
  }'
```

### 5. 前端连接问题

#### 问题: API 调用失败
```javascript
// 检查浏览器控制台网络标签
// 常见错误:
// - CORS 错误: 检查 FRONTEND_URL 配置
// - 404 错误: 检查 API 路径
// - 500 错误: 检查后端日志
```

#### 解决步骤:
1. 确认后端运行在 3001 端口
2. 确认前端 `.env` 文件配置正确
3. 硬刷新浏览器 (Ctrl+Shift+R)
4. 检查开发者工具 Console 错误

### 6. 数据库迁移问题

#### 自动迁移失败:
```bash
# 方法1: 使用直接迁移脚本
cd campusride-backend
node src/database/direct-migration.js

# 方法2: 手动执行 SQL
# 在 Supabase Dashboard SQL Editor 中执行 SUPABASE_MIGRATION.sql
```

#### 检查表是否存在:
```sql
-- 在 Supabase SQL Editor 中运行
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'point_rules', 'point_transactions', 'leaderboard_entries');
```

### 7. 认证问题

#### JWT Token 错误:
```bash
# 检查 JWT_SECRET 是否配置
# 检查 token 是否过期
# 清理 localStorage
localStorage.clear();
```

#### 邮箱验证问题:
```bash
# 从后端日志获取完整验证链接
# 手动复制完整 URL 到浏览器
# 或手动更新用户验证状态
```

### 8. 性能问题

#### 排行榜加载慢:
- 检查用户数量 (>1000 用户考虑分页)
- 添加数据库索引
- 考虑添加 Redis 缓存

#### 内存使用过高:
```bash
# 监控内存使用
ps aux | grep node

# 检查是否有内存泄漏
node --inspect src/server.js
```

### 9. 生产部署问题

#### 环境变量:
- [ ] 所有环境变量已配置
- [ ] JWT_SECRET 使用强密码
- [ ] 数据库 URL 指向生产环境
- [ ] 邮件服务配置正确

#### 网络配置:
- [ ] CORS 配置允许生产域名
- [ ] HTTPS 配置正确
- [ ] 防火墙规则允许必要端口

### 10. 日志调试

#### 启用详细日志:
```bash
# 后端调试模式
DEBUG=* npm start

# 前端开发模式
npm run dev
```

#### 查看关键日志:
```bash
# 后端日志关键词
grep -i error logs/
grep -i "failed" logs/
grep -i "unauthorized" logs/

# 数据库连接日志
grep -i "database" logs/
```

## 🚨 紧急修复命令

```bash
# 完全重置开发环境
pkill -f node
rm -rf node_modules
rm -rf campusride-backend/node_modules
npm install --cache /tmp/npm-clean
cd campusride-backend && npm install --cache /tmp/npm-clean-backend

# 重启所有服务
cd campusride-backend && npm start &
cd ../ && npm run dev &
```

## 📞 获取帮助

1. **检查文档**: README.md 和 QUICK_START.md
2. **查看日志**: 后端控制台和浏览器开发者工具
3. **GitHub Issues**: 提交详细错误信息
4. **社区支持**: 包含错误日志和环境信息

---

*如果问题仍未解决，请提供完整的错误日志和环境信息以获得更好的支持。*