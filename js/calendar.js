// Calendar agenda for the next seven days, read from data/calendar.json.
// That file is written by tools/fetch_calendar.py (see data/calendar.example.json for the shape).
// The page says when it was last synced, so a stale agenda never passes for a live one.

const CALENDAR_URL = "https://calendar.google.com/calendar/r?authuser=ty2766@nyu.edu";
const DAYS = 7;
const MAX_ROWS = 9;
const STALE_HOURS = 3;
const REFRESH_MS = 60_000;

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const dayKey = (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

function localDate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

// All-day events carry plain dates (end exclusive); timed events carry offsets.
function normalize(raw) {
  if (raw.allDay) return { ...raw, from: localDate(raw.start), to: localDate(raw.end || raw.start) };
  return { ...raw, from: new Date(raw.start), to: new Date(raw.end || raw.start) };
}

function overlapsDay(event, day) {
  const next = addDays(day, 1);
  if (event.allDay) return event.from < next && event.to > day;
  return event.from < next && (event.to > day || event.from >= day);
}

function clock(date) {
  return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }).replace(" ", " ");
}

function dayLabel(day, today) {
  const diff = Math.round((day - today) / 86_400_000);
  const base = day.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  if (diff === 0) return ["Today", base];
  if (diff === 1) return ["Tomorrow", base];
  return [day.toLocaleDateString(undefined, { weekday: "long" }), day.toLocaleDateString(undefined, { month: "short", day: "numeric" })];
}

function eventRow(event, now) {
  const li = el("li", "ev");
  const live = !event.allDay && event.from <= now && now < event.to;
  const past = !event.allDay && event.to <= now;
  if (live) li.classList.add("is-live");
  if (past) li.classList.add("is-past");

  const when = event.allDay ? "All day" : `${clock(event.from)}`;
  const sub = [event.allDay ? null : `until ${clock(event.to)}`, event.location].filter(Boolean).join(" · ");
  const body = el("div", "row-main");
  body.append(el("span", "row-title", event.title));
  if (sub) body.append(el("span", "row-sub", sub));
  li.append(el("span", "ev-time", live ? "Now" : when), body);
  li.title = [event.title, sub].filter(Boolean).join("\n");
  return li;
}

function renderAgenda(events) {
  const box = document.getElementById("agenda");
  const now = new Date();
  const today = startOfDay(now);
  const inWindow = (e) => Array.from({ length: DAYS }, (_, i) => overlapsDay(e, addDays(today, i))).some(Boolean);
  if (!events.some(inWindow)) {
    box.replaceChildren(el("p", "empty", "Nothing on the calendar for the next seven days."));
    return;
  }
  const parts = [];
  let used = 0;
  let hidden = 0;

  for (let i = 0; i < DAYS; i += 1) {
    const day = addDays(today, i);
    const list = events
      .filter((e) => overlapsDay(e, day))
      .sort((a, b) => Number(b.allDay) - Number(a.allDay) || a.from - b.from);
    if (!list.length && i > 0) continue;

    const [name, date] = dayLabel(day, today);
    const section = el("section", "day");
    const head = el("h3", "day-head", name);
    head.append(el("span", null, date));
    section.append(head);

    const rows = el("ul", "events");
    if (!list.length) rows.append(el("li", "empty", "Nothing scheduled."));
    for (const event of list) {
      if (used >= MAX_ROWS) {
        hidden += 1;
        continue;
      }
      rows.append(eventRow(event, now));
      used += 1;
    }
    section.append(rows);
    parts.push(section);
  }

  if (hidden) parts.push(el("p", "more-line", `+${hidden} more this week`));
  box.replaceChildren(...parts);
}

function renderStamp(snapshot) {
  const stamp = document.getElementById("cal-stamp");
  if (!snapshot.generated) return;
  const made = new Date(snapshot.generated.replace(" ", "T"));
  const hours = (Date.now() - made.getTime()) / 3_600_000;
  const when = made.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  const late = hours > STALE_HOURS;
  stamp.textContent = late
    ? `Last synced ${when}. The calendar job has stopped, or this is a one-off snapshot.`
    : `Synced ${when}${snapshot.live ? "" : " (snapshot)"}`;
  stamp.classList.toggle("warn", late);
}

async function loadAndRender() {
  const box = document.getElementById("agenda");
  try {
    const response = await fetch("data/calendar.json", { cache: "no-store" });
    if (!response.ok) throw new Error("missing");
    const snapshot = await response.json();
    renderAgenda((snapshot.events || []).map(normalize));
    renderStamp(snapshot);
  } catch {
    box.replaceChildren(
      el("p", "empty", "No calendar data yet. Run tools/fetch_calendar.py --auth once, or copy data/calendar.example.json to data/calendar.json."),
    );
  }
}

export async function initCalendar() {
  const link = document.getElementById("cal-open");
  if (link) {
    link.href = CALENDAR_URL;
    link.target = "_blank";
    link.rel = "noopener";
  }
  await loadAndRender();
  // Live: the fetch job rewrites data/calendar.json every 10 minutes; re-read it every minute
  // and whenever the tab comes back into view, so "Now" and the day boundaries stay right too.
  setInterval(loadAndRender, REFRESH_MS);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) loadAndRender();
  });
}
