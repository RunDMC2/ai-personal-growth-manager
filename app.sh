#!/bin/bash

kill_port() {
    PORT=$1
    PID=$(netstat -ano | grep ":$PORT" | grep LISTENING | awk '{print $5}' | head -n 1)
    if [ -n "$PID" ]; then
        echo "Killing process $PID on port $PORT"
        taskkill //PID $PID //F
    fi
}

# kill anything already on frontend/backend ports
kill_port 3000
kill_port 8000

trap 'kill $(jobs -p) 2>/dev/null' EXIT



# frontend
cd frontend
npm run dev &

# backend
cd ../backend
python -m uvicorn app.main:app --reload

