#!/bin/bash

# Raspberry Pi Clock Complete Launcher
# This script starts the CPU temp API, development server, and launches kiosk mode

# Cleanup function
cleanup() {
    echo "Shutting down services..."
    if [ ! -z "$CPU_TEMP_PID" ]; then
        kill $CPU_TEMP_PID 2>/dev/null
        echo "CPU temperature API stopped"
    fi
    if [ ! -z "$SERVER_PID" ]; then
        kill $SERVER_PID 2>/dev/null
        echo "Development server stopped"
    fi
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

echo "Starting Raspberry Pi Modern Clock..."
echo "Step 1: Starting CPU temperature API server..."

# Change to project directory
cd /home/spark/Projs/rpiclock

# Start the CPU temperature API server in background
./scripts/cpu-temp-server.sh &
CPU_TEMP_PID=$!

echo "CPU temperature API started (PID: $CPU_TEMP_PID)"
echo "Step 2: Starting development server..."

# Start the development server in background
npm run dev &
SERVER_PID=$!

echo "Development server started (PID: $SERVER_PID)"
echo "Waiting for server to be ready..."

# Wait for servers to start (check if both ports are listening)
echo "Waiting for CPU temp API (port 3001)..."
while ! nc -z localhost 3001; do
  sleep 1
done

echo "Waiting for development server (port 5173)..."
while ! nc -z localhost 5173; do
  sleep 1
done

echo "Both servers are ready!"
echo "Step 3: Launching kiosk mode..."

# Wait a bit more to ensure everything is loaded
sleep 3

# Launch kiosk mode
./launch-kiosk.sh

echo "Clock launched successfully!"
echo "Services running:"
echo "  - CPU Temperature API (PID: $CPU_TEMP_PID) on port 3001"
echo "  - Development Server (PID: $SERVER_PID) on port 5173"
echo ""
echo "To stop all services, press Ctrl+C or run:"
echo "  kill $CPU_TEMP_PID $SERVER_PID"