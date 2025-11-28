#!/bin/bash

# RPi Clock Service Uninstaller
# This script removes the systemd service

echo "Uninstalling Raspberry Pi Clock Service..."

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
    echo "Please do not run this script as root. Run it as your regular user."
    echo "The script will use sudo when needed."
    exit 1
fi

echo "Step 1: Stopping service if running..."
sudo systemctl stop rpiclock.service 2>/dev/null

echo "Step 2: Disabling service..."
sudo systemctl disable rpiclock.service 2>/dev/null

echo "Step 3: Removing service file..."
sudo rm /etc/systemd/system/rpiclock.service

echo "Step 4: Reloading systemd daemon..."
sudo systemctl daemon-reload

echo ""
echo "✓ Service uninstalled successfully!"
echo "The clock will no longer start automatically on boot."
