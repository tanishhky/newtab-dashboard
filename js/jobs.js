// Job Hunt: today's counts from the job dashboard and a one-click way into it.
// The numbers come from js/data.js (DATA.jobs), which build_dashboard.py regenerates
// every time the dashboard rebuilds, so this card is as fresh as the dashboard itself.

let jobs = null;

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

const hasChrome = () => typeof chrome !== "undefined" && Boolean(chrome.tabs);

function dashboardUrl(hash) {
  if (!jobs?.dashboard) return null;
  return hash ? `${jobs.dashboard}#${hash}` : jobs.dashboard;
}

function fileAccessAllowed() {
  return new Promise((resolve) => {
    if (typeof chrome === "undefined" || !chrome.extension?.isAllowedFileSchemeAccess) {
      resolve(true);
      return;
    }
    chrome.extension.isAllowedFileSchemeAccess(resolve);
  });
}

function note(text, actions = []) {
  const box = document.getElementById("jobs-note");
  if (!box) return;
  box.replaceChildren(el("span", null, text), ...actions);
  box.hidden = false;
}

// Chrome only lets an extension open file:// pages after "Allow access to file URLs"
// is turned on for it. Say so plainly, and offer the setting and a copyable link.
function fileHint(url) {
  const settings = el("button", "btn btn-sm", "Open that setting");
  settings.type = "button";
  settings.addEventListener("click", () => chrome.tabs.create({ url: `chrome://extensions/?id=${chrome.runtime.id}` }));
  const copy = el("button", "btn btn-sm btn-ghost", "Copy link");
  copy.type = "button";
  copy.addEventListener("click", async () => {
    await navigator.clipboard.writeText(url);
    copy.textContent = "Copied, paste in the address bar";
  });
  note('One-time setup: on this extension\'s Details page, turn on "Allow access to file URLs".', [settings, copy]);
}

export async function openJobs(hash = "", newTab = false) {
  const url = dashboardUrl(hash);
  if (!url) {
    note("No dashboard yet. Run: python3 Applications/build_dashboard.py");
    return;
  }
  if (!hasChrome()) {
    window.location.href = url;
    return;
  }
  if (!(await fileAccessAllowed())) {
    fileHint(url);
    return;
  }
  try {
    const current = newTab ? null : await chrome.tabs.getCurrent();
    if (current) await chrome.tabs.update(current.id, { url });
    else await chrome.tabs.create({ url });
  } catch {
    fileHint(url);
  }
}

function openPosting(url) {
  if (hasChrome()) chrome.tabs.create({ url });
  else window.open(url, "_blank", "noopener");
}

function updatedLabel(built) {
  if (!built) return "";
  const [day, time] = built.split(" ");
  const today = new Date();
  const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  return day === iso ? `updated ${time}` : `updated ${day.slice(5).replace("-", "/")} ${time}`;
}

function isStale(built) {
  if (!built) return true;
  const then = new Date(built.replace(" ", "T"));
  return Date.now() - then.getTime() > 30 * 3_600_000;
}

function renderLauncher() {
  const sub = document.getElementById("jobs-launch-sub");
  if (!sub) return;
  if (!jobs) {
    sub.textContent = "not built yet";
    return;
  }
  const bits = [];
  if (jobs.toSubmit) bits.push(`${jobs.toSubmit} to submit`);
  if (jobs.inMotion) bits.push(`${jobs.inMotion} in motion`);
  if (jobs.newLeads) bits.push(`${jobs.newLeads} new leads`);
  sub.textContent = bits.length ? bits.join(" · ") : "all caught up";
}

function renderCard() {
  const stats = document.getElementById("jobs-stats");
  const next = document.getElementById("jobs-next");
  const updated = document.getElementById("jobs-updated");
  if (!stats || !next) return;

  if (!jobs) {
    stats.replaceChildren();
    next.replaceChildren(el("li", "empty", "Run python3 Applications/build_dashboard.py once to connect this card."));
    return;
  }
  if (updated) updated.textContent = updatedLabel(jobs.built);

  const tiles = [
    ["To submit", jobs.toSubmit, "pipeline/ready"],
    ["In motion", jobs.inMotion, "pipeline/active"],
    ["New leads", jobs.newLeads, "leads/new"],
    ["Follow up", jobs.followUps, "pipeline/waiting"],
  ];
  stats.replaceChildren(
    ...tiles.map(([label, value, hash]) => {
      const tile = el("button", `stat stat-link${value ? "" : " is-zero"}`);
      tile.type = "button";
      tile.title = `Open ${label.toLowerCase()} in the dashboard`;
      tile.append(el("dt", null, label), el("dd", null, String(value ?? 0)));
      tile.addEventListener("click", (event) => openJobs(hash, event.metaKey || event.ctrlKey));
      return tile;
    }),
  );

  const items = (jobs.next || []).map((item) => {
    const li = el("li", "jobs-item");
    const body = el("div");
    body.style.minWidth = "0";
    body.append(el("span", "app-company", item.company));
    body.append(el("span", "app-role", item.kind === "interview" ? item.status : item.role));
    const tag = el("span", `pill ${item.kind === "interview" ? "assessment" : "applied"}`, item.kind === "interview" ? "In motion" : "Submit");
    li.append(body, tag);
    li.tabIndex = 0;
    const go = (event) => {
      if (item.kind === "submit" && item.url) openPosting(item.url);
      else openJobs(item.kind === "interview" ? "pipeline/active" : "pipeline/ready", event.metaKey || event.ctrlKey);
    };
    li.addEventListener("click", go);
    li.addEventListener("keydown", (event) => event.key === "Enter" && go(event));
    return li;
  });
  next.replaceChildren(...(items.length ? items : [el("li", "empty", "Nothing queued. Good day for outreach.")]));

  const problems = [...(jobs.issues || [])];
  if (isStale(jobs.built)) problems.unshift("data is more than a day old");
  if (problems.length) note(`Check: ${problems.join(", ")}. Logs: ~/Library/Logs/com.tanishk.*.err`);
}

export async function initJobs() {
  try {
    const mod = await import("./data.js");
    jobs = mod?.DATA?.jobs ?? null;
  } catch {
    jobs = null;
  }
  renderLauncher();
  renderCard();
  const launch = document.getElementById("jobs-launch");
  launch?.addEventListener("click", (event) => openJobs("today", event.metaKey || event.ctrlKey));
  document.getElementById("jobs-open")?.addEventListener("click", (event) => openJobs("today", event.metaKey || event.ctrlKey));
}
