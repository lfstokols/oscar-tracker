#!/bin/bash
# runservers.sh - Start/stop development servers for Vite and Python backend

set -e

# Always run in project root
cd "$(dirname "$0")/.."

# Log file
LOG_FILE_PY="logs/runservers.python.log"
LOG_FILE_VITE="logs/runservers.vite.log"

# Global flag to track if we should shut down
SHOULD_EXIT=false

# PIDs of the started processes
VITE_PID=""
PYTHON_PID=""

# Load .env values
load_env() {
    if [ -f .env ]; then
        set -a  # automatically export all variables
        source .env
        set +a
    else
        echo "Warning: .env file not found"
    fi
}

# Stop development servers
stop_dev_servers() {
    echo "Stopping development servers..."
    
    # Stop any running Vite dev servers on VITE_PORT
    if [ -n "${VITE_PORT:-}" ]; then
        # Find processes using the port and kill them
        if command -v lsof >/dev/null 2>&1; then
            lsof -ti ":$VITE_PORT" 2>/dev/null | xargs -r kill -9 2>/dev/null || true
        elif command -v fuser >/dev/null 2>&1; then
            fuser -k "${VITE_PORT}/tcp" 2>/dev/null || true
        fi
    fi
    
    # Find and stop Python processes running devserver.py
    pkill -f "python.*devserver.py" 2>/dev/null || true
    pkill -f "python3.*devserver.py" 2>/dev/null || true
}

# Cleanup function
cleanup() {
    SHOULD_EXIT=true
    
    if [ -n "$VITE_PID" ] && kill -0 "$VITE_PID" 2>/dev/null; then
        echo "Stopping Vite server (PID: $VITE_PID)..."
        kill "$VITE_PID" 2>/dev/null || true
    fi
    
    if [ -n "$PYTHON_PID" ] && kill -0 "$PYTHON_PID" 2>/dev/null; then
        echo "Stopping Python server (PID: $PYTHON_PID)..."
        kill "$PYTHON_PID" 2>/dev/null || true
    fi
    
    # Wait a bit for graceful shutdown, then force kill if needed
    sleep 2
    
    if [ -n "$VITE_PID" ] && kill -0 "$VITE_PID" 2>/dev/null; then
        kill -9 "$VITE_PID" 2>/dev/null || true
    fi
    
    if [ -n "$PYTHON_PID" ] && kill -0 "$PYTHON_PID" 2>/dev/null; then
        kill -9 "$PYTHON_PID" 2>/dev/null || true
    fi
    
    stop_dev_servers
    exit 0
}

# Register signal handlers
trap cleanup SIGINT SIGTERM

# Start development servers
start_dev_servers() {
    load_env
    
    echo "Starting development servers..."
    
    # Start Vite dev server in background
    echo "Starting Vite dev server..."
    npm run dev > "$LOG_FILE_VITE" 2>&1 &
    VITE_PID=$!
    
    # Start Python backend server in background
    echo "Starting Python backend server..."
    python backend/devserver.py > "$LOG_FILE_PY" 2>&1 &
    PYTHON_PID=$!
    
    echo "Development servers started."
    echo "  Vite server PID: $VITE_PID"
    echo "  Python server PID: $PYTHON_PID"
    echo "Press Ctrl+C to stop."
    
    # Wait until SIGINT or explicit stop
    while [ "$SHOULD_EXIT" = false ]; do
        sleep 1
        
        # Check if either process died unexpectedly
        if ! kill -0 "$VITE_PID" 2>/dev/null; then
            echo "Vite server crashed. Stopping all servers..."
            break
        fi
        
        if ! kill -0 "$PYTHON_PID" 2>/dev/null; then
            echo "Python server crashed. Stopping all servers..."
            break
        fi
    done
    
    cleanup
}

# Main script logic
if [ "${1:-}" = "--stop" ] || [ "${1:-}" = "-stop" ]; then
    load_env
    stop_dev_servers
else
    start_dev_servers
fi
