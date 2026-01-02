# CampusRide Localhost Access Fix Guide

## Quick Diagnosis

**Current Status:**
- Frontend: Running on port 3000 ✅
- Backend: Not running ❌
- API Connectivity: Broken ❌

---

## The Problems

### Problem 1: Backend Not Running
**Impact**: All API calls fail, features that depend on backend won't work

**Solution**:
```bash
cd /Users/zhuricardo/Desktop/CampusRide/CampusRide/integration/campusride-backend
npm run dev
```

### Problem 2: Vite Host Binding Too Loose
**File**: `/Users/zhuricardo/Desktop/CampusRide/CampusRide/integration/vite.config.js`
**Issue**: `host: true` should be explicit `host: '0.0.0.0'`

**Current Code** (Line 14):
```javascript
server: {
  port: 3000,
  host: true    // ❌ Too vague
}
```

**Fixed Code**:
```javascript
server: {
  port: 3000,
  host: '0.0.0.0'  // ✅ Explicit binding to all interfaces
}
```

### Problem 3: Backend CORS Default Wrong
**File**: `/Users/zhuricardo/Desktop/CampusRide/CampusRide/integration/campusride-backend/src/app.js`
**Issue**: If FRONTEND_URL env var missing, defaults to wrong port

**Current Code** (Lines 46-56):
```javascript
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3001',  // ❌ Wrong default!
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:3002'
  ],
  ...
}));
```

**Fixed Code**:
```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL ? 
    [process.env.FRONTEND_URL, 'http://localhost:5173', 'http://localhost:3000', 'http://localhost:3002'] :
    ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:3002'],  // ✅ Correct default
  ...
}));
```

### Problem 4: Backend PORT Default Wrong
**File**: `/Users/zhuricardo/Desktop/CampusRide/CampusRide/integration/campusride-backend/src/server.js`
**Issue**: PORT defaults to 3000 instead of 3001 (port conflict!)

**Current Code** (Line 10):
```javascript
const PORT = process.env.PORT || 3000;  // ❌ Wrong default!
```

**Fixed Code**:
```javascript
const PORT = process.env.PORT || 3001;  // ✅ Correct default
```

---

## Step-by-Step Fix

### Step 1: Kill All Running Node Processes
```bash
pkill -f node
sleep 2
```

### Step 2: Fix the Configuration Files

#### Fix #1: Update vite.config.js
```bash
cat > /Users/zhuricardo/Desktop/CampusRide/CampusRide/integration/vite.config.js << 'EOFVITE'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  server: {
    port: 3000,
    host: '0.0.0.0'  // FIXED: Explicit binding
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      input: resolve(__dirname, 'index.html')
    }
  }
})
EOFVITE
```

#### Fix #2: Update backend src/app.js (lines 46-56)
Replace the CORS configuration with:
```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL ? 
    [process.env.FRONTEND_URL, 'http://localhost:5173', 'http://localhost:3000', 'http://localhost:3002'] :
    ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:3002'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
```

#### Fix #3: Update backend src/server.js (line 10)
Change:
```javascript
const PORT = process.env.PORT || 3001;  // FIXED: Correct default port
```

### Step 3: Verify Environment Variables
```bash
# Check frontend .env
cat /Users/zhuricardo/Desktop/CampusRide/CampusRide/integration/.env
# Should contain: VITE_API_BASE_URL=http://localhost:3001

# Check backend .env
cat /Users/zhuricardo/Desktop/CampusRide/CampusRide/integration/campusride-backend/.env
# Should contain: PORT=3001 and FRONTEND_URL=http://localhost:3000
```

### Step 4: Start Backend
```bash
cd /Users/zhuricardo/Desktop/CampusRide/CampusRide/integration/campusride-backend
npm run dev
```

**Expected Output:**
```
🚀 Starting CampusRide Backend Server...
📝 Environment: development
🔍 Validating database connection...
✅ Database reachable
🎉 CampusRide Backend Server is running!
📍 Server URL: http://localhost:3001
📖 API Documentation: http://localhost:3001/api-docs
```

