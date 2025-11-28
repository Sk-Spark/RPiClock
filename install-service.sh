#!/bin/bash

# RPi Clock Service Installer
# This script installs the systemd service for automatic startup

echo "Installing Raspberry Pi Clock Service..."

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
    echo "Please do not run this script as root. Run it as your regular user."
    echo "The script will use sudo when needed."
    exit 1
fi

# Get the current directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
SERVICE_FILE="$SCRIPT_DIR/rpiclock.service"

echo "Step 1: Copying service file to systemd..."
sudo cp "$SERVICE_FILE" /etc/systemd/system/rpiclock.service

echo "Step 2: Reloading systemd daemon..."
sudo systemctl daemon-reload

echo "Step 3: Enabling service to start on boot..."
sudo systemctl enable rpiclock.service

echo ""
echo "✓ Service installed successfully!"
echo ""
echo "Available commands:"
echo "  Start service:    sudo systemctl start rpiclock"
echo "  Stop service:     sudo systemctl stop rpiclock"
echo "  Restart service:  sudo systemctl restart rpiclock"
echo "  Check status:     sudo systemctl status rpiclock"
echo "  View logs:        sudo journalctl -u rpiclock -f"
echo "  Disable autostart: sudo systemctl disable rpiclock"
echo ""
echo "The clock will now start automatically on boot!"
echo "To start it now, run: sudo systemctl start rpiclock"
