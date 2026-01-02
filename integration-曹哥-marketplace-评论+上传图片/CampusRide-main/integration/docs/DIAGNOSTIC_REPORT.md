# CampusRide Project Diagnostic Report

## Executive Summary
CampusRide is a full-stack university campus community platform featuring ridesharing, marketplace, activities, and gamification systems. The project is organized as a monorepo with separate frontend and backend services running on different ports.

---

## 1. PROJECT ARCHITECTURE

### Application Type
- **Type**: Full-Stack Application (Monorepo)
- **Structure**: Frontend (Vue 3) + Backend (Node.js/Express)
- **Organization**: Both services contained in `/Users/zhuricardo/Desktop/CampusRide/CampusRide/integration/`

### Directory Structure
```
integration/
├── src/                          # Frontend Vue 3 application
│   ├── main.js                   # Entry point
│   ├── App.vue                   # Root component
│   ├── router/                   # Vue Router configuration
│   ├── stores/                   # Pinia state management
│   ├── views/                    # Page components
│   ├── components/               # Reusable Vue components
│   └── utils/
│       └── api.js                # Axios API client
│
├── campusride-backend/           # Node.js/Express backend
│   ├── src/
│   │   ├── server.js             # Server entry point
│   │   ├── app.js                # Express app configuration
│   │   ├── routes/               # API route definitions
│   │   ├── controllers/          # Route handlers
│   │   ├── services/             # Business logic
│   │   ├── middleware/           # Custom middleware
│   │   ├── config/               # Configuration files
│   │   │   ├── database.js       # Supabase client setup
│   │   │   ├── socket.js         # Socket.io configuration
│   │   │   └── swagger.js        # API documentation
│   │   └── utils/
│   │       └── database-init.js  # Database initialization
│   ├── package.json
│   └── .env
│
├── package.json                  # Frontend dependencies
├── vite.config.js                # Frontend build configuration
├── index.html                    # Frontend HTML entry
├── .env                          # Frontend environment variables
└── vercel.json                   # Vercel deployment config
```

---

## 2. PORT CONFIGURATION & SERVICES

### Frontend (Vue 3 + Vite)
- **Port**: 3000
- **Dev Server**: Vite
- **Configuration File**: `/Users/zhuricardo/Desktop/CampusRide/CampusRide/integration/vite.config.js`
- **Entry Point**: `/Users/zhuricardo/Desktop/CampusRide/CampusRide/integration/index.html`
- **Start Script**: `npm run dev`

**Vite Configuration:**
```javascript
server: {
  port: 3000,
  host: true    // CRITICAL: This should expose to 0.0.0.0, not just localhost
}
```

### Backend (Node.js + Express)
- **Port**: 3001
- **Runtime**: Node.js (ES modules)
- **Framework**: Express 5.x
- **Configuration File**: `/Users/zhuricardo/Desktop/CampusRide/CampusRide/integration/campusride-backend/src/app.js`
- **Entry Point**: `/Users/zhuricardo/Desktop/CampusRide/CampusRide/integration/campusride-backend/src/server.js`
- **Start Script**: `npm run dev` (with nodemon for auto-reload)

**Express Configuration:**
```javascript
// CORS configured for multiple frontend URLs
cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3001',  // WARNING: Wrong URL fallback
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:3002'
  ],
  credentials: true
})
```

**POTENTIAL ISSUE FOUND**: The CORS default fallback is incorrect. If `FRONTEND_URL` is not set, it defaults to `http://localhost:3001` instead of `http://localhost:3000`.

### Current Running Services
- **Frontend**: Running on port 3000 (PID: 24059)
- **Backend**: Not currently running

---

## 3. ENVIRONMENT CONFIGURATION

### Frontend `.env` (Current)
```env
VITE_API_BASE_URL=http://localhost:3001
VITE_GOOGLE_MAPS_API_KEY=AIzaSyAi0TLayPvI8vfhD33bNtaVyoGHTjZ91F4
```

