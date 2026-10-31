# Dashboard

A private, minimal new tab page for Chrome: Job Hunt, a seven-day calendar agenda, deadlines, practice links and quick links. No framework, no accounts, no tracking, no extension permissions. Everything runs locally.

## Install

1. Generate the personal data (see below).
2. Open `chrome://extensions`, turn on **Developer mode**, click **Load unpacked**, and select this folder.
3. In the extension's **Details**, turn on **Allow access to file URLs**. The job dashboard and the PDFs are local files, and Chrome only lets an extension open them with this on. The page explains this and links to the setting if it is off.
4. Open a new tab.

## Personal data (all gitignored)

| File | What it holds | How it is made |
|---|---|---|
| `js/data.js` | application log, deadlines, job summary | `python3 tools/build_data.py`; `Applications/build_dashboard.py` runs it on every rebuild |
| `data/deadlines.json` | deadlines | by hand; start from `data/deadlines.example.json` |
| `data/calendar.json` | a snapshot of the next few weeks of calendar events | filled by Claude from Google Calendar, or by hand; shape in `data/calendar.example.json` |

The calendar card prints how old the snapshot is and warns after two days. It is not live. For a live agenda the options are an iCal secret address (if the Workspace allows it) or a small OAuth script.

## Design

- Dark indigo field with three slow-drifting colour clouds and fine grain (CSS only, no images).
- Panels are tinted glass: dark base, strong colour wash, blurred backdrop, hairline edge. Each card family owns one hue (`--t` in `styles.css`).
- One accent colour (gold) for the primary action and the "now" marker.
- Left column: Job Hunt, Practice, Quick links. Right column: Calendar, Deadlines.

## Layout

| Path | Purpose |
|---|---|
| `newtab.html`, `styles.css` | page and design system |
| `js/app.js` | greeting, clock, `J` shortcut, wiring |
| `js/jobs.js` | Job Hunt: counts, in motion, ready to submit, deep links into the job dashboard |
| `js/calendar.js` | agenda from `data/calendar.json` |
| `js/deadlines.js` | upcoming deadlines |
| `js/links.js` | Practice tiles and Quick links (edit the two lists at the top) |
| `js/open.js` | opening web and `file://` links, with the file-access hint |
| `js/sky.js`, `icons/jobhunt.svg` | not used by this page; `Applications/build_dashboard.py` inlines them into the job dashboard |
| `tools/build_data.py` | builds `js/data.js` |

## Develop

```sh
python3 -m unittest tools/test_build_data.py
python3 -m http.server 8000   # then open http://localhost:8000/newtab.html
```

## Keyboard

`J` opens the job dashboard in this tab (`Shift+J` or Cmd-click for a new tab).

The earlier Interstellar version (timer, tasks, inbox, soundscape) is on the `interstellar-current` branch.
