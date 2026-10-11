// Persistence with a localStorage fallback. chrome.storage.local is the
// real store in the extension; the fallback keeps the page usable when it
// is opened as a plain file during development.

const hasChromeStorage = () =>
  typeof chrome !== "undefined" && Boolean(chrome.storage?.local);

export async function load(key, fallback) {
  try {
    if (hasChromeStorage()) {
      const result = await chrome.storage.local.get(key);
      return result[key] ?? fallback;
    }
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export async function save(key, value) {
  try {
    if (hasChromeStorage()) {
      await chrome.storage.local.set({ [key]: value });
      return;
    }
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage can be full or blocked. The UI keeps working in memory.
  }
}