### Backend `.env` (Current)
```env
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000

# Supabase Configuration
SUPABASE_URL=https://jfgenxnqpuutgdnnngsl.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Email Service (Resend)
RESEND_API_KEY=re_QXsB8Ehe_N2ZK6R1KLzLtFWP5PtixdwQ8
RESEND_FROM_EMAIL=noreply@socialinteraction.club
RESEND_FROM_NAME=Campus Ride

# Database (local PostgreSQL - optional)
DATABASE_URL=postgresql://user:password@localhost:5432/campusride

# Redis (optional for caching)
REDIS_URL=redis://localhost:6379

# API Configuration
API_VERSION=v1
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

---

## 4. MAIN ENTRY POINTS & STARTUP SCRIPTS

### Frontend Startup
**File**: `/Users/zhuricardo/Desktop/CampusRide/CampusRide/integration/package.json`

```json
{
  "scripts": {
    "dev": "vite",           // Starts Vite dev server on port 3000
    "build": "vite build",   // Production build
    "preview": "vite preview" // Preview production build
  }
}
```

**Process**: 
1. `npm run dev` → Executes `vite` command
2. Vite dev server starts on port 3000
3. Hot Module Replacement (HMR) enabled for development

### Backend Startup
**File**: `/Users/zhuricardo/Desktop/CampusRide/CampusRide/integration/campusride-backend/package.json`

```json
{
  "scripts": {
    "start": "node src/server.js",    // Production
    "dev": "nodemon src/server.js",   // Development with auto-reload
    "dev:init": "INIT_DATABASE=true CREATE_SAMPLE_DATA=true nodemon src/server.js",
    "test": "jest",
    "db:init": "node -e \"import('./src/utils/database-init.js')...\""
  }
}
```

**Startup Flow** (`src/server.js`):
1. Load environment variables via `dotenv`
2. Validate required env vars (SUPABASE_URL, SUPABASE_SERVICE_KEY, JWT_SECRET)
3. Validate database connection
4. Optionally initialize database schema (if `INIT_DATABASE=true`)
5. Create sample data (if `CREATE_SAMPLE_DATA=true`)
6. Start Express server on port 3001
7. Initialize Socket.io for real-time features
8. Setup graceful shutdown handlers

### Combined Startup Scripts
**File**: `/Users/zhuricardo/Desktop/CampusRide/CampusRide/start-services.sh`

```bash
# Orchestrates starting both services:
# 1. Clears any existing processes
# 2. Starts Backend on port 3001
# 3. Waits and checks health
# 4. Starts Frontend on port 5173 (or 3000?)
# 5. Monitors with tail
```

**File**: `/Users/zhuricardo/Desktop/CampusRide/CampusRide/server-manager.sh`

```bash
# Advanced server management:
# Commands: start, stop, restart, status, logs, backend, frontend, clear
# Manages PIDs, port cleanup, cache clearing
# Supports independent backend/frontend control
```

---

## 5. DATABASES & EXTERNAL SERVICES

### Primary Database: Supabase (PostgreSQL)
- **Type**: PostgreSQL managed by Supabase
- **URL**: `https://jfgenxnqpuutgdnnngsl.supabase.co`
- **Auth**: Service role key (admin access)
- **Client Setup**: `/Users/zhuricardo/Desktop/CampusRide/CampusRide/integration/campusride-backend/src/config/database.js`

**Database Tables**:
```
- users                    # User accounts & authentication
- rides / carpooling      # Rideshare/carpooling listings
- ride_bookings           # Booking records
- marketplace_items       # Second-hand marketplace items
- item_favorites          # User favorites
- groups                  # Activity groups
- group_members           # Group membership
- thoughts                # User thoughts/posts
- user_visibility         # Location sharing settings
- activities              # Campus activities
- activity_participants   # Activity registrations
- point_transactions      # Points/gamification tracking
- point_rules             # Points award rules
- notifications          # User notifications
```

### Real-Time Communication: Socket.io
- **Configuration**: `/Users/zhuricardo/Desktop/CampusRide/CampusRide/integration/campusride-backend/src/config/socket.js`
- **CORS Origins**: Matches Express CORS config
- **Authentication**: JWT token validation
- **Events**: Activity updates, real-time notifications, rideshare status

### Email Service: Resend
- **API Key**: Configured in `.env` as `RESEND_API_KEY`
- **From Email**: `noreply@socialinteraction.club`
- **Use Cases**: Email verification, password reset, notifications

### Maps Service: Google Maps API
- **API Key**: `AIzaSyAi0TLayPvI8vfhD33bNtaVyoGHTjZ91F4`
- **Usage**: Frontend maps display, route calculation
- **Scope**: Maps JavaScript API, Places API

### Optional Services (Not Actively Used)
- **Redis**: Configured as `redis://localhost:6379` but optional for caching
- **Local PostgreSQL**: Alternative to Supabase, not currently used

---

## 6. LOCALHOST ACCESS CONFIGURATION

