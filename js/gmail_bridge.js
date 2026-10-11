// Gmail Content Script Bridge
// Runs inside active mail.google.com sessions with native cookie credentials.

// The dashboard stores the chosen account under "activeAccount". Read it on
// every sync so the feed follows the picker, not whichever tab is open.
async function activeAccount() {
  try {
    const result = await chrome.storage.local.get("activeAccount");
    return result.activeAccount || null;
  } catch {
    return null;
  }
}

function withAccount(href, account) {
  if (!account) return href;
  try {
    const url = new URL(href);
    url.searchParams.set("authuser", account);
    return url.href;
  } catch {
    return href;
  }
}

async function extractFeed() {
  try {
    const account = await activeAccount();
    const feed = account ? `/mail/feed/atom?authuser=${encodeURIComponent(account)}` : "/mail/feed/atom";
    const res = await fetch(feed, { credentials: "include" });
    if (!res.ok) return null;
    const text = await res.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, "text/xml");

    const fullcount = Number(doc.querySelector("fullcount")?.textContent || 0);
    const entries = Array.from(doc.querySelectorAll("entry")).slice(0, 8).map((entry) => {
      const title = entry.querySelector("title")?.textContent || "No Subject";
      const summary = entry.querySelector("summary")?.textContent || "";
      const author = entry.querySelector("author name")?.textContent || entry.querySelector("author email")?.textContent || "Unknown";
      const rawLink = entry.querySelector("link")?.getAttribute("href") || "https://mail.google.com";
      const link = withAccount(rawLink, account);
      const issued = entry.querySelector("issued")?.textContent || entry.querySelector("modified")?.textContent || new Date().toISOString();

      return {
        id: entry.querySelector("id")?.textContent || link,
        title,
        summary,
        author,
        link,
        date: issued,
      };
    });

    const payload = { fullcount, entries, lastSync: Date.now(), error: null, account };

    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      await chrome.storage.local.set({
        emails_cache: payload,
        od_emails_cache: payload,
      });
    }

    return payload;
  } catch (err) {
    return null;
  }
}

// Initial harvest on page load
extractFeed();

// Periodic sync while Gmail tab remains open
setInterval(extractFeed, 120_000);

// Respond to on-demand refresh triggers from the dashboard
if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
    if (req.action === "refresh_gmail_feed") {
      extractFeed().then((payload) => sendResponse({ ok: Boolean(payload), payload }));
      return true;
    }
  });
}