### Step 5: Start Frontend (New Terminal)
```bash
cd /Users/zhuricardo/Desktop/CampusRide/CampusRide/integration
npm run dev
```

**Expected Output:**
```
  VITE v5.4.10  ready in 123 ms

  ➜  Local:   http://localhost:3000/
  ➜  press h to show help
```

### Step 6: Test Connectivity

#### Test Backend Health
```bash
curl -i http://localhost:3001/api/v1/health
```

**Expected Response:**
```
HTTP/1.1 200 OK
...
{
  "success": true,
  "message": "CampusRide API is running",
  "version": "1.0.0"
}
```

#### Test CORS
```bash
curl -i -H "Origin: http://localhost:3000" http://localhost:3001/api/v1/health
```

**Expected Response Headers:**
```
Access-Control-Allow-Origin: http://localhost:3000
```

#### Test Frontend
```bash
curl -i http://localhost:3000
```

**Should return HTML content (200 OK)**

---

## Verification Checklist

- [ ] Backend running on port 3001
- [ ] Frontend running on port 3000
- [ ] `curl http://localhost:3000` returns HTML
- [ ] `curl http://localhost:3001/api/v1/health` returns JSON
- [ ] Browser: `http://localhost:3000` loads without errors
- [ ] Browser console: No CORS errors
- [ ] Browser console: No API connection errors
- [ ] API docs accessible at `http://localhost:3001/api-docs`

---

## Using the Server Manager Script

Once fixed, you can use the convenient server management script:

```bash
# Start both services
/Users/zhuricardo/Desktop/CampusRide/CampusRide/server-manager.sh start

# Check status
/Users/zhuricardo/Desktop/CampusRide/CampusRide/server-manager.sh status

# Restart with cache clear
/Users/zhuricardo/Desktop/CampusRide/CampusRide/server-manager.sh restart

# View logs
/Users/zhuricardo/Desktop/CampusRide/CampusRide/server-manager.sh logs

# Stop all services
/Users/zhuricardo/Desktop/CampusRide/CampusRide/server-manager.sh stop
```

---

## Troubleshooting

### Issue: Port 3000 Already in Use
```bash
# Find what's using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or use the server manager
/Users/zhuricardo/Desktop/CampusRide/CampusRide/server-manager.sh stop
```

### Issue: Port 3001 Already in Use
```bash
# Find what's using port 3001
lsof -i :3001

# Kill the process
kill -9 <PID>
```

### Issue: "Cannot find module" Errors
```bash
# Clear node_modules and reinstall
cd /Users/zhuricardo/Desktop/CampusRide/CampusRide/integration/campusride-backend
rm -rf node_modules package-lock.json
npm install

cd ..
rm -rf node_modules package-lock.json
npm install
```

### Issue: CORS Still Blocking Requests
1. Verify FRONTEND_URL is set: `echo $FRONTEND_URL`
2. Check `.env` file has correct value: `cat .env`
3. Backend not restarted after env var change? Kill and restart: `pkill -f node && cd campusride-backend && npm run dev`
4. Check browser console for exact error message

### Issue: Database Connection Failed
1. Check Supabase credentials in `.env`
2. Verify Supabase project is not paused
3. Check internet connection
4. Database validation might be blocking startup - check console for specific error

---

## Summary of Changes

| File | Change | Reason |
|------|--------|--------|
| `vite.config.js` | `host: true` → `host: '0.0.0.0'` | Explicit binding for clarity |
| `src/app.js` | Fix CORS default from 3001 to 3000 | Correct default fallback |
| `src/server.js` | PORT default from 3000 to 3001 | Prevent port conflicts |

---

## After Fixing

Your application should be accessible at:
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:3001
- **API Documentation**: http://localhost:3001/api-docs
- **Health Check**: http://localhost:3001/api/v1/health

All features should work:
- User registration and login
- Ridesharing (carpooling)
- Marketplace (second-hand goods)
- Activities and groups
- Points and leaderboard
- Real-time updates via Socket.io
