// Skrót klawiszowy Ctrl+Shift+L jest powiązany z "_execute_action",
// więc Chrome sam otwiera popup. Tutaj utrzymujemy zieloną kropkę na ikonce,
// gdy podmiana fontów jest aktywna (zapisany niepusty stan w wfs_state).

const STORAGE_KEY = "wfs_state";

function isActive(state) {
  if (!state) return false;
  return Object.values(state).some(
    (p) => p && (p.family || p.weight || p.spacing || p.size || p.case)
  );
}

function updateBadge(state) {
  try {
    chrome.action.setBadgeBackgroundColor({ color: "#21c95e" });
    if (chrome.action.setBadgeTextColor) {
      chrome.action.setBadgeTextColor({ color: "#21c95e" });
    }
    chrome.action.setBadgeText({ text: isActive(state) ? "●" : "" });
  } catch (e) {
    /* ignore */
  }
}

function refreshFromStorage() {
  chrome.storage.local.get(STORAGE_KEY, (d) => updateBadge(d[STORAGE_KEY]));
}

chrome.runtime.onInstalled.addListener(refreshFromStorage);
if (chrome.runtime.onStartup) chrome.runtime.onStartup.addListener(refreshFromStorage);

// Reaguj na zmiany wyboru fontów (apply/reset) — od razu aktualizuj kropkę.
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes[STORAGE_KEY]) {
    updateBadge(changes[STORAGE_KEY].newValue);
  }
});

// Gdy service worker się budzi — ustaw aktualny stan kropki.
refreshFromStorage();
