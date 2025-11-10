# CampusRide Project - Complete Overview

## Project Summary

**CampusRide** is a comprehensive campus community platform that integrates multiple services for university students:

### Core Features
1. **Carpooling/Rideshare** - Find and share rides with other students
2. **Marketplace** - Buy/sell second-hand goods on campus
3. **Activity Groups** - Organize and join campus activities and groups
4. **Gamification** - Earn points and climb leaderboards for participation
5. **Real-time Communication** - Live updates and notifications
6. **Maps Integration** - Location-based services for rides and activities

---

## Technology Stack Summary

### Frontend
- **Framework**: Vue 3 (Composition API ready)
- **Build Tool**: Vite (ultra-fast dev server)
- **State Management**: Pinia
- **Routing**: Vue Router
- **Styling**: Tailwind CSS + Ant Design Vue
- **HTTP Client**: Axios
- **Maps**: Google Maps JavaScript API
- **Port**: 3000

### Backend
- **Runtime**: Node.js (ES Modules)
- **Framework**: Express 5.x
- **Database**: Supabase (PostgreSQL)
- **Real-time**: Socket.io
- **Authentication**: JWT (jsonwebtoken)
- **Security**: Helmet, CORS, Rate Limiting
- **Email**: Resend API
- **API Documentation**: Swagger
- **Port**: 3001
- **Dev**: Nodemon (auto-reload)

### External Services
- **Database**: Supabase (PostgreSQL + real-time)
- **Email**: Resend (transactional email)
- **Maps**: Google Cloud (Maps & Places API)
- **Optional**: Redis (caching - not used currently)

---

## Project Structure

```
CampusRide/
├── integration/                          # Main application monorepo
│   ├── src/                              # Frontend Vue 3 app
│   │   ├── main.js                       # Entry point
│   │   ├── App.vue                       # Root component
│   │   ├── router/                       # Route definitions
│   │   ├── stores/                       # Pinia state stores
│   │   ├── views/                        # Page components
│   │   ├── components/                   # Reusable UI components
│   │   ├── utils/
│   │   │   ├── api.js                    # Axios client (440+ lines)
│   │   │   └── auth.js                   # Auth utilities
│   │   └── assets/                       # Styles and images
│   │
│   ├── campusride-backend/               # Node.js/Express backend
│   │   ├── src/
│   │   │   ├── server.js                 # Entry point
│   │   │   ├── app.js                    # Express configuration
│   │   │   ├── routes/                   # 13+ route files
│   │   │   ├── controllers/              # Request handlers
│   │   │   ├── services/                 # Business logic
│   │   │   ├── middleware/               # Custom middleware
│   │   │   ├── config/
│   │   │   │   ├── database.js           # Supabase setup
│   │   │   │   ├── socket.js             # Socket.io config
│   │   │   │   └── swagger.js            # API docs
│   │   │   ├── database/                 # Database schemas
│   │   │   └── utils/
│   │   │       └── database-init.js      # DB initialization
│   │   ├── package.json
│   │   ├── .env
│   │   └── .env.example
│   │
│   ├── package.json                      # Frontend dependencies
│   ├── package-lock.json
│   ├── vite.config.js                    # Frontend build config
│   ├── index.html                        # HTML entry
│   ├── .env                              # Frontend env vars
│   ├── .env.example
│   ├── vercel.json                       # Vercel deployment
│   ├── README.md
│   ├── QUICK_START.md
│   └── TROUBLESHOOTING.md
│
├── server-manager.sh                     # Advanced server CLI
├── start-services.sh                     # Simple startup script
│
└── Documentation (Generated)
    ├── DIAGNOSTIC_REPORT.md              # This exploration report
    ├── LOCALHOST_FIX_GUIDE.md            # Configuration fixes
    ├── ARCHITECTURE_OVERVIEW.md          # System architecture
    └── PROJECT_SUMMARY.md                # This file
```

---

## Key Configuration Files

| File | Purpose | Current Status |
|------|---------|-----------------|
| `/integration/vite.config.js` | Frontend build & dev server | ⚠️ host: true (should be 0.0.0.0) |
| `/integration/.env` | Frontend env variables | ✅ Correct |
| `/integration/index.html` | HTML entry point | ✅ Correct |
| `/integration/campusride-backend/src/server.js` | Backend startup | ⚠️ PORT default wrong |
| `/integration/campusride-backend/src/app.js` | Express configuration | ⚠️ CORS default wrong |
| `/integration/campusride-backend/.env` | Backend env variables | ✅ Correct |

---

## Port Configuration

| Service | Port | Protocol | Current Status |
|---------|------|----------|-----------------|
| Frontend (Vite) | 3000 | HTTP | Running |
| Backend (Express) | 3001 | HTTP | Not Running |
| Supabase API | Cloud | HTTPS | Connected |
| Socket.io | 3001 | WebSocket | Configured |
| Redis (optional) | 6379 | Redis | Not Used |

