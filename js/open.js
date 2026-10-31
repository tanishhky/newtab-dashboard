// Opening links from an extension page. Web URLs open in a new tab. file:// URLs
// (the job dashboard, the handbook PDF) only work after "Allow access to file URLs"
// is turned on for the extension, so say that plainly instead of failing silently.

const hasChrome = () => typeof chrome !== "undefined" && Boolean(chrome.tabs);

function fileAccessAllowed() {
  return new Promise((resolve) => {
    if (typeof chrome === "undefined" || !chrome.extension?.isAllowedFileSchemeAccess) {
      resolve(true);
      return;
    }
    chrome.extension.isAllowedFileSchemeAccess(resolve);
  });
}

// onProblem(message, actions) is called with a plain sentence and optional buttons.
export async function openUrl(url, { sameTab = false, onProblem } = {}) {
  if (!hasChrome()) {
    if (sameTab) window.location.href = url;
    else window.open(url, "_blank", "noopener");
    return;
  }
  if (url.startsWith("file:") && !(await fileAccessAllowed())) {
    onProblem?.('One-time setup: on this extension\'s Details page, turn on "Allow access to file URLs".', fileActions(url));
    return;
  }
  try {
    const current = sameTab ? await chrome.tabs.getCurrent() : null;
    if (current) await chrome.tabs.update(current.id, { url });
    else await chrome.tabs.create({ url });
  } catch {
    onProblem?.("Could not open that link.", url.startsWith("file:") ? fileActions(url) : []);
  }
}

function button(label, onClick) {
  const node = document.createElement("button");
  node.type = "button";
  node.className = "mini-btn";
  node.textContent = label;
  node.addEventListener("click", onClick);
  return node;
}

function fileActions(url) {
  return [
    button("Open that setting", () => chrome.tabs.create({ url: `chrome://extensions/?id=${chrome.runtime.id}` })),
    button("Copy link", async (event) => {
      await navigator.clipboard.writeText(url);
      event.target.textContent = "Copied";
    }),
  ];
}

export function modifierNewTab(event) {
  return event.metaKey || event.ctrlKey || event.shiftKey;
}
