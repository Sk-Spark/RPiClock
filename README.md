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

- React 18 with TypeScript
- Vite for fast development and building
- Modern CSS with animations and gradients
- Inter font from Google Fonts

## Installation

1. Make sure Node.js is installed on your Raspberry Pi
2. Clone or download this project
3. Install dependencies:
   ```bash
   npm install
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

For full-screen kiosk mode on Raspberry Pi:

1. Start the development server:
   ```bash
   npm run dev
   ```

2. In another terminal, run the kiosk launcher:
   ```bash
   ./launch-kiosk.sh
   ```

This will open Chromium in full-screen kiosk mode displaying the clock.

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

To automatically start the clock on Raspberry Pi boot:

1. Edit crontab:
   ```bash
   crontab -e
   ```

2. Add this line:
   ```
   @reboot cd /home/spark/Projs/rpiclock && npm run dev && sleep 30 && ./launch-kiosk.sh
   ```

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
- **Kiosk mode not working**: Ensure Chromium is installed (`sudo apt install chromium-browser`)
- **Fonts not loading**: Check internet connection for Google Fonts
- **Display issues**: Try different screen resolutions in the kiosk script

## License

This project is open source and available under the MIT License.
# RPiClock
