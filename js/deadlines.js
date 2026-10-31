// Upcoming deadlines from DATA.deadlines (data/deadlines.json via tools/build_data.py).

const MAX_ITEMS = 6;

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function daysUntil(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((new Date(y, m - 1, d) - today) / 86_400_000);
}

function countdown(days) {
  if (days === 0) return ["Today", "tag-hot"];
  if (days === 1) return ["Tomorrow", "tag-hot"];
  if (days <= 3) return [`${days} days`, "tag-hot"];
  if (days <= 7) return [`${days} days`, "tag-warm"];
  return [`${days} days`, "tag-quiet"];
}

export async function initDeadlines() {
  const list = document.getElementById("deadline-list");
  let items = [];
  try {
    items = (await import("./data.js")).DATA?.deadlines ?? [];
  } catch {
    items = [];
  }
  const upcoming = items.filter((item) => daysUntil(item.date) >= 0).slice(0, MAX_ITEMS);
  if (!upcoming.length) {
    list.replaceChildren(el("li", "empty", "No upcoming deadlines."));
    return;
  }
  list.replaceChildren(
    ...upcoming.map((item) => {
      const [y, m, d] = item.date.split("-").map(Number);
      const date = new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
      const sub = [date, item.time, item.note].filter(Boolean).join(" · ");
      const [text, cls] = countdown(daysUntil(item.date));
      const li = el("li", "row");
      const body = el("div", "row-main");
      body.append(el("span", "row-title", item.title), el("span", "row-sub", sub));
      li.append(body, el("span", `tag ${cls}`, text));
      li.title = `${item.title}\n${sub}`;
      return li;
    }),
  );
}
