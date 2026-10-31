// Job Hunt: counts, what is in motion, what is ready to submit, and a way into the
// job dashboard. Numbers come from js/data.js, which Applications/build_dashboard.py
// regenerates on every rebuild, so this card is as fresh as the dashboard itself.

import { openUrl, modifierNewTab } from "./open.js";

let data = null; // { jobs, applications }

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function note(text, actions = []) {
  const box = document.getElementById("jobs-note");
  if (!box) return;
  box.replaceChildren(el("span", null, text), ...actions);
  box.hidden = false;
}

export async function openJobs(hash = "", newTab = false) {
  const base = data?.jobs?.dashboard;
  if (!base) {
    note("No dashboard yet. Run: python3 Applications/build_dashboard.py");
    return;
  }
  await openUrl(hash ? `${base}#${hash}` : base, { sameTab: !newTab, onProblem: note });
}

function isoDay(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function shortDate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function updatedLabel(built) {
  if (!built) return "";
  const [day, time] = built.split(" ");
  return day === isoDay(new Date()) ? `Updated ${time}` : `Updated ${shortDate(day)}, ${time}`;
}

function isStale(built) {
  if (!built) return true;
  return Date.now() - new Date(built.replace(" ", "T")).getTime() > 30 * 3_600_000;
}

function row(main, sub, tagText, tagClass, onActivate) {
  const li = el("li", "row is-link");
  const body = el("div", "row-main");
  body.append(el("span", "row-title", main), el("span", "row-sub", sub));
  li.append(body, el("span", `tag ${tagClass}`, tagText));
  li.tabIndex = 0;
  li.addEventListener("click", onActivate);
  li.addEventListener("keydown", (event) => event.key === "Enter" && onActivate(event));
  return li;
}

function moreRow(text, onActivate) {
  const li = el("li", "row more is-link", text);
  li.tabIndex = 0;
  li.addEventListener("click", onActivate);
  li.addEventListener("keydown", (event) => event.key === "Enter" && onActivate(event));
  return li;
}

function renderStats(jobs) {
  const tiles = [
    ["To submit", jobs.toSubmit, "pipeline/ready"],
    ["In motion", jobs.inMotion, "pipeline/active"],
    ["New leads", jobs.newLeads, "leads/new"],
    ["Follow up", jobs.followUps, "pipeline/waiting"],
  ];
  document.getElementById("jobs-stats").replaceChildren(
    ...tiles.map(([label, value, hash]) => {
      const tile = el("button", `stat${value ? "" : " is-zero"}`);
      tile.type = "button";
      tile.title = `Open ${label.toLowerCase()} in the dashboard`;
      tile.append(el("dt", null, label), el("dd", null, String(value ?? 0)));
      tile.addEventListener("click", (event) => openJobs(hash, modifierNewTab(event)));
      return tile;
    }),
  );
}

// "Assessment 2026-10-31" -> ["Assessment", "Oct 31"]
function splitStatus(status) {
  const match = /^(.*?)\s*(\d{4}-\d{2}-\d{2})/.exec(status || "");
  return match ? [match[1] || "In motion", shortDate(match[2])] : [status || "In motion", ""];
}

function renderMotion(jobs, applications) {
  const list = document.getElementById("jobs-motion");
  const active = applications.filter((a) => a.bucket === "assessment" || a.bucket === "selected");
  const shown = active.slice(0, 4).map((app) => {
    const [stage, when] = splitStatus(app.status);
    return row(app.company, app.role, when ? `${stage} · ${when}` : stage, "tag-warm", (event) =>
      openJobs("pipeline/active", modifierNewTab(event)),
    );
  });
  if (active.length > 4) shown.push(moreRow(`+${active.length - 4} more`, (event) => openJobs("pipeline/active", modifierNewTab(event))));
  list.replaceChildren(...(shown.length ? shown : [el("li", "empty", "Nothing in motion yet.")]));
}

function renderReady(jobs) {
  const list = document.getElementById("jobs-ready");
  const picks = (jobs.next || []).filter((item) => item.kind === "submit");
  const shown = picks.map((item) =>
    row(item.company, item.role, "Apply", "tag-cool", () => item.url && openUrl(item.url, { onProblem: note })),
  );
  const rest = (jobs.toSubmit ?? 0) - picks.length;
  if (rest > 0) shown.push(moreRow(`${rest} more ready in the dashboard`, (event) => openJobs("pipeline/ready", modifierNewTab(event))));
  list.replaceChildren(...(shown.length ? shown : [el("li", "empty", "Nothing queued. Good day for outreach.")]));
}

export async function initJobs() {
  try {
    const mod = await import("./data.js");
    data = { jobs: mod?.DATA?.jobs ?? null, applications: mod?.DATA?.applications ?? [] };
  } catch {
    data = { jobs: null, applications: [] };
  }

  document.getElementById("jobs-open")?.addEventListener("click", (event) => openJobs("today", modifierNewTab(event)));

  const jobs = data.jobs;
  if (!jobs) {
    document.getElementById("jobs-motion").replaceChildren(
      el("li", "empty", "Run python3 Applications/build_dashboard.py once to connect this card."),
    );
    return;
  }
  renderStats(jobs);
  renderMotion(jobs, data.applications);
  renderReady(jobs);
  document.getElementById("jobs-updated").textContent = updatedLabel(jobs.built);

  const problems = [...(jobs.issues || [])];
  if (isStale(jobs.built)) problems.unshift("data is more than a day old");
  if (problems.length) note(`Needs a look: ${problems.join(", ")}. Logs: ~/Library/Logs/com.tanishk.*.err`);
}
