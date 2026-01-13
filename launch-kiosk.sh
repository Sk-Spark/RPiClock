#!/bin/bash

# Raspberry Pi Clock Kiosk Mode Launcher
# This script launches the clock app in full-screen kiosk mode

echo "Starting Raspberry Pi Modern Clock in kiosk mode..."

# Kill any existing chromium processes
pkill chromium

# Kill any existing unclutter process and start fresh
pkill unclutter 2>/dev/null

# Wait a moment
sleep 2

# Hide cursor using unclutter (hides cursor after 0.1 seconds of inactivity)
# Install with: sudo apt install unclutter
unclutter -idle 0.1 -root &

# Move cursor off screen as additional measure
xdotool mousemove 9999 9999

# Launch Chromium in kiosk mode (with cursor hidden inside browser)
chromium-browser \
  --kiosk \
  --disable-infobars \
  --disable-session-crashed-bubble \
  --disable-translate \
  --no-first-run \
  --disable-features=TranslateUI \
  --disable-ipc-flooding-protection \
  --enable-features=OverlayScrollbar \
  --start-fullscreen \
  --window-size=800,480 \
  --window-position=0,0 \
  --disable-dev-shm-usage \
  --no-sandbox \
  http://localhost:5173

echo "Clock app launched in kiosk mode"