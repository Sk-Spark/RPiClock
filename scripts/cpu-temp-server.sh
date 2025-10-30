#!/bin/bash

# Simple script to read CPU temperature and serve it via a simple HTTP endpoint
# This can be run as a service on the Raspberry Pi

PORT=${1:-3001}

echo "Starting CPU temperature API server on port $PORT"

# Create a simple HTTP server that returns CPU temperature
while true; do
  # Read CPU temperature
  if [ -f /sys/class/thermal/thermal_zone0/temp ]; then
    TEMP_MILLIDEGREES=$(cat /sys/class/thermal/thermal_zone0/temp)
    TEMP_CELSIUS=$((TEMP_MILLIDEGREES / 1000))
    
    # Create JSON response
    JSON_RESPONSE="{\"temperature\": $TEMP_CELSIUS, \"unit\": \"C\", \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)\"}"
    
    # Serve the response
    echo -e "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nAccess-Control-Allow-Origin: *\r\n\r\n$JSON_RESPONSE" | nc -l -p $PORT -q 1
  else
    # Fallback response if thermal sensor not available
    ERROR_RESPONSE="{\"error\": \"CPU temperature sensor not available\", \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)\"}"
    echo -e "HTTP/1.1 503 Service Unavailable\r\nContent-Type: application/json\r\nAccess-Control-Allow-Origin: *\r\n\r\n$ERROR_RESPONSE" | nc -l -p $PORT -q 1
  fi
done