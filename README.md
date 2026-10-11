# Dashboard

A private new tab page for Chrome. Tasks, an Endurance focus timer with Miller dilation metrics, upcoming deadlines, an application pipeline, quick links, and an atmospheric spacetime soundscape. No framework, no accounts, no tracking. Everything runs locally in the browser.

## Install

1. Generate the personal data module (see below).
2. Open `chrome://extensions`, turn on **Developer mode**, click **Load unpacked**, and select this folder.
3. Open a new tab.

## Personal data

`js/data.js` is generated and gitignored, since it holds application and deadline details. If not yet generated, the page boots gracefully with an empty fallback state.

```sh
python3 tools/build_data.py
```

By default this reads `~/Documents/SecondBrain/Applications/applications.csv` and `data/deadlines.json`. Pass `--csv` or `--deadlines` to override them.

Deadlines are maintained by hand in `data/deadlines.json`. Start from `data/deadlines.example.json`. Rerun the build after any change, then reload the extension.

Free-text statuses in the CSV are mapped to pipeline buckets (applied, assessment, ready, selected, rejected, and closed). The mapping is in `tools/build_data.py` and covered by `tools/test_build_data.py`.

## Develop

```sh
python3 -m unittest tools/test_build_data.py
python3 -m http.server 8000   # then open http://localhost:8000/newtab.html
```

Opened as a plain page, the storage layer falls back to `localStorage`, so tasks, timer state, and links still persist.

## Layout

| Path | Purpose |
|---|---|
| `manifest.json` | MV3 manifest, overrides the new tab, requests `storage` only |
| `newtab.html`, `styles.css` | 12-column balanced glass grid and Interstellar spacetime design |
| `js/app.js` | Dual UTC clock, Sol day telemetry, quote ticker, shortcuts |
| `js/canvas.js` | Procedural Starfield and Gargantua gravitational lens canvas |
| `js/ambient.js` | Web Audio API Miller's Planet tick and Cosmic Drone synthesizer |
| `js/spotify.js` | Spotify atmospheric presets and focus sound controls |
| `js/timer.js` | Endurance 12-module ring timer with Miller time dilation metrics |
| `js/tasks.js` | Task list, persisted in `chrome.storage.local` |
| `js/panels.js` | Deadlines, 4-bucket application pipeline, and quick links |
| `js/store.js` | Storage with a `localStorage` fallback |
| `tools/build_data.py` | Turns the CSV and deadline list into `js/data.js` |

## Keyboard Shortcuts

- `/` focus the task input
- `Space` start or pause the timer
- `R` reset the timer
- `M` cycle focus audio mode (Off, Miller's Tick, Cosmic Drone)
- `B` cycle cosmos visual mode (Gargantua, Starfield, Void Off)

## Spacetime and Atmosphere Features

- **Gargantua Accretion Canvas:** Interactive relativistic gravitational lens and starfield canvas with subtle mouse parallax, pausing automatically on hidden tabs to preserve battery.
- **Miller's Planet Tick:** Synthesized 1.25s mechanical cadence (where every tick represents one Earth day) via Web Audio API.
- **Cosmic Drone:** Deep space binaural ambient hum for focus sessions.
- **Endurance Ring:** 12 orbital station module indicators tracking progress around the 25-minute Pomodoro cycle.
- **Dual Telemetry:** Precision local time plus UTC Zulu time, and Sol day of year counter.

## Privacy

The extension requests only the `storage` permission and makes no tracking or telemetry calls. Everything stays private in your browser.