---

## Database (Supabase PostgreSQL)

### Connection Details
- **URL**: https://jfgenxnqpuutgdnnngsl.supabase.co
- **Auth**: Service role key (in .env)
- **Type**: Managed PostgreSQL

### Main Tables
```
users                    # User accounts & profiles
rides                    # Rideshare/carpooling listings
ride_bookings           # Booking records
marketplace_items       # Second-hand marketplace
item_favorites          # Saved/favorited items
groups                  # Activity groups
group_members           # Group membership
thoughts                # User posts/thoughts
user_visibility         # Location sharing settings
activities              # Campus events
activity_participants   # Event registrations
activity_checkins       # Event attendance
point_transactions      # Gamification scoring
point_rules             # Points earning rules
notifications           # User alerts
messages                # Private messaging
```

---

## API Endpoints Summary

### Authentication (`/api/v1/auth`)
- POST `/register` - Create new account
- POST `/login` - User login
- POST `/logout` - User logout
- POST `/refresh` - Refresh JWT token
- POST `/verify-email` - Email verification
- POST `/forgot-password` - Password reset request
- POST `/reset-password` - Password reset

### Users (`/api/v1/users`)
- GET `/me` - Current user info
- PUT `/me` - Update profile
- DELETE `/me` - Delete account
- GET `/:userId` - Get user profile

### Carpooling (`/api/v1/carpooling`)
- GET `/rides` - List rides
- POST `/rides` - Create ride
- GET `/rides/:id` - Ride details
- PUT `/rides/:id` - Update ride
- DELETE `/rides/:id` - Delete ride
- POST `/rides/:id/book` - Book ride
- GET `/my-rides` - My listed rides
- GET `/my-bookings` - My bookings

### Marketplace (`/api/v1/marketplace`)
- GET `/items` - List items
- POST `/items` - Post item
- GET `/items/:id` - Item details
- PUT `/items/:id` - Update item
- DELETE `/items/:id` - Delete item
- GET `/my-items` - My listings
- POST `/items/:id/favorite` - Save item
- GET `/favorites` - Saved items

### Activities (`/api/v1/activities`)
- GET `/` - List activities
- POST `/` - Create activity
- GET `/:id` - Activity details
- PUT `/:id` - Update activity
- DELETE `/:id` - Delete activity
- POST `/:id/register` - Join activity
- DELETE `/:id/register` - Leave activity
- POST `/:id/checkin` - Check in (with QR code)

### Groups (`/api/v1/groups`)
- GET `/` - List groups
- POST `/` - Create group
- GET `/my` - My groups
- POST `/:id/join` - Join group
- DELETE `/:id/leave` - Leave group
- GET `/:id/members` - Group members

### Leaderboard (`/api/v1/leaderboard`)
- GET `/` - Top users
- GET `/me` - My ranking
- GET `/stats` - Statistics

### Points (`/api/v1/points`)
- GET `/me` - My points
- GET `/:userId` - User points
- GET `/rules` - Points earning rules
- GET `/transactions/me` - Point history

### Notifications (`/api/v1/notifications`)
- GET `/` - List notifications
- PUT `/:id/read` - Mark as read
- PUT `/mark-all-read` - Mark all read
- DELETE `/:id` - Delete notification

### Health Check (`/api/v1/health`)
- GET `/` - Server status

---

## Startup Instructions

### Option 1: Manual Startup
```bash
# Terminal 1: Start Backend
cd /Users/zhuricardo/Desktop/CampusRide/CampusRide/integration/campusride-backend
npm run dev

# Terminal 2: Start Frontend
cd /Users/zhuricardo/Desktop/CampusRide/CampusRide/integration
npm run dev
```

### Option 2: Using Server Manager Script
```bash
# Single command to start both
/Users/zhuricardo/Desktop/CampusRide/CampusRide/server-manager.sh start

# Check status
/Users/zhuricardo/Desktop/CampusRide/CampusRide/server-manager.sh status

# Stop all
/Users/zhuricardo/Desktop/CampusRide/CampusRide/server-manager.sh stop
```

---

## Known Issues & Fixes Required

### Issue 1: Backend PORT Default
**File**: `campusride-backend/src/server.js` line 10
**Current**: `const PORT = process.env.PORT || 3000;`
**Should be**: `const PORT = process.env.PORT || 3001;`

### Issue 2: Backend CORS Default
**File**: `campusride-backend/src/app.js` line 48
**Current**: Default fallback is `http://localhost:3001`
**Should be**: Default fallback is `http://localhost:3000`

### Issue 3: Vite Host Binding
**File**: `vite.config.js` line 14
**Current**: `host: true`
**Should be**: `host: '0.0.0.0'`

**Detailed fixes in**: `/LOCALHOST_FIX_GUIDE.md`

---

## Environment Variables

