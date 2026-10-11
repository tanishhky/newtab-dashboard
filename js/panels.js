// Read-only panels: deadlines, application pipeline, and quick links.
// Resilient to missing data.js: falls back to empty state with a build tip.

import { load, save } from "./store.js";

const DEFAULT_LINKS = [
  { label: "Gmail", url: "https://mail.google.com/mail/", google: true },
  { label: "Calendar", url: "https://calendar.google.com/calendar/", google: true },
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
const ACCOUNTS_KEY = "accounts";
const ACTIVE_ACCOUNT_KEY = "activeAccount";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
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

function getBrandLogo(link) {
  const url = (link.url || "").toLowerCase();
  const label = (link.label || "").toLowerCase();

  if (url.includes("mail.google.com") || label.includes("gmail") || label.includes("mail")) {
    return `<svg class="brand-logo" viewBox="0 0 24 24" width="26" height="26"><path fill="#EA4335" d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>`;
  }
  if (url.includes("calendar.google.com") || label.includes("calendar")) {
    return `<svg class="brand-logo" viewBox="0 0 24 24" width="26" height="26"><path fill="#4285F4" d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z"/><path fill="#1A73E8" d="M11 12H9v2h2v-2zm4 0h-2v2h2v-2zm-4 4H9v2h2v-2zm4 0h-2v2h2v-2z"/></svg>`;
  }
  if (url.includes("todoist.com") || label.includes("todoist")) {
    return `<svg class="brand-logo" viewBox="0 0 24 24" width="26" height="26"><rect width="24" height="24" rx="5" fill="#E44332"/><path d="M6 8l4 4-1.4 1.4L6 10.8V8zm0 5l4 4-1.4 1.4L6 15.8V13zm6-5h6v2h-6V8zm0 5h6v2h-6v-2z" fill="#FFF"/></svg>`;
  }
  if (url.includes("github.com") || label.includes("github")) {
    return `<svg class="brand-logo" viewBox="0 0 24 24" width="26" height="26" fill="#FFFFFF"><path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>`;
  }
  if (url.includes("brightspace") || label.includes("brightspace") || url.includes("nyu.edu")) {
    return `<svg class="brand-logo" viewBox="0 0 24 24" width="26" height="26"><rect width="24" height="24" rx="5" fill="#E84E1B"/><path d="M12 4l6 4v8l-6 4-6-4V8l6-4zm0 3.5L8 10v4l4 2.5 4-2.5v-4L12 7.5z" fill="#FFF"/></svg>`;
  }
  if (url.includes("overleaf.com") || label.includes("overleaf")) {
    return `<svg class="brand-logo" viewBox="0 0 24 24" width="26" height="26"><circle cx="12" cy="12" r="10" fill="#4F9E43"/><path d="M12 6c-3.3 0-6 2.7-6 6 0 2.2 1.2 4.1 3 5.1-.2-.6-.3-1.3-.3-2.1 0-3.3 2.7-6 6-6 .8 0 1.5.1 2.1.3-1-1.8-2.9-3-4.8-3.3z" fill="#FFF"/></svg>`;
  }
  if (url.includes("wrds") || label.includes("wrds")) {
    return `<svg class="brand-logo" viewBox="0 0 24 24" width="26" height="26"><rect width="24" height="24" rx="5" fill="#00356B"/><path d="M6 16l3-8 3 5 3-5 3 8h-2.5l-1.8-5-2.7 4.5-2.7-4.5L7.8 16H6z" fill="#FFF"/></svg>`;
  }
  if (url.includes("ssrn.com") || label.includes("ssrn")) {
    return `<svg class="brand-logo" viewBox="0 0 24 24" width="26" height="26"><rect width="24" height="24" rx="5" fill="#1C355E"/><path d="M7 8h10v2H7V8zm0 3h10v2H7v-2zm0 3h7v2H7v-2z" fill="#FFF"/></svg>`;
  }
  if (url.includes("spotify.com") || label.includes("spotify")) {
    return `<svg class="brand-logo" viewBox="0 0 24 24" width="26" height="26"><circle cx="12" cy="12" r="10" fill="#1DB954"/><path d="M16.5 14.8c-.2.3-.5.4-.8.2-2.2-1.3-4.9-1.6-8.2-.9-.3.1-.7-.1-.8-.4-.1-.3.1-.7.4-.8 3.6-.8 6.6-.5 9.1 1 .3.2.4.6.3.9zm1.1-2.4c-.2.4-.7.5-1.1.2-2.5-1.5-6.3-2-9.2-1.1-.4.1-.9-.1-1-.5-.1-.4.1-.9.5-1 3.4-1 7.6-.5 10.5 1.3.4.2.5.7.3 1.1zm.1-2.6C14.7 8 9.7 7.8 6.8 8.7c-.5.2-1-.1-1.2-.6-.2-.5.1-1 .6-1.2 3.4-1 9-0.8 12.5 1.3.5.3.6.9.3 1.4-.2.4-.8.6-1.3.2z" fill="#000"/></svg>`;
  }
  if (url.includes("linkedin.com") || label.includes("linkedin")) {
    return `<svg class="brand-logo" viewBox="0 0 24 24" width="26" height="26"><rect width="24" height="24" rx="4" fill="#0A66C2"/><path d="M8.5 17h-2.5v-8h2.5v8zM7.2 7.9c-.8 0-1.4-.6-1.4-1.4s.6-1.4 1.4-1.4 1.4.6 1.4 1.4-.6 1.4-1.4 1.4zm10.8 9.1h-2.5v-4c0-1-.4-1.7-1.3-1.7-.7 0-1.1.5-1.3 1-.1.2-.1.4-.1.7v4H10.3s.03-7.3 0-8h2.5v1.1c.3-.5 1-1.3 2.3-1.3 1.7 0 2.9 1.1 2.9 3.5v4.7z" fill="#FFF"/></svg>`;
  }

  try {
    const domain = new URL(link.url).hostname;
    return `<img class="brand-logo brand-favicon" src="https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64" alt="${link.label}" loading="lazy">`;
  } catch {
    return `<svg class="brand-logo" viewBox="0 0 24 24" width="26" height="26"><circle cx="12" cy="12" r="10" fill="rgba(255,255,255,0.1)"/><path d="M12 7v10M7 12h10" stroke="#FFF" stroke-width="2"/></svg>`;
  }
}

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
  if (!grid) return;
  const links = await load(LINKS_KEY, DEFAULT_LINKS);
  const account = await load(ACTIVE_ACCOUNT_KEY, null);

  grid.innerHTML = links.map((link, index) => `
    <li class="dock-item">
      <a class="link-dock-tile" href="${resolveUrl(link, account)}" target="_blank" rel="noopener noreferrer" data-tooltip="${link.label}" aria-label="${link.label}">
        <div class="logo-box">${getBrandLogo(link)}</div>
        <span class="dock-tooltip">${link.label}</span>
      </a>
      <button class="link-remove-btn" type="button" data-index="${index}" aria-label="Remove ${link.label}">×</button>
    </li>
  `).join("");

  // Bind remove handlers
  grid.querySelectorAll(".link-remove-btn").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const idx = Number(btn.dataset.index);
      const next = links.filter((_, i) => i !== idx);
      await save(LINKS_KEY, next);
      renderLinks();
    });
  });
}

