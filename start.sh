#!/bin/bash
# ── WBS Engine — Quick Start Script ───────────────────────────────────────

# Load NVM and use Node 20
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm use 20 2>/dev/null || true

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}  🚀  WBS Engine — AI Project Breakdown & Task Allocation Engine         ${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check .env
if [ ! -f "$BACKEND_DIR/.env" ] || grep -q "your_gemini_api_key_here" "$BACKEND_DIR/.env"; then
  echo -e "${YELLOW}⚠️  WARNING: GEMINI_API_KEY not configured!${NC}"
  echo -e "   Edit ${YELLOW}backend/.env${NC} and add your API key."
  echo -e "   Get one free at: ${CYAN}https://aistudio.google.com/app/apikey${NC}"
  echo ""
fi

# Start Backend
echo -e "${GREEN}▶ Starting Backend API (port 5000)...${NC}"
cd "$BACKEND_DIR" && npm run dev &
BACKEND_PID=$!

# Small delay
sleep 2

# Start Frontend
echo -e "${GREEN}▶ Starting Frontend (port 5173)...${NC}"
cd "$FRONTEND_DIR" && npm run dev &
FRONTEND_PID=$!

echo ""
echo -e "${GREEN}✅ Both servers starting!${NC}"
echo -e "   Frontend: ${CYAN}http://localhost:5173${NC}"
echo -e "   Backend:  ${CYAN}http://localhost:5000${NC}"
echo -e "   Health:   ${CYAN}http://localhost:5000/health${NC}"
echo ""
echo -e "Press ${RED}Ctrl+C${NC} to stop both servers."
echo ""

# Wait and handle cleanup
cleanup() {
  echo ""
  echo -e "${YELLOW}Stopping servers...${NC}"
  kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
  exit 0
}

trap cleanup SIGINT SIGTERM

wait
