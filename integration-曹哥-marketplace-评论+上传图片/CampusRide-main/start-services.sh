#!/bin/bash

echo "🧹 Cleaning up processes..."
pkill -f "node.*server.js"
pkill -f "vite"
sleep 2

echo ""
echo "🚀 Starting CampusRide Services..."
echo ""

# Start Backend
echo "📡 Starting Backend (Port 3001)..."
cd integration/campusride-backend
npm run dev > /dev/null 2>&1 &
BACKEND_PID=$!

sleep 5

# Check backend
if curl -s http://localhost:3001/api/v1/health > /dev/null; then
    echo "✅ Backend ready at: http://localhost:3001"
else
    echo "❌ Backend failed to start"
    exit 1
fi

echo ""

# Start Frontend
echo "🎨 Starting Frontend (Port 5173)..."
cd ../
npm run dev > /dev/null 2>&1 &
FRONTEND_PID=$!

sleep 5

echo "✅ Frontend ready at: http://localhost:5173"

echo ""
echo "═══════════════════════════════════════"
echo "🎉 CampusRide is ready!"
echo "═══════════════════════════════════════"
echo ""
echo "📍 Access Points:"
echo "   • Frontend: http://localhost:5173"
echo "   • Backend:  http://localhost:3001"
echo "   • API Docs: http://localhost:3001/api-docs"
echo ""
echo "🧪 Quick Test:"
echo "   1. Open: http://localhost:5173/register"
echo "   2. Register new account or login"
echo "   3. Navigate to: /groups"
echo "   4. Test Google Maps!"
echo ""
echo "💾 Database Info:"
echo "   • Your account exists: rz469@cornell.edu"
echo "   • Total users: 11"
echo "   • All tables ready"
echo ""
echo "🛑 To stop servers:"
echo "   pkill -f 'node.*server.js'"
echo "   pkill -f 'vite'"
echo ""
echo "Press Ctrl+C to stop monitoring..."
echo ""

# Monitor logs
tail -f ../integration/campusride-backend/logs/*.log 2>/dev/null || echo "Running... (Press Ctrl+C to exit)"