### Frontend Localhost Configuration
**File**: `/Users/zhuricardo/Desktop/CampusRide/CampusRide/integration/vite.config.js`

```javascript
server: {
  port: 3000,
  host: true    // Allows external connections, not just localhost
}
```

**API Client Configuration** (`src/utils/api.js`):
```javascript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
const api = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  timeout: 10000
});
```

### Backend Localhost Configuration
**File**: `/Users/zhuricardo/Desktop/CampusRide/CampusRide/integration/campusride-backend/src/app.js`

```javascript
// CORS Configuration
cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3001',  // BUG: Wrong fallback
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:3002'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500
});
app.use('/api/', limiter);
```

**Server Binding** (`src/server.js`):
```javascript
const PORT = process.env.PORT || 3000;  // BUG: Should default to 3001
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

---

## 7. IDENTIFIED ISSUES & PROBLEMS

### CRITICAL ISSUES

#### 1. **Socket.io CORS Misconfiguration**
- **Location**: `src/config/socket.js` line 16
- **Issue**: CORS origin hardcoded to `process.env.FRONTEND_URL || 'http://localhost:5173'`
- **Impact**: If FRONTEND_URL not set, Socket.io rejects connections from localhost:3000
- **Fix**: Ensure FRONTEND_URL is set in `.env`

#### 2. **Backend CORS Default Fallback Bug**
- **Location**: `src/app.js` line 48
- **Issue**: Default fallback is `'http://localhost:3001'` instead of `'http://localhost:3000'`
- **Impact**: If FRONTEND_URL env var not set, CORS rejects requests from the frontend
- **Current Status**: FRONTEND_URL is set to `http://localhost:3000` in `.env`, so may be OK
- **Risk**: Configuration brittle - dependent on exact env var setting

#### 3. **Backend PORT Default Bug**
- **Location**: `src/server.js` line 10
- **Issue**: PORT defaults to 3000 instead of 3001
- **Current Status**: PORT=3001 explicitly set in `.env`
- **Risk**: If PORT env var deleted, backend would run on 3000 (port conflict!)

#### 4. **Vite Host Configuration**
- **Location**: `vite.config.js` line 14
- **Issue**: `host: true` should be `host: '0.0.0.0'` or `host: 'localhost'` explicitly
- **Current Impact**: May cause IPv4/IPv6 binding issues on some systems
- **Symptom**: Could be why external localhost access fails

### HIGH PRIORITY ISSUES

#### 5. **Missing Frontend Port in start-services.sh**
- **Location**: `/Users/zhuricardo/Desktop/CampusRide/CampusRide/start-services.sh` line 31
- **Issue**: Script says "Starting Frontend (Port 5173)" but Vite configured for port 3000
- **Impact**: Confusion and documentation mismatch

#### 6. **API Client Timeout Too Short**
- **Location**: `src/utils/api.js` line 12
- **Issue**: 10 second timeout may be too short for network latency
- **Recommendation**: Increase to 20-30 seconds

#### 7. **Hardcoded API Key in Frontend Code**
- **Location**: `index.html` line 9
- **Issue**: Google Maps API key embedded in HTML (should be in `.env`)
- **Security Risk**: Key visible in production builds

### MEDIUM PRIORITY ISSUES

#### 8. **Socket.io Not Properly Initialized on Failed Auth**
- **Location**: `src/app.js` lines 128-137
- **Issue**: If Socket.io fails to initialize, error is just logged; server continues
- **Impact**: Real-time features silently fail

#### 9. **Database Validation Runs on Startup**
- **Location**: `src/server.js` lines 30-31
- **Issue**: Database validation blocks server startup; if DB unreachable, server won't start
- **Recommendation**: Validate asynchronously, warn but don't block

#### 10. **No Health Check for Backend CORS**
- **Status Endpoint**: `/api/v1/health` exists but doesn't check CORS
- **Recommendation**: Add CORS validation to health check

---

## 8. WORKING FEATURES

✅ Frontend running on port 3000 (currently active)
✅ Backend configuration complete with all environment variables
✅ Supabase integration configured
✅ Email service (Resend) configured
✅ Google Maps API key configured
✅ JWT authentication configured
✅ Socket.io configured for real-time updates
✅ Database tables validated
✅ CORS headers configured (with caveats)
✅ Rate limiting configured
✅ Graceful shutdown handlers implemented
✅ API documentation (Swagger) configured

---

