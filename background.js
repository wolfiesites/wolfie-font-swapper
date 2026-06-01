// Skrót Ctrl+Shift+L jest powiązany z "_execute_action" (Chrome sam otwiera popup).
// Zieloną kropkę aktywności rysuje teraz popup per-karta (chrome.action.setIcon
// z tabId) — odzwierciedla podmianę dla konkretnej karty/domeny.

chrome.runtime.onInstalled.addListener(() => {
  console.log("Wolfie Font Swapper zainstalowany. Skrót: Ctrl+Shift+L.");
});
