# CampusRide Diagnostics & Documentation Index

This directory contains a comprehensive analysis of the CampusRide project structure, configuration, and identified issues.

## Documents Generated

### 1. **PROJECT_SUMMARY.md** - START HERE
Complete overview of the CampusRide application including:
- Project description and features
- Technology stack summary
- Project structure and file organization
- Port configuration
- Database schema
- API endpoints summary
- Startup instructions
- Known issues & fixes required
- Development workflow

**Best for**: Quick overview of what CampusRide is and how it's organized

---

### 2. **DIAGNOSTIC_REPORT.md** - DETAILED ANALYSIS
Comprehensive technical diagnosis covering:
1. **PROJECT ARCHITECTURE** - Application type, directory structure
2. **PORT CONFIGURATION & SERVICES** - Frontend/Backend port details, current running services
3. **ENVIRONMENT CONFIGURATION** - All .env variables
4. **MAIN ENTRY POINTS & STARTUP SCRIPTS** - How services start
5. **DATABASES & EXTERNAL SERVICES** - Supabase, Socket.io, Resend, Google Maps
6. **LOCALHOST ACCESS CONFIGURATION** - Frontend/Backend localhost setup
7. **IDENTIFIED ISSUES & PROBLEMS** - Detailed list of all bugs (11 issues found)
8. **WORKING FEATURES** - What's implemented and working
9. **LOCALHOST ACCESSIBILITY DIAGNOSIS** - Why localhost access fails
10. **RECOMMENDATIONS** - How to fix issues
11. **KEY FILES SUMMARY** - Table of important files and their status

**Best for**: Deep dive technical understanding, identifying root causes

---

### 3. **LOCALHOST_FIX_GUIDE.md** - ACTIONABLE SOLUTIONS
Step-by-step guide to fix localhost access issues:
- Quick diagnosis of current state
- 4 main problems identified with solutions
- Step-by-step fix instructions
- Verification checklist
- Server manager script usage
- Troubleshooting guide
- Summary of required changes

**Best for**: Following instructions to fix the application

---

### 4. **ARCHITECTURE_OVERVIEW.md** - SYSTEM DESIGN
Visual and technical overview of system architecture:
- ASCII system architecture diagram
- Data flow diagrams
- Service dependencies
- Port mapping & access points
- Environment variables organization
- Authentication & authorization flow
- API endpoint organization
- Error handling flow
- Deployment architecture

**Best for**: Understanding how components interact, designing features

---

## Quick Start - Where to Begin

### If you want to understand the project:
1. Read **PROJECT_SUMMARY.md** (10 min)
2. Skim **ARCHITECTURE_OVERVIEW.md** diagrams (5 min)
3. Review the startup instructions in PROJECT_SUMMARY.md

### If you need to fix localhost access:
1. Read **LOCALHOST_FIX_GUIDE.md** (5 min)
2. Follow the step-by-step instructions
3. Use the verification checklist

### If you're debugging an issue:
1. Check **DIAGNOSTIC_REPORT.md** section 7 (Identified Issues)
2. Find the specific issue affecting you
3. Look up the file and line number
4. Apply the fix from LOCALHOST_FIX_GUIDE.md if applicable

### If you're a new developer:
1. Read **PROJECT_SUMMARY.md** completely
2. Review **ARCHITECTURE_OVERVIEW.md** diagrams
3. Check **DIAGNOSTIC_REPORT.md** section 2 (Port Configuration)
4. Review the API endpoints in PROJECT_SUMMARY.md
5. Start with the manual startup instructions

---

## Key Findings Summary

### Application Type
- **Full-Stack Monorepo**: Frontend + Backend in single repository
- **Frontend**: Vue 3 SPA on port 3000 (running)
- **Backend**: Node.js/Express on port 3001 (not running)
- **Database**: Supabase (PostgreSQL) - cloud hosted

### Critical Issues Found
| Issue | Severity | File | Line | Impact |
|-------|----------|------|------|--------|
| PORT default wrong | HIGH | server.js | 10 | Could cause port conflict |
| CORS default wrong | HIGH | app.js | 48 | Frontend blocked from API |
| Vite host binding loose | MEDIUM | vite.config.js | 14 | Binding clarity issue |
| Socket.io CORS hardcoded | MEDIUM | socket.js | 16 | Real-time might fail |
| DB validation blocks startup | MEDIUM | server.js | 30-31 | Server won't start if DB down |

### Current Status
- Frontend: Running on port 3000
- Backend: Not running
- Database: Configured and reachable
- External Services: All configured (Supabase, Resend, Google Maps)

### To Get Working
1. Fix 3 configuration files (vite.config.js, app.js, server.js)
2. Start backend: `cd campusride-backend && npm run dev`
3. Test: `curl http://localhost:3001/api/v1/health`
4. Frontend should work: `http://localhost:3000`

---

## File Locations Reference

### Documentation Files
```
/Users/zhuricardo/Desktop/CampusRide/CampusRide/
├── README_DIAGNOSTICS.md         # This file
├── PROJECT_SUMMARY.md             # Project overview
├── DIAGNOSTIC_REPORT.md           # Detailed analysis
├── LOCALHOST_FIX_GUIDE.md         # Fix instructions
├── ARCHITECTURE_OVERVIEW.md       # System design
├── server-manager.sh              # Server control script
└── start-services.sh              # Startup script
```

