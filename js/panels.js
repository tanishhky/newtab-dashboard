// Read-only panels: deadlines, application pipeline, and quick links.
// Resilient to missing data.js: falls back to empty state with a build tip.

import { load, save } from "./store.js";

const DEFAULT_LINKS = [
  { label: "Gmail", url: "https://mail.google.com" },
  { label: "Calendar", url: "https://calendar.google.com" },
  { label: "Todoist", url: "https://app.todoist.com" },
  { label: "GitHub", url: "https://github.com/tanishhky" },
  { label: "Brightspace", url: "https://brightspace.nyu.edu" },
  { label: "Overleaf", url: "https://www.overleaf.com/project" },
  { label: "WRDS", url: "https://wrds-www.wharton.upenn.edu" },
  { label: "SSRN", url: "https://hq.ssrn.com" },
];

const BUCKET_ORDER = [
  ["applied", "Applied"],
  ["assessment", "Assessment"],
  ["ready", "Resume Ready"],
  ["rejected", "Rejected"],
];

const LINKS_KEY = "links";
const MS_PER_DAY = 86_400_000;

let dataset = { applications: [], deadlines: [] };

function startOfToday() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function daysUntil(isoDate) {
  const [y, m, d] = isoDate.split("-").map(Number);
  const target = new Date(y, m - 1, d);
  return Math.round((target - startOfToday()) / MS_PER_DAY);
}

function countdownLabel(days) {
  if (days < 0) return { text: "Passed", cls: "" };
  if (days === 0) return { text: "Today", cls: "today" };
  if (days === 1) return { text: "Tomorrow", cls: "soon" };
  if (days <= 7) return { text: `${days} days`, cls: "soon" };
  return { text: `${days} days`, cls: "" };
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

// Deadlines

function renderDeadlines() {
  const list = document.getElementById("deadline-list");
  const empty = document.getElementById("deadline-empty");
  if (!list) return;

  const upcoming = (dataset.deadlines || []).filter((d) => daysUntil(d.date) >= 0).slice(0, 6);

  list.replaceChildren(
    ...upcoming.map((d) => {
      const li = el("li");
      const body = el("div");
      body.style.minWidth = "0";
      body.append(el("span", "deadline-title", d.title));
      const meta = [new Date(`${d.date}T00:00`).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })];
      if (d.time) meta.push(d.time);
      if (d.note) meta.push(d.note);
      body.append(el("span", "deadline-note", meta.join(" · ")));

      const { text, cls } = countdownLabel(daysUntil(d.date));
      const badge = el("span", `countdown ${cls}`.trim(), text);
      li.append(el("span"), body, badge);
      return li;
    }),
  );
  if (empty) empty.hidden = upcoming.length > 0;
}

// Pipeline

function renderPipeline() {
  const apps = dataset.applications || [];
  const counts = Object.fromEntries(apps.map((a) => [a.bucket, 0]));
  apps.forEach((a) => (counts[a.bucket] = (counts[a.bucket] ?? 0) + 1));

  const stats = document.getElementById("pipeline-stats");
  if (stats) {
    stats.replaceChildren(
      ...BUCKET_ORDER.map(([key, label]) => {
        const wrap = el("div", "stat");
        wrap.append(el("dt", null, label), el("dd", null, String(counts[key] ?? 0)));
        return wrap;
      }),
    );
  }

  const totalEl = document.getElementById("pipeline-total");
  if (totalEl) totalEl.textContent = `${apps.length} logged`;

  const recent = document.getElementById("pipeline-recent");
  if (!recent) return;

  recent.replaceChildren(
    ...apps.slice(0, 6).map((a) => {
      const li = el("li");
      const body = el("div");
      body.style.minWidth = "0";
      body.append(el("span", "app-company", a.company));

      const subLine = el("div", "app-sub");
      subLine.append(el("span", "app-role", a.role || "Role not recorded"));
      if (a.date) {
        subLine.append(el("span", "app-date", a.date));
      }
      body.append(subLine);

      const pill = el("span", `pill ${a.bucket}`, a.status || "Logged");
      li.append(el("span"), body, pill);
      return li;
    }),
  );
}

// Links

async function renderLinks() {
  const grid = document.getElementById("link-grid");
  if (!grid) return;
  const links = await load(LINKS_KEY, DEFAULT_LINKS);

  grid.replaceChildren(
    ...links.map((link, index) => {
      const li = el("li");
      const anchor = el("a", "link-tile");
      anchor.href = link.url;
      anchor.rel = "noopener noreferrer";
      anchor.append(el("span", null, link.label));
      const remove = el("button", "link-remove", "×");
      remove.type = "button";
      remove.setAttribute("aria-label", `Remove ${link.label}`);
      remove.addEventListener("click", async (event) => {
        event.preventDefault();
        const next = links.filter((_, i) => i !== index);
        await save(LINKS_KEY, next);
        renderLinks();
      });
      anchor.append(remove);
      li.append(anchor);
      return li;
    }),
  );
}

function safeUrl(raw) {
  try {
    const url = new URL(raw.trim());
    return ["http:", "https:"].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

export async function initPanels() {
  // Graceful dynamic import of generated data.js
  try {
    const dataMod = await import("./data.js");
    if (dataMod && dataMod.DATA) {
      dataset = dataMod.DATA;
    }
  } catch {
    // If data.js has not been built yet, dataset stays empty without crashing app.js
  }

  renderDeadlines();
  renderPipeline();
  await renderLinks();

  const linkForm = document.getElementById("link-form");
  if (linkForm) {
    linkForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const label = document.getElementById("link-label").value.trim();
      const url = safeUrl(document.getElementById("link-url").value);
      if (!label || !url) return;
      const links = await load(LINKS_KEY, DEFAULT_LINKS);
      await save(LINKS_KEY, [...links, { label, url }].slice(0, 16));
      event.target.reset();
      renderLinks();
    });
  }
}
