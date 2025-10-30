# Weather and CPU Temperature Setup

## Weather API Setup - NO API KEYS REQUIRED! 🎉

**The weather feature now uses completely FREE APIs with no registration needed!**

### Weather APIs Used:
1. **Primary**: [wttr.in](https://wttr.in) - Free world weather data
2. **Fallback**: [open-meteo.com](https://open-meteo.com) - Free European weather service

### Setup (Optional):
```bash
cp .env.example .env
```
- No API keys needed!
- Optional: Set default coordinates if geolocation fails

### Browser Permissions:
- The app will request location access for accurate weather
- Allow location access when prompted for best results

## CPU Temperature Setup (Raspberry Pi)

### Option 1: Simple HTTP Server (Recommended)

1. **Make script executable:**
   ```bash
   chmod +x scripts/cpu-temp-server.sh
   ```

2. **Run the CPU temperature server:**
   ```bash
   ./scripts/cpu-temp-server.sh
   ```

3. **Optional: Run as system service:**
   Create `/etc/systemd/system/cpu-temp-api.service`:
   ```ini
   [Unit]
   Description=CPU Temperature API
   After=network.target

   [Service]
   Type=simple
   User=pi
   WorkingDirectory=/home/pi/Projs/rpiclock
   ExecStart=/home/pi/Projs/rpiclock/scripts/cpu-temp-server.sh
   Restart=always

   [Install]
   WantedBy=multi-user.target
   ```

   Enable and start:
   ```bash
   sudo systemctl enable cpu-temp-api.service
   sudo systemctl start cpu-temp-api.service
   ```

### Option 2: Direct File Access

If running with proper permissions, the app will try to read directly from:
```
/sys/class/thermal/thermal_zone0/temp
```

## Features

- **Real-time weather** based on your location
- **CPU temperature monitoring** for Raspberry Pi
- **Automatic updates** every 30 seconds
- **Fallback handling** if services are unavailable
- **Beautiful weather icons** based on conditions

## Troubleshooting

- **Weather not loading:** Check API key and internet connection
- **CPU temp showing '--°C':** Ensure the CPU temp server is running
- **Location issues:** Allow browser location access or set default coordinates in `.env`