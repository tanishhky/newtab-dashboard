// Read-only panels built from the generated data module: deadlines,
// application pipeline, and quick links.

import { DATA } from "./data.js";
import { load, save } from "./store.js";

const DEFAULT_LINKS = [
  { label: "Gmail", url: "https://mail.google.com/mail/", google: true },
  { label: "Calendar", url: "https://calendar.google.com/calendar/", google: true },
  { label: "Todoist", url: "https://app.todoist.com" },
  { label: "GitHub", url: "https://github.com/tanishhky" },
];

const BUCKET_ORDER = [
  ["applied", "Applied"],
  ["assessment", "Assessment"],
  ["selected", "Selected"],
  ["rejected", "Rejected"],
];

const LINKS_KEY = "links";
const ACCOUNTS_KEY = "accounts";
const ACTIVE_ACCOUNT_KEY = "activeAccount";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const MS_PER_DAY = 86_400_000;

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
  const upcoming = DATA.deadlines.filter((d) => daysUntil(d.date) >= 0).slice(0, 6);

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
  empty.hidden = upcoming.length > 0;
}

// Pipeline

function renderPipeline() {
  const apps = DATA.applications;
  const counts = Object.fromEntries(apps.map((a) => [a.bucket, 0]));
  apps.forEach((a) => (counts[a.bucket] = (counts[a.bucket] ?? 0) + 1));

  const stats = document.getElementById("pipeline-stats");
  stats.replaceChildren(
    ...BUCKET_ORDER.map(([key, label]) => {
      const wrap = el("div", "stat");
      wrap.append(el("dt", null, label), el("dd", null, String(counts[key] ?? 0)));
      return wrap;
    }),
  );

  document.getElementById("pipeline-total").textContent = `${apps.length} logged`;

  const recent = document.getElementById("pipeline-recent");
  recent.replaceChildren(
    ...apps.slice(0, 6).map((a) => {
      const li = el("li");
      const body = el("div");
      body.style.minWidth = "0";
      body.append(el("span", "app-company", a.company));
      body.append(el("span", "app-role", a.role || "Role not recorded"));
      const pill = el("span", `pill ${a.bucket}`, a.status || "Logged");
      li.append(el("span"), body, pill);
      return li;
    }),
  );
}

// Links

// Google services take ?authuser=<email> to open the chosen account directly.
// Without it, Google falls back to whichever account is first signed in.
function resolveUrl(link, account) {
  if (!link.google || !account) return link.url;
  const url = new URL(link.url);
  url.searchParams.set("authuser", account);
  return url.href;
}

async function renderLinks() {
  const grid = document.getElementById("link-grid");
  const links = await load(LINKS_KEY, DEFAULT_LINKS);
  const account = await load(ACTIVE_ACCOUNT_KEY, null);

  grid.replaceChildren(
    ...links.map((link, index) => {
      const li = el("li");
      const anchor = el("a", "link-tile");
      anchor.href = resolveUrl(link, account);
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

// Account picker

async function renderAccounts() {
  const select = document.getElementById("account-select");
  const remove = document.getElementById("account-remove");
  const accounts = await load(ACCOUNTS_KEY, []);
  const active = await load(ACTIVE_ACCOUNT_KEY, null);

  const placeholder = new Option("Default (first signed-in account)", "");
  select.replaceChildren(
    placeholder,
    ...accounts.map((email) => new Option(email, email, false, email === active)),
  );
  select.value = active && accounts.includes(active) ? active : "";
  remove.disabled = !select.value;
}

export function initPanels() {
  renderDeadlines();
  renderPipeline();
  renderLinks();
  renderAccounts();

  document.getElementById("account-select").addEventListener("change", async (event) => {
    await save(ACTIVE_ACCOUNT_KEY, event.target.value || null);
    renderAccounts();
    renderLinks();
  });

  document.getElementById("account-remove").addEventListener("click", async () => {
    const select = document.getElementById("account-select");
    const accounts = (await load(ACCOUNTS_KEY, [])).filter((email) => email !== select.value);
    await save(ACCOUNTS_KEY, accounts);
    await save(ACTIVE_ACCOUNT_KEY, null);
    renderAccounts();
    renderLinks();
  });

  document.getElementById("account-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const input = document.getElementById("account-email");
    const email = input.value.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(email)) {
      input.setCustomValidity("Enter a valid email address");
      input.reportValidity();
      return;
    }
    input.setCustomValidity("");
    const accounts = await load(ACCOUNTS_KEY, []);
    if (!accounts.includes(email)) await save(ACCOUNTS_KEY, [...accounts, email]);
    await save(ACTIVE_ACCOUNT_KEY, email);
    event.target.reset();
    renderAccounts();
    renderLinks();
  });

  document.getElementById("link-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const label = document.getElementById("link-label").value.trim();
    const url = safeUrl(document.getElementById("link-url").value);
    if (!label || !url) return;
    const links = await load(LINKS_KEY, DEFAULT_LINKS);
    await save(LINKS_KEY, [...links, { label, url }].slice(0, 12));
    event.target.reset();
    renderLinks();
  });
}