function safeUrl(raw) {
  try {
    const url = new URL(raw.trim());
    return ["http:", "https:"].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

// Account picker: choose which Google account Gmail and Calendar open.

async function renderAccounts() {
  const select = document.getElementById("account-select");
  if (!select) return;
  const accounts = await load(ACCOUNTS_KEY, []);
  const active = await load(ACTIVE_ACCOUNT_KEY, null);

  select.replaceChildren(
    new Option("Default (first signed-in account)", ""),
    ...accounts.map((email) => new Option(email, email, false, email === active)),
  );
  select.value = active && accounts.includes(active) ? active : "";
  document.getElementById("account-remove").disabled = !select.value;
}

function bindAccountControls() {
  document.getElementById("account-select")?.addEventListener("change", async (event) => {
    await save(ACTIVE_ACCOUNT_KEY, event.target.value || null);
    await renderAccounts();
    await renderLinks();
    window.dispatchEvent(new Event("account-changed"));
  });

  document.getElementById("account-remove")?.addEventListener("click", async () => {
    const selected = document.getElementById("account-select").value;
    const accounts = (await load(ACCOUNTS_KEY, [])).filter((email) => email !== selected);
    await save(ACCOUNTS_KEY, accounts);
    await save(ACTIVE_ACCOUNT_KEY, null);
    await renderAccounts();
    await renderLinks();
    window.dispatchEvent(new Event("account-changed"));
  });

  document.getElementById("account-form")?.addEventListener("submit", async (event) => {
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
    await renderAccounts();
    await renderLinks();
    window.dispatchEvent(new Event("account-changed"));
  });
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
  await renderAccounts();
  bindAccountControls();

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
