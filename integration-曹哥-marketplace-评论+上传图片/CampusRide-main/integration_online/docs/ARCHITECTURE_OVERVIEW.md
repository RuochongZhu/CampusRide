# CampusRide Architecture Overview

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          USER'S BROWSER                                      │
│                    (http://localhost:3000)                                   │
└────────────────────┬────────────────────────────────────────────────────────┘
                     │
                     │ HTTP/HTTPS Requests
                     │ REST API Calls
                     │
┌────────────────────▼────────────────────────────────────────────────────────┐
│                    FRONTEND TIER (Port 3000)                                │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │  Vue 3 Single Page Application (SPA)                               │  │
│  │  ├─ index.html (Entry Point)                                       │  │
│  │  ├─ src/main.js (Application Bootstrap)                            │  │
│  │  ├─ src/App.vue (Root Component)                                   │  │
│  │  │                                                                 │  │
│  │  ├─ Router (Vue Router)                                            │  │
│  │  │  ├─ /login, /register                                           │  │
│  │  │  ├─ /home, /dashboard                                           │  │
│  │  │  ├─ /carpooling, /marketplace                                   │  │
│  │  │  ├─ /activities, /groups                                        │  │
│  │  │  └─ /leaderboard                                                │  │
│  │  │                                                                 │  │
│  │  ├─ State Management (Pinia)                                       │  │
│  │  │  ├─ auth.store.js (Authentication state)                        │  │
│  │  │  ├─ user.store.js (User profile)                                │  │
│  │  │  └─ app.store.js (Global app state)                             │  │
│  │  │                                                                 │  │
│  │  ├─ Components                                                      │  │
│  │  │  ├─ Views (pages)                                               │  │
│  │  │  ├─ Layout Components                                           │  │
│  │  │  └─ Reusable UI Components                                      │  │
│  │  │                                                                 │  │
│  │  ├─ Utils                                                           │  │
│  │  │  ├─ api.js (Axios REST client)                                  │  │
│  │  │  ├─ auth.js (Auth utilities)                                    │  │
│  │  │  └─ helpers.js (Helper functions)                               │  │
│  │  │                                                                 │  │
│  │  └─ Assets                                                          │  │
│  │     ├─ styles/ (Tailwind CSS)                                       │  │
│  │     └─ images/                                                      │  │
│  │                                                                     │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  Build Tool: Vite                                                         │
│  Framework: Vue 3 + TypeScript ready                                      │
│  Styling: Tailwind CSS + Ant Design Vue                                   │
│  Package Manager: npm                                                      │
└────────────────────┬────────────────────────────────────────────────────────┘
                     │
                     │ REST API Calls to /api/v1/*
                     │ CORS: http://localhost:3000
                     │
┌────────────────────▼────────────────────────────────────────────────────────┐
│                    BACKEND TIER (Port 3001)                                │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │  Node.js + Express API Server                                      │  │
│  │  ├─ src/server.js (Entry point)                                    │  │
│  │  ├─ src/app.js (Express configuration)                             │  │
│  │  │                                                                 │  │
│  │  ├─ Routes (/api/v1/*)                                             │  │
│  │  │  ├─ auth.routes.js (Authentication)                             │  │
│  │  │  ├─ user.routes.js (User management)                            │  │
│  │  │  ├─ carpooling.routes.js (Ridesharing)                          │  │
│  │  │  ├─ marketplace.routes.js (Marketplace)                         │  │
│  │  │  ├─ activities.routes.js (Activities)                           │  │
│  │  │  ├─ groups.routes.js (Groups)                                   │  │
│  │  │  ├─ leaderboard.routes.js (Rankings)                            │  │
│  │  │  ├─ points.routes.js (Gamification)                             │  │
│  │  │  ├─ notifications.routes.js (Alerts)                            │  │
│  │  │  └─ health.routes.js (Status checks)                            │  │
│  │  │                                                                 │  │
│  │  ├─ Controllers (Request handlers)                                 │  │
│  │  │  └─ Handle business logic dispatch                              │  │
│  │  │                                                                 │  │
│  │  ├─ Services (Business Logic)                                      │  │
│  │  │  ├─ auth.service.js (JWT, Password, Email verification)        │  │
│  │  │  ├─ user.service.js (Profile, preferences)                     │  │
│  │  │  ├─ carpooling.service.js (Ride management)                    │  │
│  │  │  ├─ marketplace.service.js (Item listings)                     │  │
│  │  │  ├─ activities.service.js (Event management)                   │  │
│  │  │  ├─ points.service.js (Point calculations)                     │  │
│  │  │  └─ notification.service.js (Alert sending)                    │  │
│  │  │                                                                 │  │
│  │  ├─ Middleware                                                      │  │
│  │  │  ├─ authentication.js (JWT verification)                        │  │
│  │  │  ├─ authorization.js (Role-based access)                        │  │
│  │  │  ├─ error.middleware.js (Error handling)                        │  │
│  │  │  ├─ cors.js (CORS configuration)                                │  │
│  │  │  └─ rate-limit.js (Request throttling)                          │  │
│  │  │                                                                 │  │
│  │  ├─ Configuration                                                   │  │
│  │  │  ├─ database.js (Supabase client)                               │  │
│  │  │  ├─ socket.js (Socket.io setup)                                 │  │
│  │  │  └─ swagger.js (API documentation)                              │  │
│  │  │                                                                 │  │
│  │  └─ Utils                                                           │  │
│  │     ├─ database-init.js (Schema & data setup)                      │  │
│  │     └─ helper-functions.js                                         │  │
│  │                                                                     │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  Runtime: Node.js (ES Modules)                                            │
│  Framework: Express 5.x                                                    │
│  Package Manager: npm                                                      │
│  Development: Nodemon (auto-reload)                                        │
└────────────────────┬────────────────────┬──────────────────┬───────────────┘
                     │                    │                  │
        ┌────────────▼─┐    ┌────────────▼──┐    ┌──────────▼────┐
        │              │    │               │    │               │
        │              │    │               │    │               │
┌───────▼──────────┐  │  ┌─▼──────────┐  │  ┌──▼──────────┐  │
│   SUPABASE       │  │  │   RESEND   │  │  │GOOGLE MAPS  │  │
│  (PostgreSQL)    │  │  │   (Email)  │  │  │   (Maps API)│  │
│                  │  │  │            │  │  │             │  │
│ ┌──────────────┐ │  │  └────────────┘  │  └─────────────┘  │
│ │   Database   │ │  │                   │                    │
│ │   Tables:    │ │  │  Transactional    │   Location/Route   │
│ │ - users      │ │  │  Email Service    │   Geocoding        │
│ │ - rides      │ │  │                   │                    │
│ │ - items      │ │  │  Functions:       │                    │
│ │ - activities │ │  │  - Verification   │                    │
│ │ - groups     │ │  │  - Notifications  │                    │
│ │ - points     │ │  │  - Alerts         │                    │
│ │ - etc.       │ │  │                   │                    │
│ └──────────────┘ │  │                   │                    │
│                  │  │                   │                    │
│ ┌──────────────┐ │  └───────────────────┘                    │
│ │  Real-time   │ │                                           │
│ │  Database    │ │                                           │
│ │  (Realtime)  │ │                                           │
│ └──────────────┘ │                                           │
│                  │                                           │
└──────────────────┘                                           │
                                                               │
                                                    Optional:  │
                                                    ┌──────────▼────┐
                                                    │    Redis      │
                                                    │    (Caching)  │
                                                    │               │
                                                    │   Localhost   │
                                                    │   :6379       │
                                                    └───────────────┘
```

## Data Flow Diagram

### Authentication Flow
```
User Browser
    │
    ├─> POST /api/v1/auth/login
    │        │
    │        └─> Backend Auth Service
    │             │
    │             ├─> Hash password verification
    │             ├─> Query Supabase users table
    │             └─> Generate JWT token
    │
    └─< Returns JWT + User data
```

### API Request Flow
```
Frontend Component
    │
    ├─> axios.post('/api/v1/...')
    │
    ├─> Request Interceptor
    │   (Add JWT token to headers)
    │
    ├─> Network Request
    │   POST /api/v1/resources
    │   Authorization: Bearer <JWT>
    │   Origin: http://localhost:3000
    │
    └─> Backend Express
        │
        ├─> CORS Middleware
        │   (Check Origin against allowlist)
        │
        ├─> Auth Middleware
        │   (Verify JWT token)
        │
        ├─> Route Handler
        │   │
        │   ├─> Controller
        │   │   (Request validation)
        │   │
        │   └─> Service
        │       │
        │       ├─> Business Logic
        │       ├─> Supabase Query
        │       └─> Response Preparation
        │
        └─> Response
            (JSON data or error)
```

### Real-Time Communication (Socket.io)
```
Frontend Component                  Backend Socket Server
    │                                       │
    ├─> io.connect()                      │
    │   (WebSocket connection)             │
    │   │                                  │
    │   ├─ Handshake with JWT             │
    │   │                                  │
    │   └─> Connected & Authenticated      │
    │        │                             │
    │        ├─> socket.on('activity_update')
    │        │   (Receive real-time events)
    │        │                             │
    │        └─> Update UI                │
    │                                      │
    └─ socket.emit('action')              │
       (Send real-time action) ────────────┤
                                          │
                                          └─> Broadcast to room
                                             (activity:123)
```

## Service Dependencies

### Frontend Dependencies (Main)
```json
{
  "vue": "3.5.12",                    // UI Framework
  "vue-router": "4.4.5",              // Routing
  "pinia": "3.0.3",                   // State Management
  "axios": "1.7.9",                   // HTTP Client
  "ant-design-vue": "4.2.5",          // UI Components
  "tailwindcss": "3.4.15",            // CSS Utility Framework
  "@googlemaps/js-api-loader": "2.0.1" // Maps API
}
```

### Backend Dependencies (Main)
```json
{
  "express": "5.1.0",                 // Web Framework
  "cors": "2.8.5",                    // CORS Middleware
  "helmet": "8.1.0",                  // Security Headers
  "jsonwebtoken": "9.0.2",            // JWT Handling
  "bcryptjs": "3.0.2",                // Password Hashing
  "@supabase/supabase-js": "2.54.0",  // Supabase Client
  "socket.io": "4.8.1",               // Real-time Communication
  "resend": "4.0.1",                  // Email Service
  "express-rate-limit": "8.0.1",      // Rate Limiting
  "swagger-jsdoc": "6.2.8",           // API Documentation
  "morgan": "1.10.1"                  // HTTP Logging
}
```

## Port Mapping & Access Points

| Service | Port | Protocol | URL | Status |
|---------|------|----------|-----|--------|
| Frontend (Vite) | 3000 | HTTP | http://localhost:3000 | Running |
| Backend (Express) | 3001 | HTTP | http://localhost:3001 | Should Run |
| API Docs | 3001 | HTTP | http://localhost:3001/api-docs | On Backend |
| Health Check | 3001 | HTTP | http://localhost:3001/api/v1/health | On Backend |
| Socket.io | 3001 | WebSocket | ws://localhost:3001 | On Backend |
| Redis (optional) | 6379 | Redis | redis://localhost:6379 | Not Required |

## Environment Variables Organization

### Frontend (.env)
- `VITE_API_BASE_URL` - Backend API base URL
- `VITE_GOOGLE_MAPS_API_KEY` - Maps API key

### Backend (.env)
- `NODE_ENV` - Development/Production mode
- `PORT` - Server port (3001)
- `FRONTEND_URL` - Frontend origin for CORS
- `SUPABASE_URL` - Database URL
- `SUPABASE_ANON_KEY` - Public client key
- `SUPABASE_SERVICE_KEY` - Private admin key
- `JWT_SECRET` - Token signing secret
- `JWT_EXPIRES_IN` - Token expiration time
- `RESEND_API_KEY` - Email service API key
- `RESEND_FROM_EMAIL` - Email sender address

## Authentication & Authorization Flow

```
User Credentials
    │
    └─> POST /api/v1/auth/login
        │
        ├─> Hash input password
        ├─> Query users from Supabase
        ├─> Compare hashes (bcryptjs)
        │
        └─> If match:
            │
            ├─> Create JWT:
            │   {
            │     userId: uuid,
            │     email: string,
            │     iat: timestamp,
            │     exp: timestamp
            │   }
            │
            └─> Return JWT to frontend

Frontend Storage
    │
    └─> localStorage.setItem('userToken', jwt)

Subsequent Requests
    │
    └─> All requests include:
        Authorization: Bearer <jwt>
        │
        └─> Backend verifies:
            - JWT signature
            - Expiration time
            - User still exists & active
```

## API Endpoint Organization

```
/api/v1
├─ /auth
│  ├─ POST /register
│  ├─ POST /login
│  ├─ POST /logout
│  ├─ POST /refresh
│  └─ POST /verify-email
│
├─ /users
│  ├─ GET /me
│  ├─ PUT /me
│  └─ DELETE /me
│
├─ /carpooling
│  ├─ GET /rides
│  ├─ POST /rides
│  ├─ GET /rides/:id
│  ├─ PUT /rides/:id
│  ├─ DELETE /rides/:id
│  ├─ POST /rides/:id/book
│  └─ GET /my-bookings
│
├─ /marketplace
│  ├─ GET /items
│  ├─ POST /items
│  ├─ GET /items/:id
│  ├─ PUT /items/:id
│  ├─ DELETE /items/:id
│  └─ GET /my-items
│
├─ /activities
│  ├─ GET /
│  ├─ POST /
│  ├─ GET /:id
│  ├─ PUT /:id
│  ├─ DELETE /:id
│  ├─ POST /:id/register
│  └─ POST /:id/checkin
│
├─ /groups
│  ├─ GET /
│  ├─ POST /
│  ├─ POST /:id/join
│  └─ DELETE /:id/leave
│
├─ /leaderboard
│  ├─ GET /
│  └─ GET /me
│
├─ /points
│  ├─ GET /me
│  ├─ GET /rules
│  └─ GET /transactions/me
│
├─ /notifications
│  ├─ GET /
│  ├─ PUT /:id/read
│  └─ DELETE /:id
│
└─ /health
   └─ GET / (Status check)
```

## Error Handling Flow

```
Request Error
    │
    ├─> Backend Error Handler
    │   (Express error middleware)
    │
    └─> Categorize & Log
        │
        ├─> Authentication errors (401)
        ├─> Authorization errors (403)
        ├─> Validation errors (400)
        ├─> Server errors (500)
        │
        └─> Return standardized response:
            {
              success: false,
              error: {
                code: string,
                message: string,
                details: any
              }
            }

Frontend Response Interceptor
    │
    └─> If error.response.status === 401
        │
        ├─> Clear token from localStorage
        ├─> Redirect to /login
        │
        └─> Show error message to user
```

## Deployment Architecture (Future)

```
Production Environment
    │
    ├─ Frontend: Deployed to Vercel
    │  (Static hosting, CDN distribution)
    │
    ├─ Backend: Deployed to Railway/Render
    │  (Containerized Node.js service)
    │
    ├─ Database: Supabase (managed PostgreSQL)
    │
    ├─ Email: Resend (transactional email)
    │
    └─ Maps: Google Cloud (Maps API)

Custom Domain
    └─ DNS points to:
       ├─ api.example.com -> Backend service
       └─ example.com -> Vercel frontend
```

---

This architecture provides:
- Clear separation of concerns (frontend, backend, database)
- Scalable microservices-ready structure
- Real-time capabilities via Socket.io
- Secure authentication with JWT
- RESTful API design
- Comprehensive API documentation
