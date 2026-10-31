# Home

A private, minimal new tab page for Chrome: deadlines, Job Hunt, a seven-day calendar agenda, a library of practice and thesis artifacts, assessment prep and quick links. No framework, no accounts, no tracking, no extension permissions. Everything runs locally.

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

- **Palette:** deep violet and midnight blue with soft wine and gold light behind glass, ivory text, and one metal (muted gold) for accents, hairline edges and the primary action.
- **Type:** Didot (Bodoni 72 and Baskerville as fallbacks, all built into macOS) for display only: greeting, clock, card titles and large numerals. Everything you read is SF Pro. Labels are small tracked capitals.
- **Panels:** tinted glass. Each card family owns one hue (`--t` in `styles.css`); the edge is a gold hairline.
- **One tile language:** deadlines, calendar events, job rows and library entries are all bounded rounded rectangles, so every item has a visible edge. Calendar events carry a colour bar by source (NYU blue, personal rose, TA gold).
- **Hierarchy:** Deadlines first and largest (the closer the date, the brighter the tile), then Job Hunt beside Calendar, then Library, Assessment prep and Quick links.

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