## 9. LOCALHOST ACCESSIBILITY DIAGNOSIS

### Current State
- **Frontend**: ✅ Running on port 3000
- **Backend**: ❌ Not running
- **Direct Localhost Access**: Frontend appears accessible via `http://localhost:3000`
- **API Communication**: Will fail because backend not running

### Why Localhost Might Not Be Accessible

1. **Port Already in Use**
   - Check: `lsof -i :3000` and `lsof -i :3001`
   - Current: Frontend already on 3000

2. **Vite Host Binding Issue**
   - `host: true` in vite.config.js might not expose to all interfaces
   - Try: `host: '0.0.0.0'` for explicit binding

3. **Firewall/Network Issues**
   - macOS firewall may block Node processes
   - Check: System Preferences > Security & Privacy > Firewall

4. **Missing Backend Service**
   - Frontend running but backend not running
   - API calls will timeout/fail with ECONNREFUSED

5. **CORS Blocking Requests**
   - Even if backend runs, misconfigured CORS will block frontend
   - Check browser console for "Access-Control-Allow-Origin" errors

### Testing Localhost Connectivity

```bash
# Test frontend
curl -i http://localhost:3000

# Test backend (when running)
curl -i http://localhost:3001/api/v1/health

# Check port binding
lsof -i -P -n | grep LISTEN

# Check DNS resolution
nslookup localhost
host localhost
```

---

## 10. RECOMMENDATIONS FOR FIXING LOCALHOST ACCESS

### Immediate Actions (Priority 1)
1. **Fix vite.config.js**
   ```javascript
   server: {
     port: 3000,
     host: '0.0.0.0'  // Explicit binding to all interfaces
   }
   ```

2. **Fix backend CORS default**
   ```javascript
   origin: process.env.FRONTEND_URL ? 
     [process.env.FRONTEND_URL, 'http://localhost:5173', 'http://localhost:3000', 'http://localhost:3002'] :
     ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:3002']  // Don't default to 3001!
   ```

3. **Fix backend PORT default**
   ```javascript
   const PORT = process.env.PORT || 3001;  // Explicit default to 3001
   ```

### Testing Protocol
1. Kill all node processes: `pkill -f node`
2. Verify ports free: `lsof -i :3000 && lsof -i :3001`
3. Start backend: `cd integration/campusride-backend && npm run dev`
4. Verify backend health: `curl http://localhost:3001/api/v1/health`
5. Start frontend: `cd integration && npm run dev`
6. Test in browser: `http://localhost:3000`
7. Check console for CORS errors

### Network Diagnostics
```bash
# Full diagnostic
./server-manager.sh status
curl -v http://localhost:3000
curl -v http://localhost:3001/api/v1/health
curl -H "Origin: http://localhost:3000" http://localhost:3001/api/v1/health
```

---

## 11. KEY FILES SUMMARY

| File | Purpose | Status |
|------|---------|--------|
| `/integration/package.json` | Frontend dependencies | ✅ |
| `/integration/vite.config.js` | Frontend build config | ⚠️ Needs host fix |
| `/integration/.env` | Frontend env vars | ✅ |
| `/integration/index.html` | Frontend HTML entry | ✅ |
| `/integration/src/main.js` | Frontend JS entry | ✅ |
| `/integration/src/utils/api.js` | API client | ✅ |
| `/integration/campusride-backend/package.json` | Backend dependencies | ✅ |
| `/integration/campusride-backend/.env` | Backend env vars | ✅ |
| `/integration/campusride-backend/src/server.js` | Backend entry | ⚠️ PORT default |
| `/integration/campusride-backend/src/app.js` | Express config | ⚠️ CORS default |
| `/integration/campusride-backend/src/config/database.js` | DB connection | ✅ |
| `/integration/campusride-backend/src/config/socket.js` | Socket.io config | ⚠️ CORS hardcoded |
| `/start-services.sh` | Combined startup | ⚠️ Documentation mismatch |
| `/server-manager.sh` | Server control CLI | ✅ |

---

## CONCLUSION

CampusRide is a well-structured full-stack application with proper separation of concerns. The main barriers to localhost access are:

1. **Backend not running** (no process on port 3001)
2. **Configuration fragility** (default values that don't match intended ports)
3. **Host binding clarity** (Vite `host: true` needs explicit value)
4. **CORS misconfiguration** (wrong fallback URL)

Once these issues are fixed, the application should be fully accessible at:
- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- API Docs: http://localhost:3001/api-docs
