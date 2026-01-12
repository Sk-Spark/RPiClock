#!/bin/bash
# Start the Image API Server for the Admin Panel
# This server handles image upload, deletion, and listing

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

echo "Starting Image API Server..."
node scripts/image-api-server.js