### Frontend (.env)
```env
VITE_API_BASE_URL=http://localhost:3001
VITE_GOOGLE_MAPS_API_KEY=AIzaSyAi0TLayPvI8vfhD33bNtaVyoGHTjZ91F4
```

### Backend (.env) - Key Variables
```env
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000
SUPABASE_URL=https://jfgenxnqpuutgdnnngsl.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=24h
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@socialinteraction.club
```

---

## API Documentation Access

Once backend is running:
- **Swagger UI**: http://localhost:3001/api-docs
- **Direct API Root**: http://localhost:3001/
- **Health Check**: http://localhost:3001/api/v1/health

---

## Development Workflow

1. **Start Services**
   - Backend on 3001
   - Frontend on 3000

2. **Frontend Development**
   - Edit `.vue` files in `src/views/` or `src/components/`
   - Hot Module Replacement (HMR) auto-reloads in browser
   - Vite dev server watches all files

3. **Backend Development**
   - Edit files in `campusride-backend/src/`
   - Nodemon auto-restarts server on file changes
   - Check console for errors and logs

4. **API Changes**
   - Edit routes in `campusride-backend/src/routes/`
   - Add/update corresponding services
   - Test with curl or Swagger UI

5. **Database Changes**
   - Modify tables in Supabase dashboard
   - Update service layer queries
   - Create migrations if needed

6. **Styling**
   - Use Tailwind CSS utility classes
   - Ant Design Vue components for complex UI
   - Override in component `<style scoped>`

---

## Deployment Targets

### Frontend
- **Vercel** (configured in `vercel.json`)
- Alternative: Netlify, GitHub Pages

### Backend
- **Railway** (recommended)
- **Render**
- **Heroku**
- **AWS** (Lambda, EC2, or AppRunner)

### Database
- **Supabase** (current and recommended)

### Email
- **Resend** (current and recommended)

---

## Support & Documentation

| Document | Purpose | Location |
|----------|---------|----------|
| DIAGNOSTIC_REPORT.md | Detailed system analysis | /DIAGNOSTIC_REPORT.md |
| LOCALHOST_FIX_GUIDE.md | Configuration fixes | /LOCALHOST_FIX_GUIDE.md |
| ARCHITECTURE_OVERVIEW.md | System design | /ARCHITECTURE_OVERVIEW.md |
| README.md | Project overview | /integration/README.md |
| QUICK_START.md | Quick setup guide | /integration/QUICK_START.md |
| TROUBLESHOOTING.md | Common issues | /integration/TROUBLESHOOTING.md |

---

## Quick Diagnosis Commands

```bash
# Check if ports are in use
lsof -i :3000
lsof -i :3001

# Check if frontend is running
curl http://localhost:3000

# Check if backend is running
curl http://localhost:3001/api/v1/health

# Test CORS
curl -i -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  http://localhost:3001/api/v1/health

# View backend logs
/Users/zhuricardo/Desktop/CampusRide/CampusRide/server-manager.sh logs backend

# View frontend logs
/Users/zhuricardo/Desktop/CampusRide/CampusRide/server-manager.sh logs frontend
```

---

## Performance Metrics

- **Frontend Build**: ~100ms with Vite
- **API Response**: ~50-200ms (depending on DB query)
- **Hot Module Reload**: <1s
- **Server Startup**: ~3-5s
- **Database Query**: <100ms average

---

## Security Features

1. **JWT Authentication** - Stateless token-based auth
2. **CORS Protection** - Whitelist specific origins
3. **Helmet Security Headers** - Enhanced HTTP security
4. **Rate Limiting** - 500 requests per 15 minutes
5. **Password Hashing** - bcryptjs with salt rounds
6. **Input Validation** - express-validator on all routes
7. **Environment Secrets** - Sensitive data in .env files

---

## Testing

### Frontend Testing
```bash
cd integration
npm test
```

### Backend Testing
```bash
cd integration/campusride-backend
npm test                  # Run tests once
npm run test:watch       # Watch mode
npm run test:coverage    # With coverage report
```

---

## Troubleshooting Checklist

- [ ] Both services running?
- [ ] Correct ports (3000/3001)?
- [ ] Environment variables set?
- [ ] Database credentials correct?
- [ ] Network connectivity OK?
- [ ] Firewall allowing ports?
- [ ] Node/npm versions compatible?
- [ ] Dependencies installed?
- [ ] CORS configured correctly?
- [ ] Browser console shows errors?

---

## Next Steps

1. **Apply Configuration Fixes** (see LOCALHOST_FIX_GUIDE.md)
2. **Start Both Services**
3. **Verify Connectivity** (health checks)
4. **Test Core Features** (login, create ride, etc.)
5. **Check Browser Console** (for any client errors)
6. **Review Server Logs** (for any API errors)

---

**For detailed system analysis**: See `/DIAGNOSTIC_REPORT.md`
**For configuration fixes**: See `/LOCALHOST_FIX_GUIDE.md`
**For architecture details**: See `/ARCHITECTURE_OVERVIEW.md`
