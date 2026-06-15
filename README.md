# Run Tracker

A simple Expo / React Native app to track your workout runs. Start a run, watch
your path draw live on the map, and keep a log of every run with distance, time,
and pace.

## Features

- **Live GPS tracking** — your route is drawn on the map in real time as you run.
- **Run stats** — elapsed time, distance, and pace, updated live.
- **Start / Pause / Resume / Finish** controls for a typical ~30 min run.
- **Daily run log** — every saved run is listed on the home screen (newest first)
  with totals across all runs.
- **Run detail view** — tap any run to see its full path with start/finish
  markers and stats.
- **Local storage** — runs are saved on-device with AsyncStorage; no account or
  internet needed.
- Long-press a run in the list to delete it.

## Running the app

```bash
npm install        # if you haven't already
npx expo start
```

Then:
- **iPhone:** install **Expo Go** from the App Store and scan the QR code. Maps
  work out of the box (Apple Maps). Allow location access when prompted.
- **iOS Simulator:** press `i`. Set a route in the simulator via
  *Features ▸ Location ▸ City Run/Freeway Drive* to simulate movement.
- **Android:** see the note below about the Google Maps API key.

> GPS only produces a path when the device is actually moving, so for a real
> route, run the app on a physical phone outdoors.

## Android: Google Maps key

`react-native-maps` uses Google Maps on Android, which requires an API key. Get
one from the Google Cloud Console (enable *Maps SDK for Android*) and paste it
into `app.json`:

```json
"android": { "config": { "googleMaps": { "apiKey": "YOUR_KEY_HERE" } } }
```

iOS uses Apple Maps and needs no key. The list/log and tracking logic work on
both platforms regardless.

## Project structure

```
App.js                     # Navigation (Home → Track → RunDetail)
src/
  screens/
    HomeScreen.js          # Run log + "Start a Run"
    TrackScreen.js         # Live GPS tracking, map, stats, controls
    RunDetailScreen.js     # Saved run path + stats
  storage.js               # AsyncStorage read/write for runs
  geo.js                   # Haversine distance + formatting helpers
  theme.js                 # Colors
```

## Possible next steps

- Background tracking so the path keeps recording when the screen is locked
  (`expo-location` background updates + a foreground service on Android).
- Charts of pace/distance over time; weekly totals.
- Export a run as GPX.
