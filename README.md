# Raspberry Pi Modern Clock

A beautiful, modern clock display designed for Raspberry Pi. Features both digital and analog clock faces with smooth animations and a responsive design perfect for full-screen kiosk mode.

## Features

- **Modern Digital Clock**: Large, readable time display with smooth animations
- **Analog Clock**: Beautiful circular clock with hour, minute, and second hands
- **Full-Screen Support**: Optimized for Raspberry Pi kiosk mode display
- **Responsive Design**: Works on various screen sizes
- **Real-Time Updates**: Updates every second with smooth transitions
- **Date Display**: Shows current day and date
- **TypeScript**: Built with TypeScript for type safety and better development experience

## Technologies Used

- React 19 with TypeScript
- Vite for fast development and building
- Modern CSS with animations and gradients
- Inter font from Google Fonts

## Installation

1. Make sure Node.js is installed on your Raspberry Pi
2. Clone or download this project
3. Install dependencies:
   ```bash
   npm ci
   ```

## Development

To run the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Production Build

To build for production:

```bash
npm run build
```

To preview the production build:

```bash
npm run preview
```

## Kiosk Mode (Raspberry Pi)

For the restored Raspberry Pi OS Lite installation, use the LightDM setup below.
The kiosk launcher requires a running X11 session and the web and CPU services.
Chromium uses its normal sandbox and a separate clock profile. The launcher does
not terminate other applications.

The Vite development server is intentionally retained because the existing
image-management and network-info APIs are implemented in its middleware.
`npm run preview` alone does not provide those APIs.

### Raspberry Pi OS Lite setup

With the application in `/home/spark/RPiClock/app` and the restoration scripts
in `/home/spark/RPiClock/app/deploy`:

```bash
cd /home/spark/RPiClock/app
npm ci
npm run build
bash deploy/install-kiosk.sh
```

Run the installer in the integrated terminal; enter the sudo password only there.
The prerequisite installer is `deploy/update-pi.sh`. The kiosk installer also
adds `scrot` and `x11-utils` for checking the actual LCD output, and an emoji font
for the existing weather icons.

LightDM automatically logs in `spark` locally to the dedicated RPiClock/Openbox
session. This does not change SSH authentication. The last active face is restored
on startup; Digital Clock is used when no face has been saved. Analog, Retro LCD,
Neon Red, Orbit Digital, and Teal Analog are available through visible previous/next
buttons in the top corners. They support touch and keyboard activation.
Navigation and the settings gear hide after 60 seconds without interaction.
Touch or click anywhere to reveal them; the first touch only reveals controls,
without accidentally selecting a face. The timeout pauses while settings are open.
Chromium renders fullscreen at the attached display's native `800x480` mode.

### Remembering the active face

The current face is saved automatically in this browser profile, including
manual navigation and midnight rotation. The kiosk's normal startup URL restores
that face after a browser restart or Pi reboot without changing the launcher.
An explicit `?face=...` link overrides the remembered face and becomes the new
saved selection. Use `?face=digital` to explicitly choose Digital Clock.
Storage failures are logged and shown in settings; invalid or removed saved faces
fall back to Digital Clock. Preferences are independent for different browsers
and devices, just like the time-format setting.

### Daily midnight face rotation

While the clock app is running, it advances to the next face at midnight in the
browser's local timezone (the Pi uses Asia/Kolkata). Teal Analog wraps back to
Digital Clock. Each new calendar day rotates once; visibility/page restoration
checks catch a midnight missed while the running tab was paused.

Rotation preserves the saved time format, other URL parameters, and hidden
controls. It replaces the current face URL instead of adding automatic browser
history entries. Manual previous/next navigation remains available. No cron job,
administrator access, or additional service is required.

### Shared time-format setting

Tap the gear at the top right to choose **12-hour** or **24-hour** time.
The selection applies immediately to every face, including the analog face's
digital readout. In 12-hour mode all faces show AM/PM; in 24-hour mode they do not.
Analog hands continue to use their normal 12-hour dial, and day progress and
greetings are based on the actual local time, not the formatted hour.

The default is 24-hour. The choice is stored in this browser's local storage and
survives navigation, refresh, and restarting its kiosk profile. Same-origin tabs
within the same browser profile share updates. Separate browsers/devices, such as the VS Code preview and the
Pi's Chromium profile, have independent preferences. Storage failures are logged
and shown in settings rather than claiming that an unsaved choice was saved.

### Retro LCD face

The Retro LCD face recreates the mint-green seven-segment concept with live
hours/minutes, smaller seconds, AM/PM, uppercase date, weather, and CPU temperature.
It shares the original digital clock's time and system-data updates, rather than
duplicating API polling. Digits and weather symbols are SVG, not a static image
or an external font.

