# Dashboard

A private new tab page for Chrome. Tasks, a focus timer, upcoming deadlines,
an application pipeline, and quick links. No framework, no network calls,
no accounts. Everything stays in the browser.

## Install

1. Generate the personal data module (see below).
2. Open `chrome://extensions`, turn on **Developer mode**, click **Load unpacked**, and select this folder.
3. Open a new tab.

## Personal data

`js/data.js` is generated and gitignored, since it holds application and
deadline details.

```sh
python3 tools/build_data.py
```

By default this reads `~/Documents/SecondBrain/Applications/applications.csv`
and `data/deadlines.json`. Pass `--csv` or `--deadlines` to override them.

Deadlines are maintained by hand in `data/deadlines.json`. Start from
`data/deadlines.example.json`. Rerun the build after any change, then reload
the extension.

Free-text statuses in the CSV are mapped to five buckets (applied,
assessment, selected, rejected, and other or closed). The mapping is in
`tools/build_data.py` and covered by `tools/test_build_data.py`.

## Develop

```sh
python3 -m unittest tools/test_build_data.py
python3 -m http.server 8000   # then open http://localhost:8000/newtab.html
```

Opened as a plain page, the storage layer falls back to `localStorage`, so
tasks, timer state, and links still persist.

## Layout

| Path | Purpose |
|---|---|
| `manifest.json` | MV3 manifest, overrides the new tab, requests `storage` only |
| `newtab.html`, `styles.css` | Page shell and design tokens (dark default, light via system setting) |
| `js/app.js` | Clock, greeting, keyboard shortcuts, module wiring |
| `js/tasks.js` | Task list, persisted in `chrome.storage.local` |
| `js/timer.js` | Pomodoro. Stores an end timestamp, so it stays accurate across reloads |
| `js/panels.js` | Deadlines, pipeline, and quick links |
| `js/store.js` | Storage with a `localStorage` fallback |
| `tools/build_data.py` | Turns the CSV and deadline list into `js/data.js` |

## Keyboard

- `/` focus the task input
- `Space` start or pause the timer
- `R` reset the timer

## Privacy

The extension requests only the `storage` permission and makes no network
requests. Links open only when you click them.
