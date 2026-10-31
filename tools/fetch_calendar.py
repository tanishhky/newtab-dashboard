"""Fetch the next two weeks of Google Calendar events into data/calendar.json.

The new tab page re-reads that file every minute, so running this on a timer
(tools/com.tanishk.newtab-calendar.plist, every 10 minutes) keeps the agenda live.
It reads every calendar the signed-in account can see, including NYU calendars
shared to it, and Google expands recurring events so classes arrive one by one.

One-time sign-in (opens a browser; choose the tanishhky account):
    SecondBrain/scripts/.venv/bin/python tools/fetch_calendar.py --auth

Then:
    SecondBrain/scripts/.venv/bin/python tools/fetch_calendar.py

It uses the Google OAuth client that scripts/linkedin_leads.py already uses
(scripts/credentials.json) with the read-only calendar scope. Override with
--client-secret. The token is kept in tools/.calendar_token.json (gitignored).
"""

import argparse
import json
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_CLIENT = ROOT.parent.parent / "scripts" / "credentials.json"
DEFAULT_TOKEN = ROOT / "tools" / ".calendar_token.json"
DEFAULT_OUT = ROOT / "data" / "calendar.json"
SCOPES = ["https://www.googleapis.com/auth/calendar.readonly"]

# Calendars that only add noise to an agenda.
SKIP_ID_PARTS = ("#holiday@", "#contacts@", "#weeknum@")


def wanted_calendar(entry: dict) -> bool:
    if not entry.get("selected", False):
        return False
    return not any(part in entry.get("id", "") for part in SKIP_ID_PARTS)


def normalize(item: dict, calendar_name: str) -> dict | None:
    """Turn one Calendar API event into the page's shape, or None if it should not show."""
    if item.get("status") == "cancelled":
        return None
    me = next((a for a in item.get("attendees", []) if a.get("self")), None)
    if me and me.get("responseStatus") == "declined":
        return None
    start, end = item.get("start", {}), item.get("end", {})
    out = {"title": (item.get("summary") or "(no title)").replace("—", "-").replace("–", "-")}
    if "date" in start:
        out.update({"start": start["date"], "end": end.get("date", start["date"]), "allDay": True})
    elif "dateTime" in start:
        out.update({"start": start["dateTime"], "end": end.get("dateTime", start["dateTime"])})
    else:
        return None
    if item.get("location"):
        out["location"] = item["location"].split("\n")[0]
    out["calendar"] = calendar_name
    out["_uid"] = item.get("iCalUID") or item.get("id")
    return out


def merge(per_calendar: list[tuple[str, list[dict]]]) -> list[dict]:
    """Normalize every calendar's events, dropping the same event seen on two calendars."""
    seen, events = set(), []
    for name, items in per_calendar:
        for item in items:
            event = normalize(item, name)
            if not event:
                continue
            key = (event.pop("_uid"), event["start"])
            if key in seen:
                continue
            seen.add(key)
            events.append(event)
    events.sort(key=lambda e: (e["start"][:10], not e.get("allDay", False), e["start"]))
    return events


def service(client_secret: Path, token_path: Path, interactive: bool):
    from google.auth.transport.requests import Request
    from google.oauth2.credentials import Credentials
    from googleapiclient.discovery import build

    creds = None
    if token_path.exists():
        creds = Credentials.from_authorized_user_file(str(token_path), SCOPES)
    if creds and creds.expired and creds.refresh_token:
        creds.refresh(Request())
        token_path.write_text(creds.to_json())
    if not creds or not creds.valid:
        if not interactive:
            sys.exit(f"Calendar not authorized yet. Run: {sys.executable} {Path(__file__).resolve()} --auth")
        from google_auth_oauthlib.flow import InstalledAppFlow

        flow = InstalledAppFlow.from_client_secrets_file(str(client_secret), SCOPES)
        creds = flow.run_local_server(port=0, prompt="consent")
        token_path.write_text(creds.to_json())
        token_path.chmod(0o600)
    return build("calendar", "v3", credentials=creds, cache_discovery=False)


def fetch(svc, days: int) -> list[dict]:
    now = datetime.now(timezone.utc)
    window = {
        "timeMin": (now - timedelta(hours=12)).isoformat(),
        "timeMax": (now + timedelta(days=days)).isoformat(),
        "singleEvents": True,
        "orderBy": "startTime",
        "maxResults": 250,
    }
    calendars = svc.calendarList().list().execute().get("items", [])
    per_calendar = []
    for entry in filter(wanted_calendar, calendars):
        name = entry.get("summaryOverride") or entry.get("summary") or entry["id"]
        items = svc.events().list(calendarId=entry["id"], **window).execute().get("items", [])
        per_calendar.append((name, items))
    return merge(per_calendar)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--auth", action="store_true", help="sign in once (opens a browser)")
    parser.add_argument("--days", type=int, default=14)
    parser.add_argument("--client-secret", type=Path, default=DEFAULT_CLIENT)
    parser.add_argument("--token", type=Path, default=DEFAULT_TOKEN)
    parser.add_argument("--out", type=Path, default=DEFAULT_OUT)
    args = parser.parse_args()

    svc = service(args.client_secret, args.token, interactive=args.auth)
    events = fetch(svc, args.days)
    args.out.parent.mkdir(parents=True, exist_ok=True)
    tmp = args.out.with_suffix(".json.tmp")
    tmp.write_text(
        json.dumps({"generated": datetime.now().strftime("%Y-%m-%d %H:%M"), "live": True, "events": events}, indent=1),
        encoding="utf-8",
    )
    tmp.replace(args.out)
    print(f"wrote {args.out}: {len(events)} events")


if __name__ == "__main__":
    main()