Cycle through Digital Clock, Analog Clock, Retro LCD, Neon Red, Orbit Digital, and Teal Analog using the previous/next
buttons. Navigation updates the URL, so refresh and browser Back retain the
correct face. To open Retro LCD directly, use
`http://localhost:5173/?face=retro-lcd`; a URL without `face` restores the saved
face, or Digital Clock when none is saved. Run the focused rendering checks with
`npm run test:faces`.

### Analog face clarity

The analog face uses a matte navy background, an opaque dial, and high-contrast
date text and markers without glass blur or glow effects. Its date styles are
isolated from the digital face's gradient text. The shared time-format setting
still controls its digital readout without changing the analog hands.

### Neon Red face

Open `http://localhost:5173/?face=neon-red`, or select Neon Red with the navigation
buttons. This minimal face uses red SVG numerals with a subtle glow on pure
black, live time in the selected format, and the compact date format `FRI 13 NOV`. The numeral
strokes are strengthened and the date is larger and semibold for LCD readability.
It intentionally omits seconds, weather, and CPU widgets to match the
reference. Timekeeping is shared with the digital clock; system-data polling is
disabled while this face is active. No external font or static clock image is
required, and the original default face remains unchanged.

### Orbit Digital face

Open `http://localhost:5173/?face=orbit-digital`, or select Orbit Digital with the
navigation buttons. This dark blue/purple face shows a time-of-day greeting,
time in the selected format, a readable full date, and progress through the local 24-hour day.
The counterclockwise SVG ring tracks seconds from 0 to 59, with the current
seconds and ISO week number in the centre. It shares the existing clock ticker
and does not poll weather or CPU APIs. The original faces and default remain
unchanged.

### Teal Analog face

Open `http://localhost:5173/?face=teal-analog`, or select Teal Analog with the
navigation buttons. A numbered SVG dial sits beside local time, weekday, and
date, with cards for ISO week, local day-of-year, and real UTC time.
Both local and UTC readouts follow the shared 12/24-hour setting; the hands
retain the conventional 12-hour dial. Calendar values handle leap years and ISO
week-year boundaries. The face shares the clock ticker and needs no extra APIs.

The web/image APIs listen on `127.0.0.1:5173`; the CPU-temperature API listens on
`127.0.0.1:3001`. For remote admin access, forward the web port through SSH
instead of exposing the unauthenticated image API to the network:

```bash
ssh -L 5173:127.0.0.1:5173 spark@rpiclock.local
```

Then open `http://localhost:5173/admin` on the SSH client.

Service diagnostics:

```bash
systemctl status rpiclock-web rpiclock-cpu lightdm
systemctl --user status rpiclock-kiosk
journalctl -u rpiclock-web -u rpiclock-cpu -b
journalctl --user -u rpiclock-kiosk -b
```

Use `systemctl --user restart rpiclock-kiosk` to restart only the clock browser.
The Node-based CPU API supports concurrent requests and reports sensor failures
as HTTP 503. The display shows `--°C` on failure instead of a simulated value.
Run its focused regression checks with `npm run test:cpu`.
The legacy `launch-complete.sh`, `install-service.sh`, and old `rpiclock.service`
are not used by this setup.

## Customization

### Colors and Styling
- Edit `src/components/ModernClock.css` to customize colors, fonts, and animations
- The main gradient background can be changed in the `.modern-clock` class
- Clock hand colors and styles can be modified in the respective `.hand` classes

### Time Format
- The component uses 12-hour format by default
- To change to 24-hour format, modify the time calculation in `ModernClock.tsx`

### Clock Size
- Analog clock size can be adjusted by changing the width/height in `.analog-clock`
- Digital display font sizes use `clamp()` for responsive scaling

## Auto-Start on Boot (Optional)

The Lite installer enables the web/CPU services and LightDM, and selects the
graphical boot target. LightDM starts the dedicated session, which starts the
supervised kiosk browser after bounded API readiness checks.
No cron entry is required. The installer does not reboot the machine; reboot
verification should be performed separately with approval.

## File Structure

```
rpiclock/
├── src/
│   ├── components/
│   │   ├── ModernClock.tsx      # Main clock component
│   │   └── ModernClock.css      # Clock styling
│   ├── App.tsx                  # Main app component
│   ├── App.css                  # App styling
│   ├── index.css                # Global styles
│   └── main.tsx                 # App entry point
├── public/                      # Static assets
├── index.html                   # HTML template
├── launch-kiosk.sh             # Kiosk mode launcher
├── package.json                # Dependencies and scripts
└── README.md                   # This file
```

## Troubleshooting

- **Clock not updating**: Check browser console for JavaScript errors
- **Kiosk mode not working**: Ensure Chromium is installed (`sudo apt install chromium`) and inspect the service logs above
- **Fonts not loading**: Check internet connection for Google Fonts
- **Display issues**: Try different screen resolutions in the kiosk script

## License

This project is open source and available under the MIT License.
# RPiClock
