# Google Maps API 设置指南

## 📍 当前状态
Google Maps 地址自动完成功能已经**集成完成**！代码已准备就绪，只需启用 API 即可使用。

## ⚠️ 重要提示
如果看到以下错误，说明 Places API 还未启用：
```
You're calling a legacy API, which is not enabled for your project. 
To get newer features and more functionality, switch to the Places API (New) or Routes API.
```

## ✅ 如何启用 Google Maps 自动完成功能

### 🚀 快速启用步骤（推荐）

1. **访问 Google Cloud Console**
   - 打开 [Google Cloud Console](https://console.cloud.google.com/)
   - 选择您的项目（或创建新项目）

2. **启用 Places API**
   - 左侧菜单：**APIs & Services** > **Library**
   - 搜索：**"Places API"**
   - 选择 **Places API** (标记为 Legacy 的版本)
   - 点击 **"ENABLE"（启用）**按钮

3. **配置 API Key（如果还没有）**
   - 左侧菜单：**APIs & Services** > **Credentials**
   - 点击 **"+ CREATE CREDENTIALS"** > **API Key**
   - 复制生成的 API Key

4. **更新环境变量（如已配置则跳过）**
   ```bash
   # 在项目根目录的 .env 文件中
   VITE_GOOGLE_MAPS_API_KEY=你的API密钥
   ```

5. **等待生效**
   - 等待 2-5 分钟让 API 启用生效
   - 刷新网页即可使用！

✅ **代码已经配置完成，启用 API 后无需任何代码修改！**

### 选项2：升级到新版Places API

新版API需要更多代码改动，但提供更好的性能和功能：

1. 在Google Cloud Console启用 **Places API (New)**
2. 更新前端代码使用新的API格式
3. 参考：https://developers.google.com/maps/documentation/javascript/places

### 选项3：使用其他地址自动完成服务

考虑使用第三方服务：
- **Mapbox Geocoding API** - 有免费额度
- **OpenStreetMap Nominatim** - 完全免费
- **Here Maps API** - 有免费额度

## 当前API密钥
```
VITE_GOOGLE_MAPS_API_KEY=AIzaSyAi0TLayPvI8vfhD33bNtaVyoGHTjZ91F4
```

## 🧪 测试自动完成功能

### 1. 检查浏览器控制台
启用 API 并刷新页面后，打开浏览器开发者工具（F12），在 Console 中应该看到：
```
✅ Google Maps loaded successfully
✅ Autocomplete initialized for 4 input fields
```

### 2. 测试地址输入
在任意 Origin 或 Destination 输入框中输入：

| 输入 | 预期下拉建议 |
|------|------------|
| `cayu` | Cayuga Lake, Cayuga Heights, Cayuga Place... |
| `corn` | Cornell University, Cornell Tech... |
| `new yo` | New York, NY, New York University... |
| `itaca` 或 `ithaca` | Ithaca, NY, Ithaca College... |

### 3. 功能特点
✅ 输入时自动显示地址建议下拉框  
✅ 使用键盘上下箭头选择  
✅ 点击或按 Enter 选择地址  
✅ 自动填充完整地址到输入框  
✅ 美化的红色主题下拉样式

## 注意事项

1. **费用**：Google Maps API有免费额度，但超出后会收费
   - 每月前 $200 美元免费
   - Places Autocomplete: $2.83 per 1000 requests
   
2. **API限制**：建议设置使用限制以避免意外费用

3. **备用方案**：即使不启用自动完成，用户仍然可以手动输入地址

## 相关链接

- [Google Maps JavaScript API](https://developers.google.com/maps/documentation/javascript)
- [Places API (Legacy)](https://developers.google.com/maps/documentation/javascript/places)
- [Places API (New)](https://developers.google.com/maps/documentation/places/web-service)
- [API定价](https://developers.google.com/maps/billing-and-pricing/pricing)



