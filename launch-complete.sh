#!/bin/bash

# Raspberry Pi Clock Complete Launcher
# This script starts the development server and then launches kiosk mode

echo "Starting Raspberry Pi Modern Clock..."
echo "Step 1: Starting development server..."

# Change to project directory
cd /home/spark/Projs/rpiclock

# Start the development server in background
npm run dev &
SERVER_PID=$!

echo "Development server started (PID: $SERVER_PID)"
echo "Waiting for server to be ready..."

# Wait for server to start (check if port 5173 is listening)
while ! nc -z localhost 5173; do
  sleep 1
done

echo "Server is ready!"
echo "Step 2: Launching kiosk mode..."

# Wait a bit more to ensure everything is loaded
sleep 3

# Launch kiosk mode
./launch-kiosk.sh

echo "Clock launched successfully!"