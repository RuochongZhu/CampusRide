# 🗺️ 启用 Google Maps 地址自动完成

## 📋 当前状态
✅ 代码已完全配置  
✅ API Key 已设置  
⏳ 需要启用 Places API

## 🚀 3分钟快速启用

### 步骤 1：访问 Google Cloud Console
打开：https://console.cloud.google.com/

### 步骤 2：启用 Places API
1. 左侧菜单 → **APIs & Services** → **Library**
2. 搜索框输入：**Places API**
3. 选择 **Places API** (标记为 Legacy)
4. 点击 **ENABLE** 按钮
5. 等待 2-5 分钟

### 步骤 3：刷新网页
刷新 `http://localhost:3000` 即可使用！

## ✨ 效果预览

启用后，在地址输入框中：
- 输入 `cayu` → 显示 **Cayuga Lake**, **Cayuga Heights**...
- 输入 `corn` → 显示 **Cornell University**...
- 输入 `itaca` → 显示 **Ithaca, NY**...

下拉列表会自动显示 Google Maps 地址建议！

## 🎯 功能特点

- ✅ 实时地址搜索建议
- ✅ 智能匹配（地名、街道、建筑物）
- ✅ 键盘导航（↑↓键选择）
- ✅ 美化的红色主题样式
- ✅ 限制美国地址（可修改）

## 🔧 已配置的输入框

1. **Passenger - Origin** (乘客-出发地)
2. **Passenger - Destination** (乘客-目的地)
3. **Driver - Origin** (司机-出发地)
4. **Driver - Destination** (司机-目的地)

## 📝 检查是否成功

打开浏览器控制台（F12），应该看到：
```
✅ Google Maps loaded successfully
✅ Autocomplete initialized for 4 input fields
```

如果看到错误：
```
❌ Google Maps API error: ...
```
说明 Places API 还未启用或正在生效中，请等待几分钟。

## 💰 费用说明

- 每月 $200 美元免费额度
- Places Autocomplete: $2.83 / 1000 次请求
- 对于开发测试，免费额度完全足够

## 🔗 相关链接

- [Google Cloud Console](https://console.cloud.google.com/)
- [Places API 文档](https://developers.google.com/maps/documentation/javascript/places)
- [API 定价](https://developers.google.com/maps/billing-and-pricing/pricing)

---

**当前 API Key**: `AIzaSyAi0TLayPvI8vfhD33bNtaVyoGHTjZ91F4`  
**配置文件**: `.env` (已配置)  
**代码文件**: `src/views/RideshareView.vue` (已完成)


