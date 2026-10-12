# Dashboard

A private new tab page for Chrome. Tasks, an Endurance focus timer with Miller dilation metrics, a Job Hunt card with a one-key jump into the job dashboard, upcoming deadlines, quick links, and an atmospheric spacetime soundscape. No framework, no accounts, no tracking. Everything runs locally in the browser.

## Install

1. Generate the personal data module (see below).
2. Open `chrome://extensions`, turn on **Developer mode**, click **Load unpacked**, and select this folder.
3. In the extension's **Details**, turn on **Allow access to file URLs**. The job dashboard is a local file, and Chrome only lets an extension open `file://` pages with this on. The Job Hunt card explains this and links to the setting if it is off.
4. Open a new tab.

## Personal data

`js/data.js` is generated and gitignored, since it holds application and deadline details. If not yet generated, the page boots gracefully with an empty fallback state.

```sh
python3 tools/build_data.py
```

By default this reads `~/Documents/SecondBrain/Applications/applications.csv`, `data/deadlines.json` and the job dashboard's `Applications/dashboard-summary.json`. Pass `--csv`, `--deadlines` or `--summary` to override them.

You rarely need to run it by hand: `Applications/build_dashboard.py` calls it after every dashboard rebuild (the daily 7:30 AM job, `/email-sync`, and `scripts/app_status.py`), so the new tab picks up fresh numbers on its next open without reloading the extension.

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
| `manifest.json` | MV3 manifest, overrides the new tab, requests `storage` and `tabs` plus Gmail host access |
| `newtab.html`, `styles.css` | 12-column balanced glass grid and Interstellar spacetime design |
| `js/app.js` | Dual UTC clock, Sol day telemetry, quote ticker, shortcuts |
| `js/sky.js` | Static sky painted once at screen resolution: seeded starfield and a stylised Gargantua. Also inlined into the job dashboard |
| `js/backdrop.js` | Sky mode switcher (Gargantua, Deep Field, Void) |
| `icons/` | `gargantua.svg` (tab icon, PNGs for the extension icon) and `jobhunt.svg` (Job Hunt launcher, also the job dashboard's tab icon and sidebar mark) |
| `js/ambient.js` | Web Audio API Miller's Planet tick and Cosmic Drone synthesizer |
| `js/spotify.js` | Spotify atmospheric presets and focus sound controls |
| `js/timer.js` | Endurance 12-module ring timer with Miller time dilation metrics |
| `js/tasks.js` | Task list, persisted in `chrome.storage.local` |
| `js/jobs.js` | Job Hunt launcher and card: today's counts, next actions, deep links into the dashboard |
| `js/prep.js` | Assessment Prep card: quant-test study list with a time budget and purpose behind each item's info button, tick marks kept in `chrome.storage.local` |
| `js/panels.js` | Deadlines and quick links |
| `js/store.js` | Storage with a `localStorage` fallback |
| `tools/build_data.py` | Turns the CSV and deadline list into `js/data.js` |

## Keyboard Shortcuts

- `/` focus the task input
- `Space` start or pause the timer
- `R` reset the timer
- `M` cycle focus audio mode (Off, Miller's Tick, Cosmic Drone)
- `B` cycle the sky (Gargantua, Deep Field, Void)
- `J` open the job dashboard in this tab (`Shift+J` or Cmd-click for a new tab)

## Spacetime and Atmosphere Features

- **Static Gargantua sky:** a seeded starfield, faint galactic band and a stylised Gargantua (shadow, photon ring, lensed and Doppler-beamed disk) painted once in about 16 ms. No image assets and no animation loop; it repaints only on resize, and every tab shows the same sky.
- **Miller's Planet Tick:** Synthesized 1.25s mechanical cadence (where every tick represents one Earth day) via Web Audio API.
- **Cosmic Drone:** Deep space binaural ambient hum for focus sessions.
- **Endurance Ring:** 12 orbital station module indicators tracking progress around the 25-minute Pomodoro cycle.
- **Dual Telemetry:** Precision local time plus UTC Zulu time, and Sol day of year counter.

## Privacy

The extension requests `storage` and `tabs`, plus host access to `mail.google.com` for the live inbox, and makes no tracking or telemetry calls. Everything stays private in your browser.
