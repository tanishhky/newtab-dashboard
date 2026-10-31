// Deadlines, front and centre: the four nearest as tiles with a large countdown, the rest as
// a single "Later" line. Data is DATA.deadlines (data/deadlines.json via tools/build_data.py).

const TILES = 4;
const LATER = 4;

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function parse(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function daysUntil(iso) {
  const now = new Date();
  return Math.round((parse(iso) - new Date(now.getFullYear(), now.getMonth(), now.getDate())) / 86_400_000);
}

// [big text, small text]
function countdown(days) {
  if (days === 0) return ["Today", ""];
  if (days === 1) return ["Tomorrow", ""];
  return [String(days), "days"];
}

function urgency(days) {
  if (days <= 3) return "is-hot";
  if (days <= 7) return "is-soon";
  return "";
}

const shortDate = (iso) => parse(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });

function tile(item) {
  const days = daysUntil(item.date);
  const [big, unit] = countdown(days);
  const li = el("li", `dl-tile ${urgency(days)}`.trim());
  const count = el("div", "dl-count");
  count.append(el("span", `dl-num${unit ? "" : " is-word"}`, big));
  if (unit) count.append(el("span", "dl-unit", unit));
  const when = [parse(item.date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }), item.time]
    .filter(Boolean)
    .join(" · ");
  const body = el("div", "dl-body");
  body.append(el("span", "dl-title", item.title), el("span", "dl-when", when));
  if (item.note) body.append(el("span", "dl-note", item.note));
  li.append(count, body);
  li.title = [item.title, when, item.note].filter(Boolean).join("\n");
  return li;
}

export async function initDeadlines() {
  const tiles = document.getElementById("deadline-tiles");
  const later = document.getElementById("deadline-later");
  const meta = document.getElementById("dl-meta");
  let items = [];
  try {
    items = (await import("./data.js")).DATA?.deadlines ?? [];
  } catch {
    items = [];
  }
  const upcoming = items.filter((item) => daysUntil(item.date) >= 0);
  if (!upcoming.length) {
    tiles.replaceChildren(el("li", "empty", "No upcoming deadlines."));
    return;
  }
  tiles.replaceChildren(...upcoming.slice(0, TILES).map(tile));
  meta.textContent = `${upcoming.length} ahead`;

  const rest = upcoming.slice(TILES, TILES + LATER);
  if (rest.length) {
    const more = upcoming.length - TILES - rest.length;
    later.replaceChildren(
      el("span", "dl-later-label", "Later"),
      ...rest.map((item) => {
        const chip = el("span", "dl-later-item");
        chip.append(el("strong", null, item.title), ` ${shortDate(item.date)}`);
        return chip;
      }),
      ...(more > 0 ? [el("span", "dl-later-item", `+${more} more`)] : []),
    );
    later.hidden = false;
  }
}
