#!/bin/bash

# CampusRide Development Server Manager
# 管理前后端服务的启动、停止和重启

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Paths
BACKEND_DIR="/Users/zhuricardo/Desktop/CampusRide/CampusRide/integration/campusride-backend"
FRONTEND_DIR="/Users/zhuricardo/Desktop/CampusRide/CampusRide/integration"

# Functions
print_header() {
    echo ""
    echo -e "${BLUE}======================================${NC}"
    echo -e "${BLUE}  CampusRide Server Manager${NC}"
    echo -e "${BLUE}======================================${NC}"
    echo ""
}

stop_servers() {
    echo -e "${YELLOW}🛑 Stopping all servers...${NC}"

    # Stop by PIDs if exists
    if [ -f /tmp/backend.pid ]; then
        kill $(cat /tmp/backend.pid) 2>/dev/null && echo "✅ Backend stopped (PID: $(cat /tmp/backend.pid))"
        rm /tmp/backend.pid
    fi

    if [ -f /tmp/frontend.pid ]; then
        kill $(cat /tmp/frontend.pid) 2>/dev/null && echo "✅ Frontend stopped (PID: $(cat /tmp/frontend.pid))"
        rm /tmp/frontend.pid
    fi

    # Force kill any remaining processes on ports
    lsof -ti:3001 2>/dev/null | xargs kill -9 2>/dev/null
    lsof -ti:3000 2>/dev/null | xargs kill -9 2>/dev/null
    lsof -ti:5173 2>/dev/null | xargs kill -9 2>/dev/null

    echo -e "${GREEN}✅ All servers stopped${NC}"
}

clear_cache() {
    echo -e "${YELLOW}🧹 Clearing cache...${NC}"

    # Clear frontend cache
    cd "$FRONTEND_DIR"
    rm -rf node_modules/.vite dist 2>/dev/null
    echo "✅ Frontend cache cleared"

    # Clear backend cache
    cd "$BACKEND_DIR"
    rm -rf node_modules/.cache 2>/dev/null
    echo "✅ Backend cache cleared"

    echo -e "${GREEN}✅ All cache cleared${NC}"
}

start_backend() {
    echo -e "${YELLOW}🚀 Starting backend...${NC}"
    cd "$BACKEND_DIR"

    PORT=3001 npm start > /tmp/backend.log 2>&1 &
    echo $! > /tmp/backend.pid

    sleep 3

    if ps -p $(cat /tmp/backend.pid) > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend started on http://localhost:3001${NC}"
        echo -e "${GREEN}   PID: $(cat /tmp/backend.pid)${NC}"
        echo -e "${GREEN}   API Docs: http://localhost:3001/api-docs${NC}"
        return 0
    else
        echo -e "${RED}❌ Backend failed to start${NC}"
        cat /tmp/backend.log
        return 1
    fi
}

start_frontend() {
    echo -e "${YELLOW}🚀 Starting frontend...${NC}"
    cd "$FRONTEND_DIR"

    npm run dev > /tmp/frontend.log 2>&1 &
    echo $! > /tmp/frontend.pid

    sleep 4

    if ps -p $(cat /tmp/frontend.pid) > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Frontend started on http://localhost:3000${NC}"
        echo -e "${GREEN}   PID: $(cat /tmp/frontend.pid)${NC}"
        return 0
    else
        echo -e "${RED}❌ Frontend failed to start${NC}"
        cat /tmp/frontend.log
        return 1
    fi
}

check_status() {
    echo -e "${BLUE}📊 Server Status:${NC}"
    echo ""

    # Check backend
    if [ -f /tmp/backend.pid ] && ps -p $(cat /tmp/backend.pid) > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend: Running${NC} (PID: $(cat /tmp/backend.pid))"
        echo "   URL: http://localhost:3001"
        curl -s http://localhost:3001/api/v1/health | grep -q "ok" && echo "   Health: OK" || echo "   Health: ERROR"
    else
        echo -e "${RED}❌ Backend: Not running${NC}"
    fi

    echo ""

    # Check frontend
    if [ -f /tmp/frontend.pid ] && ps -p $(cat /tmp/frontend.pid) > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Frontend: Running${NC} (PID: $(cat /tmp/frontend.pid))"
        echo "   URL: http://localhost:3000"
    else
        echo -e "${RED}❌ Frontend: Not running${NC}"
    fi

    echo ""
}

show_logs() {
    echo -e "${BLUE}📋 Recent Logs:${NC}"
    echo ""

    if [ "$1" == "backend" ] || [ -z "$1" ]; then
        echo -e "${YELLOW}Backend logs:${NC}"
        tail -20 /tmp/backend.log 2>/dev/null || echo "No backend logs found"
        echo ""
    fi

    if [ "$1" == "frontend" ] || [ -z "$1" ]; then
        echo -e "${YELLOW}Frontend logs:${NC}"
        tail -20 /tmp/frontend.log 2>/dev/null || echo "No frontend logs found"
        echo ""
    fi
}

# Main script
print_header

case "$1" in
    start)
        stop_servers
        echo ""
        start_backend
        echo ""
        start_frontend
        echo ""
        check_status
        ;;
    stop)
        stop_servers
        ;;
    restart)
        stop_servers
        echo ""
        clear_cache
        echo ""
        start_backend
        echo ""
        start_frontend
        echo ""
        check_status
        ;;
    status)
        check_status
        ;;
    logs)
        show_logs "$2"
        ;;
    clear)
        stop_servers
        echo ""
        clear_cache
        ;;
    backend)
        case "$2" in
            start)
                start_backend
                ;;
            stop)
                kill $(cat /tmp/backend.pid) 2>/dev/null && echo "✅ Backend stopped"
                lsof -ti:3001 2>/dev/null | xargs kill -9 2>/dev/null
                ;;
            restart)
                kill $(cat /tmp/backend.pid) 2>/dev/null
                lsof -ti:3001 2>/dev/null | xargs kill -9 2>/dev/null
                start_backend
                ;;
            logs)
                tail -f /tmp/backend.log
                ;;
            *)
                echo "Usage: $0 backend {start|stop|restart|logs}"
                ;;
        esac
        ;;
    frontend)
        case "$2" in
            start)
                start_frontend
                ;;
            stop)
                kill $(cat /tmp/frontend.pid) 2>/dev/null && echo "✅ Frontend stopped"
                lsof -ti:3000 2>/dev/null | xargs kill -9 2>/dev/null
                ;;
            restart)
                kill $(cat /tmp/frontend.pid) 2>/dev/null
                lsof -ti:3000 2>/dev/null | xargs kill -9 2>/dev/null
                start_frontend
                ;;
            logs)
                tail -f /tmp/frontend.log
                ;;
            *)
                echo "Usage: $0 frontend {start|stop|restart|logs}"
                ;;
        esac
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status|logs|clear|backend|frontend}"
        echo ""
        echo "Commands:"
        echo "  start    - Start both frontend and backend"
        echo "  stop     - Stop both frontend and backend"
        echo "  restart  - Restart both (with cache clear)"
        echo "  status   - Check server status"
        echo "  logs     - Show recent logs (logs backend|frontend for specific)"
        echo "  clear    - Stop servers and clear cache"
        echo "  backend  - Manage backend only (start|stop|restart|logs)"
        echo "  frontend - Manage frontend only (start|stop|restart|logs)"
        echo ""
        echo "Examples:"
        echo "  $0 start              # Start all servers"
        echo "  $0 restart            # Restart with cache clear"
        echo "  $0 backend restart    # Restart only backend"
        echo "  $0 logs backend       # Show backend logs"
        exit 1
        ;;
esac

echo ""
