// Live Gmail feed reader via Gmail Atom feed.
// Runs natively in the extension using the user's active Chrome Gmail session.

import { load, save } from "./store.js";

const EMAILS_CACHE_KEY = "emails_cache";
const GMAIL_FEED_URL = "https://mail.google.com/mail/feed/atom";

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const now = new Date();
  const diffSec = Math.floor((now - d) / 1000);
  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str || "";
  return div.innerHTML;
}

export async function fetchLiveEmails() {
  try {
    const res = await fetch(GMAIL_FEED_URL, { credentials: "include" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, "text/xml");

    const fullcount = Number(doc.querySelector("fullcount")?.textContent || 0);
    const entries = Array.from(doc.querySelectorAll("entry")).slice(0, 6).map((entry) => {
      const title = entry.querySelector("title")?.textContent || "No Subject";
      const summary = entry.querySelector("summary")?.textContent || "";
      const author = entry.querySelector("author name")?.textContent || entry.querySelector("author email")?.textContent || "Unknown";
      const link = entry.querySelector("link")?.getAttribute("href") || "https://mail.google.com";
      const issued = entry.querySelector("issued")?.textContent || entry.querySelector("modified")?.textContent || "";

      return {
        id: entry.querySelector("id")?.textContent || link,
        title,
        summary,
        author,
        link,
        date: issued,
      };
    });

    const payload = { fullcount, entries, lastSync: Date.now(), error: null };
    await save(EMAILS_CACHE_KEY, payload);
    return payload;
  } catch (err) {
    const cached = await load(EMAILS_CACHE_KEY, { fullcount: 0, entries: [], lastSync: null });
    return { ...cached, error: err.message };
  }
}

export async function initEmails() {
  const listEl = document.getElementById("email-list");
  const countEl = document.getElementById("email-unread-count");
  const syncBtn = document.getElementById("email-refresh-btn");
  if (!listEl) return;

  // 1. Render immediately from cache for zero latency
  const cached = await load(EMAILS_CACHE_KEY, null);
  if (cached && cached.entries && cached.entries.length) {
    renderEmails(cached.entries, cached.fullcount);
  } else {
    renderEmpty("Loading inbox feed...");
  }

  // 2. Fetch live in background
  const live = await fetchLiveEmails();
  if (live.entries && live.entries.length) {
    renderEmails(live.entries, live.fullcount);
  } else if (!cached || !cached.entries.length) {
    renderEmpty(live.error ? "Log into Gmail in Chrome to enable live feed." : "Inbox zero. All caught up.");
  }

  if (syncBtn) {
    syncBtn.addEventListener("click", async () => {
      syncBtn.classList.add("spinning");
      const updated = await fetchLiveEmails();
      if (updated.entries) renderEmails(updated.entries, updated.fullcount);
      setTimeout(() => syncBtn.classList.remove("spinning"), 500);
    });
  }
}

function renderEmails(entries, fullcount) {
  const listEl = document.getElementById("email-list");
  const countEl = document.getElementById("email-unread-count");
  if (!listEl) return;

  if (countEl) {
    countEl.textContent = fullcount > 0 ? `${fullcount} unread` : "0 unread";
  }

  listEl.innerHTML = entries.map((item) => `
    <li class="email-item">
      <a class="email-link" href="${escapeHtml(item.link)}" target="_blank" rel="noopener noreferrer">
        <div class="email-head">
          <span class="email-sender">${escapeHtml(item.author)}</span>
          <span class="email-time">${timeAgo(item.date)}</span>
        </div>
        <div class="email-subject">${escapeHtml(item.title)}</div>
        <div class="email-snippet">${escapeHtml(item.summary)}</div>
      </a>
    </li>
  `).join("");
}

function renderEmpty(message) {
  const listEl = document.getElementById("email-list");
  if (!listEl) return;
  listEl.innerHTML = `<li class="empty email-empty">${escapeHtml(message)}</li>`;
}
