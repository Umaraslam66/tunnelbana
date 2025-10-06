# Stockholm Metro Visualization

Interactive visualization of Stockholm's metro system with real-time train animation based on GTFS data.

## 🚇 Features

- **Live Train Animation**: Watch trains move along all three metro lines (Blue, Red, Green)
- **Interactive Controls**: Toggle lines, adjust speed (1x-60x), and scrub through time
- **Real GTFS Data**: Based on actual Stockholm metro schedules (8-10 AM window)
- **Smooth Animations**: Trains follow curved track paths naturally
- **Dark Theme**: Modern glassmorphism UI design
- **Hide/Show Controls**: Clean viewing mode for presentations

## 🚀 Quick Start

### Local Development

```bash
cd stockholm-metro-app
npm install
npm start
```

Visit `http://localhost:3000` to see the app.

### Production Build

```bash
cd stockholm-metro-app
npm run build
```

## 📦 Deploy to Vercel

### Option 1: Deploy via Vercel CLI

```bash
npm install -g vercel
vercel
```

### Option 2: Deploy via Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click "New Project"
4. Import repository: `Umaraslam66/tunnelbana`
5. Vercel will auto-detect the React app
6. Click "Deploy"

The app will be live in minutes! 🎉

## 🎮 Usage

- **Map View**: Static metro map with all stations and lines
- **Animation View**: Live train simulation
- **Toggle Button (◀/▶)**: Hide/show the left control panel
- **Speed Control**: Drag slider or use presets (1x-60x)
- **Time Scrubber**: Jump to any time in the 8-10 AM window

## 📊 Data

- **Metro Lines**: Blue (T10/T11), Red (T13/T14), Green (T17/T18/T19)
- **Stations**: All Stockholm metro stations with connections
- **Schedule**: Morning rush hour (08:00-10:00)
- **Trains**: ~126 concurrent trains at peak times

## 🛠 Tech Stack

- React 18 + TypeScript
- Leaflet for maps
- GTFS data processing
- Glassmorphism UI design

## 📝 License

MIT

---

Built with ❤️ for Stockholm's tunnelbana

