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
Neon Red, Orbit Digital, Teal Analog, Flip Clock, Nixie Clock, Zen Paper, Amber Matrix,
Cosmic Orbits, Terminal Green, and Pixel Landscape are available through visible previous/next
buttons in the top corners. They support touch and keyboard activation.
Navigation and the settings gear hide after 60 seconds without interaction.
Touch or click anywhere to reveal them; the first touch only reveals controls,
without accidentally selecting a face. The timeout pauses while settings are open.
Chromium renders fullscreen at the attached display's native `800x480` mode.

### Web controller

After running `bash deploy/install-kiosk.sh`, open
`http://127.0.0.1:5173/controller` on the existing clock server. The page is simply
a button for each face. No login or pairing step is required.

The page distinguishes the requested face from the face acknowledged by the
LCD and reports when the display is offline. Commands normally apply within
about two seconds. Local navigation and midnight rotation also update controller
status. The selected face persists outside the checkout in
`~/.local/share/rpiclock/controller/controller.json` with private permissions.

The existing server proxies commands to a small loopback-only relay; it has no
separate controller port to open. For a mobile browser on the same trusted Wi-Fi,
open `http://rpiclock.local:5173/controller` or use the Pi's current IP instead
of `rpiclock.local`. `http://rpiclock.local:1573/controller` is also supported
as a controller-only alias. Both addresses control the same LCD.
The user service serves only the controller and its built
assets on the LAN address, on the same port 5173; it does not expose the Vite
development server, admin/image APIs, or local display endpoint.
The LAN controller intentionally has no login, so anyone on that network can
switch faces. Do not forward this port to the internet.
Alternatively, from another computer, forward the existing local web port:
`ssh -L 5173:127.0.0.1:5173 spark@rpiclock.local`, then open
`http://localhost:5173/controller`. Untrusted origins and invalid commands are
rejected. Do not expose the development/admin server to the internet.

The boot launcher marks the physical kiosk with `?display=1`; ordinary face
previews do not take control of the LCD. Hidden kiosk tabs pause synchronization
and reconcile the latest selection when visible again, so they cannot overwrite
the active display's face. Test the API with `npm run test:controller`
and inspect `journalctl --user -u rpiclock-controller -b` for failures.
The controller is a user service started with the clock session. For an already
restored Pi, install it without sudo using:

```bash
install -m 644 deploy/rpiclock-controller.service ~/.config/systemd/user/
systemctl --user daemon-reload
systemctl --user enable --now rpiclock-controller
systemctl --user restart rpiclock-kiosk
```

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
browser's local timezone (the Pi uses Asia/Kolkata). Pixel Landscape wraps back to
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

Cycle through all available clock faces using the previous/next
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

### Flip Clock face

Open `http://localhost:5173/?face=flip-clock`, or select Flip Clock with the
navigation buttons. Four large split-flap cards display hours/minutes, with a
smaller pair for live seconds. Only changed digits animate,
with an orange colon, compact weekday/date, and local day-progress bar.
During each flip, the old lower digit is retained for the upper flap's full
300 ms drop; only then does the lower flap reveal the new digit.
The saved 12/24-hour format applies, and reduced-motion preferences disable the
flip animation. Outdoor temperature is the current local weather-service reading,
not a daily forecast high or an indoor sensor. CPU temperature uses the Pi sensor.
Muted SVG weather and chip icons replace the text labels; the temperature groups
retain accessible Outdoor/CPU names for screen readers.
Both share the existing digital clock polling; CPU updates are displayed without
waiting for the weather response. Unavailable readings show `--°C`, not invented
temperatures. Face memory, auto-hide controls, and midnight rotation remain active.

### Nixie Clock face

Open `http://localhost:5173/?face=nixie-clock`, or select Nixie Clock with the
navigation buttons. The supplied photographic artwork is used as the background;
its fixed digits and date were removed so live amber SVG numerals and date text
can be overlaid in the tubes and brass plate. The photo and overlays scale
together without cropping the clock. It follows the shared
12/24-hour format, remembers the selected face, and joins midnight rotation.
It reuses the existing ticker without weather or CPU polling. The numeral paths
are shared with Neon Red; all earlier faces remain available.

### Zen Paper face

Open `http://localhost:5173/?face=zen-paper`, or select Zen Paper in the controller
or local navigation. The supplied parchment/bamboo/enso artwork has its printed
time/date removed and replaced with live serif time and date text.
The background covers the entire viewport with no letterboxing; artwork and
overlays scale together, with edge cropping where screen proportions differ.
The shared 12/24-hour preference, face memory, and midnight rotation apply.
It shares the ticker and makes no weather or CPU requests.

### Amber Matrix face

Open `http://localhost:5173/?face=amber-matrix`, or select Amber Matrix in the
controller. Warm SVG LED dots display live time, a compact date, and the current
outdoor weather temperature over a full-screen dark dot grid.
The glyphs are drawn as dots, not an image or a downloaded font. Negative and
decimal temperatures and unavailable readings (`--°C`) are supported.
Shared time-format settings, face memory, local controls, and midnight rotation
apply; existing digital-clock data polling supplies the weather.

### Designs from ClockFacesImplement

All three supplied designs are available in the controller and local navigation:

| Reference | Face | Features |
| --- | --- | --- |
| `image.png` | Cosmic Orbits (`cosmic-orbits`) | Starfield, live hour/minute/second rings, ISO week, day-of-year |
| `image1.png` | Terminal Green (`terminal-green`) | Pixel time/seconds/date, day progress, live CPU load/temperature, uptime, Wi-Fi bars |
| `image2.png` | Pixel Landscape (`pixel-landscape`) | Preserved pixel scenery with live block-font time and date |

Cosmic Orbits uses enlarged, medium-weight central time and brighter date/period
text for readability on the LCD.

The terminal reads `/api/system` on the existing local web server. CPU load is
calculated from OS tick deltas; uptime and temperature come from the Pi.
Wi-Fi bars use `/proc/net/wireless` link quality normalized against the Pi's
70-point scale. Missing metrics are shown as unavailable, not sample values.
The system endpoint is not exposed by the mobile controller.

Pixel Landscape fills the viewport, cropping artwork edges when needed, and
uses a local background with its original fixed text removed. All three faces
share the clock ticker, saved 12/24-hour preference, face memory, controller, and
midnight rotation. Existing faces remain available.

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
