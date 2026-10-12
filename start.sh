#!/bin/bash
# ============================================================
# WebIntel Platform — Start Script
# ============================================================
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$SCRIPT_DIR/frontend"
BACKEND_DIR="$SCRIPT_DIR/backend"

echo ""
echo "  WebIntel — Website Intelligence Platform"
echo "  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check .env for backend
if [ ! -f "$BACKEND_DIR/.env" ]; then
  echo "  ⚠  No backend/.env found. Copying .env.example..."
  cp "$BACKEND_DIR/.env.example" "$BACKEND_DIR/.env"
  echo "  ✓  Created backend/.env — please fill in your API keys"
  echo ""
fi

# Cleanup existing processes on ports 3000 and 8000
echo "  ◎  Cleaning up old processes on ports 3000 and 8000..."
kill -9 $(lsof -t -i:3000) 2>/dev/null || true
kill -9 $(lsof -t -i:8000) 2>/dev/null || true

# Start Backend
echo "  ▶  Starting FastAPI backend on http://localhost:8000"
cd "$BACKEND_DIR"

# Create venv if needed
if [ ! -d "venv" ]; then
  echo "  ◎  Creating Python virtual environment..."
  python3 -m venv venv
  echo "  ◎  Installing dependencies..."
  ./venv/bin/pip install -q -r requirements.txt
  echo "  ◎  Installing Playwright browsers..."
  ./venv/bin/playwright install chromium
fi

./venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!
echo "  ✓  Backend started (PID: $BACKEND_PID)"

# Start Frontend
echo "  ▶  Starting Next.js frontend on http://localhost:3000"
cd "$FRONTEND_DIR"
npm run dev &
FRONTEND_PID=$!
echo "  ✓  Frontend started (PID: $FRONTEND_PID)"

echo ""
echo "  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🌐  Open: http://localhost:3000"
echo "  📡  API:  http://localhost:8000/api/docs"
echo "  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Wait
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" SIGINT SIGTERM
wait