### Application Files
```
/Users/zhuricardo/Desktop/CampusRide/CampusRide/integration/
├── src/                           # Frontend Vue 3 app
├── campusride-backend/            # Node.js/Express backend
├── package.json                   # Frontend dependencies
├── vite.config.js                 # Frontend config (NEEDS FIX)
├── .env                           # Frontend env vars
└── index.html                     # HTML entry point

campusride-backend/
├── src/
│   ├── server.js                  # Backend entry (NEEDS FIX)
│   ├── app.js                     # Express config (NEEDS FIX)
│   ├── routes/                    # API routes
│   ├── controllers/               # Request handlers
│   ├── services/                  # Business logic
│   ├── middleware/                # Custom middleware
│   └── config/
│       ├── database.js            # Supabase setup
│       └── socket.js              # Socket.io config
├── package.json                   # Backend dependencies
└── .env                           # Backend env vars
```

---

## Critical Files to Fix

### 1. vite.config.js
```javascript
// Line 14 - Change from:
host: true

// To:
host: '0.0.0.0'
```

### 2. campusride-backend/src/server.js
```javascript
// Line 10 - Change from:
const PORT = process.env.PORT || 3000;

// To:
const PORT = process.env.PORT || 3001;
```

### 3. campusride-backend/src/app.js
```javascript
// Line 48 - Change from:
origin: [
  process.env.FRONTEND_URL || 'http://localhost:3001',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:3002'
]

// To:
origin: process.env.FRONTEND_URL ? 
  [process.env.FRONTEND_URL, 'http://localhost:5173', 'http://localhost:3000', 'http://localhost:3002'] :
  ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:3002']
```

---

## Verification Commands

After making fixes, run these to verify:

```bash
# 1. Kill all node processes
pkill -f node

# 2. Check ports are free
lsof -i :3000  # Should be empty
lsof -i :3001  # Should be empty

# 3. Start backend
cd /Users/zhuricardo/Desktop/CampusRide/CampusRide/integration/campusride-backend
npm run dev
# Expected: "Server running on port 3001"

# 4. In new terminal, test backend health
curl http://localhost:3001/api/v1/health
# Expected: {"success": true, "message": "CampusRide API is running"}

# 5. In new terminal, start frontend
cd /Users/zhuricardo/Desktop/CampusRide/CampusRide/integration
npm run dev
# Expected: "VITE ... ready in XXms"

# 6. Open browser to http://localhost:3000
# Expected: CampusRide homepage loads
```

---

## Technology Overview

### Frontend Stack
- **Framework**: Vue 3
- **Build Tool**: Vite
- **State Management**: Pinia
- **Routing**: Vue Router
- **UI Framework**: Ant Design Vue
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **Maps**: Google Maps API

### Backend Stack
- **Runtime**: Node.js (ES Modules)
- **Framework**: Express 5.x
- **Database**: Supabase (PostgreSQL)
- **Real-time**: Socket.io
- **Authentication**: JWT (jsonwebtoken)
- **Security**: Helmet, CORS, Rate Limiting
- **Email**: Resend API
- **API Docs**: Swagger/OpenAPI
- **Dev Tools**: Nodemon, Jest

### External Services
- **Database**: Supabase (https://jfgenxnqpuutgdnnngsl.supabase.co)
- **Email**: Resend (for transactional emails)
- **Maps**: Google Cloud (Google Maps API)
- **Optional**: Redis (for caching - not currently used)

---

## API Endpoints Summary

```
Base URL: http://localhost:3001/api/v1

/auth         - Authentication (login, register, verify)
/users        - User management
/carpooling   - Rideshare/carpooling
/marketplace  - Second-hand marketplace
/activities   - Campus activities
/groups       - Activity groups
/leaderboard  - Rankings and points
/points       - Gamification system
/notifications - User alerts
/health       - Server status

Full documentation: http://localhost:3001/api-docs
```

---

## Database Schema Overview

Main tables:
- **users** - User accounts and profiles
- **carpooling** - Ride listings
- **marketplace_items** - Second-hand goods
- **activities** - Campus events
- **groups** - Activity groups
- **point_transactions** - Gamification
- **notifications** - User alerts
- **messages** - Private messaging
- Plus supporting tables for relationships and metadata

---

## Development Workflow

1. **Start Services**
   - Backend on 3001 (with auto-reload via nodemon)
   - Frontend on 3000 (with HMR via Vite)

2. **Make Changes**
   - Frontend: Edit `.vue` files in `src/views/` or `src/components/`
   - Backend: Edit files in `campusride-backend/src/`

3. **Test Changes**
   - Frontend: Changes auto-reload in browser
   - Backend: Nodemon auto-restarts server
   - API: Test with curl or Swagger UI

4. **Check Logs**
   - Frontend console: Browser DevTools
   - Backend console: Terminal output
   - Server logs: Use `server-manager.sh logs`

---

## Next Steps

1. **Read PROJECT_SUMMARY.md** - Understand the application
2. **Review DIAGNOSTIC_REPORT.md section 7** - See what needs fixing
3. **Follow LOCALHOST_FIX_GUIDE.md** - Apply the fixes
4. **Verify with commands above** - Test everything works
5. **Start developing!** - Make changes to the codebase

---

## Additional Resources

- Original README: `/integration/README.md`
- Quick start guide: `/integration/QUICK_START.md`
- Troubleshooting: `/integration/TROUBLESHOOTING.md`
- Server manager script: `/server-manager.sh`

---

## Document Maintenance

These diagnostic documents were generated on:
- **Date**: November 3, 2025
- **Time**: 5:42 PM
- **Git Status**: Main branch, recent commits analyzed

If any changes are made to configuration files or project structure, these documents should be updated to reflect the new state.

---

**Start with PROJECT_SUMMARY.md for a complete project overview!**
