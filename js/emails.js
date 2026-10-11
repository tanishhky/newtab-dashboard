// Live Gmail feed reader with Content Script Bridge and login fallback.
// Connects to active Chrome Gmail sessions to render live unread emails.

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
  // 1. Try direct fetch with credentials
  try {
    const res = await fetch(GMAIL_FEED_URL, { credentials: "include" });
    if (res.ok) {
      const text = await res.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, "text/xml");

      const fullcount = Number(doc.querySelector("fullcount")?.textContent || 0);
      const entries = Array.from(doc.querySelectorAll("entry")).slice(0, 8).map((entry) => ({
        id: entry.querySelector("id")?.textContent || "",
        title: entry.querySelector("title")?.textContent || "No Subject",
        summary: entry.querySelector("summary")?.textContent || "",
        author: entry.querySelector("author name")?.textContent || entry.querySelector("author email")?.textContent || "Unknown",
        link: entry.querySelector("link")?.getAttribute("href") || "https://mail.google.com",
        date: entry.querySelector("issued")?.textContent || entry.querySelector("modified")?.textContent || new Date().toISOString(),
      }));

      const payload = { fullcount, entries, lastSync: Date.now(), error: null };
      await save(EMAILS_CACHE_KEY, payload);
      return payload;
    }
  } catch {
    // Cross-origin restriction; fall through to bridge
  }

  // 2. Query open Gmail tab via content script bridge
  try {
    if (typeof chrome !== "undefined" && chrome.tabs && chrome.tabs.query) {
      const tabs = await chrome.tabs.query({ url: "*://mail.google.com/*" });
      if (tabs && tabs.length > 0) {
        const response = await new Promise((resolve) => {
          chrome.tabs.sendMessage(tabs[0].id, { action: "refresh_gmail_feed" }, (res) => {
            if (chrome.runtime.lastError || !res) resolve(null);
            else resolve(res);
          });
        });

        if (response && response.ok && response.payload) {
          await save(EMAILS_CACHE_KEY, response.payload);
          return response.payload;
        }
      }
    }
  } catch {
    // Fall through
  }

  // 3. Fallback to existing cache if present
  const cached = await load(EMAILS_CACHE_KEY, null);
  if (cached && cached.entries && cached.entries.length) {
    return cached;
  }

  return { fullcount: 0, entries: [], lastSync: null, error: "AUTH_REQUIRED" };
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
    renderLoginBox();
  }

  // 2. Fetch live in background
  const live = await fetchLiveEmails();
  if (live.entries && live.entries.length) {
    renderEmails(live.entries, live.fullcount);
  } else if (!cached || !cached.entries.length) {
    renderLoginBox();
  }

  // 3. Manual refresh button
  if (syncBtn) {
    syncBtn.addEventListener("click", async () => {
      syncBtn.classList.add("spinning");
      const updated = await fetchLiveEmails();
      if (updated.entries && updated.entries.length) {
        renderEmails(updated.entries, updated.fullcount);
      } else {
        renderLoginBox();
      }
      setTimeout(() => syncBtn.classList.remove("spinning"), 600);
    });
  }

  // 4. Reactive listener: updates automatically when Gmail tab syncs
  if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.onChanged) {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === "local" && changes.emails_cache && changes.emails_cache.newValue) {
        const data = changes.emails_cache.newValue;
        if (data.entries && data.entries.length) {
          renderEmails(data.entries, data.fullcount);
        }
      }
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

function renderLoginBox() {
  const listEl = document.getElementById("email-list");
  const countEl = document.getElementById("email-unread-count");
  if (!listEl) return;

  if (countEl) {
    countEl.textContent = "Connect";
  }

  listEl.innerHTML = `
    <li class="email-login-card">
      <div class="email-login-icon">
        <svg viewBox="0 0 24 24" width="30" height="30"><path fill="#EA4335" d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
      </div>
      <div class="email-login-title">Connect Live Gmail</div>
      <p class="email-login-desc">Sign in or open Gmail in Chrome to stream unread messages directly into this dashboard.</p>
      <button class="btn btn-primary email-login-btn" id="email-login-action" type="button">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
        </svg>
        Log In to Gmail
      </button>
    </li>
  `;

  const btn = document.getElementById("email-login-action");
  if (btn) {
    btn.addEventListener("click", () => {
      btn.textContent = "Opening Gmail...";
      btn.disabled = true;
      if (typeof chrome !== "undefined" && chrome.tabs && chrome.tabs.create) {
        chrome.tabs.create({ url: "https://mail.google.com" });
      } else {
        window.open("https://mail.google.com", "_blank");
      }
    });
  }
}
