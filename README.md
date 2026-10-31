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
| `data/calendar.json` | the next two weeks of events from every calendar the account can see | `tools/fetch_calendar.py`; shape in `data/calendar.example.json` |

### Live calendar

`tools/fetch_calendar.py` reads every calendar on your Google account (NYU calendars shared to it included), lets Google expand recurring events, and rewrites `data/calendar.json`. The page re-reads that file every minute, so the agenda follows the account with at most a ten-minute lag. It uses the same Google OAuth client as `scripts/linkedin_leads.py` with the read-only calendar scope (the Calendar API must be enabled in that Google Cloud project).

```sh
PY=~/Documents/SecondBrain/scripts/.venv/bin/python
$PY tools/fetch_calendar.py --auth     # once; sign in with the tanishhky account
$PY tools/fetch_calendar.py            # writes data/calendar.json
cp tools/com.tanishk.newtab-calendar.plist ~/Library/LaunchAgents/
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.tanishk.newtab-calendar.plist
```

The job runs every ten minutes. Like the other agents, it needs Full Disk Access on the python binary to read `~/Documents`; logs go to `~/Library/Logs/com.tanishk.newtab-calendar.*`. The calendar card says when it last synced and warns after three hours.

## Design

- Dark indigo field with three slow-drifting colour clouds and fine grain (CSS only, no images).
- Panels are tinted glass: dark base, strong colour wash, blurred backdrop, hairline edge. Each card family owns one hue (`--t` in `styles.css`).
- One accent colour (gold) for the primary action and the "now" marker.
- Left column: Job Hunt, Library (practice, thesis and capstone, job-search artifacts and books). Right column: Calendar, Deadlines, Quick links. Full width below: Assessment prep (study list with time budgets, tick marks kept in `localStorage`).

## Layout

| Path | Purpose |
|---|---|
| `newtab.html`, `styles.css` | page and design system |
| `js/app.js` | greeting, clock, `J` shortcut, wiring |
| `js/jobs.js` | Job Hunt: counts, in motion, ready to submit, deep links into the job dashboard |
| `js/calendar.js` | agenda from `data/calendar.json`, refreshed every minute |
| `js/deadlines.js` | upcoming deadlines |
| `js/prep.js` | Assessment prep card |
| `js/links.js` | Library tiles and Quick links (edit the two lists at the top) |
| `tools/fetch_calendar.py` | live calendar fetch, with `test_fetch_calendar.py` and a launchd plist |
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
