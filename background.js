// Service worker:
// - udostępnia chrome.storage.session content scriptom (by mogły czytać konfig per domena),
// - rysuje kropkę na ikonie karty, gdy content script auto-zastosuje fonty
//   (zielona = ręczna podmiana sesji/trwała, czerwona = reguła domeny z ustawień).

function setSessionAccess() {
  try {
    chrome.storage.session.setAccessLevel({ accessLevel: "TRUSTED_AND_UNTRUSTED_CONTEXTS" });
  } catch (e) {}
}

async function iconWithDot(size, withDot, color) {
  const srcSize = size >= 48 ? 48 : size >= 32 ? 48 : 16;
  const resp = await fetch(chrome.runtime.getURL("icons/icon" + srcSize + ".png"));
  const bmp = await createImageBitmap(await resp.blob());
  const c = new OffscreenCanvas(size, size);
  const ctx = c.getContext("2d");
  ctx.clearRect(0, 0, size, size);
  ctx.drawImage(bmp, 0, 0, size, size);
  if (withDot) {
    const r = Math.max(2, Math.round(size * 0.16));
    const m = Math.round(size * 0.06);
    const cx = size - r - m;
    const cy = size - r - m;
    ctx.beginPath();
    ctx.arc(cx, cy, r + Math.max(1, Math.round(size * 0.04)), 0, Math.PI * 2);
    ctx.fillStyle = "rgba(10,13,20,.92)";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    // Czerwona kropka = reguła domeny (z ustawień). Zielona = ręczna podmiana.
    ctx.fillStyle = color === "red" ? "#ff3b30" : "#21c95e";
    ctx.fill();
  }
  return ctx.getImageData(0, 0, size, size);
}
async function setDot(tabId, on, color) {
  if (tabId == null) return;
  try {
    const [d16, d32] = await Promise.all([iconWithDot(16, on, color), iconWithDot(32, on, color)]);
    await chrome.action.setIcon({ tabId, imageData: { 16: d16, 32: d32 } });
  } catch (e) {}
}

chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg && msg.type === "wfs-active" && sender.tab && sender.tab.id != null) {
    setDot(sender.tab.id, true, msg.fromRule ? "red" : "green");
  }
});

// ---- Panel wstrzykiwany w stronę (fixed, prawy górny róg) ----
// Manifest nie ma default_popup, więc klik w ikonę odpala onClicked. Wysyłamy
// do content scriptu prośbę o przełączenie panelu (iframe z popup.html).
chrome.action.onClicked.addListener(async (tab) => {
  if (!tab || tab.id == null) return;
  const msg = { type: "wfs-toggle-panel", tabId: tab.id };
  try {
    await chrome.tabs.sendMessage(tab.id, msg);
  } catch (e) {
    // Content script jeszcze nie wstrzyknięty (np. karta otwarta przed instalacją)
    // — wstrzyknij go i ponów.
    try {
      await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["content.js"] });
      await chrome.tabs.sendMessage(tab.id, msg);
    } catch (e2) {}
  }
});

chrome.runtime.onInstalled.addListener(setSessionAccess);
if (chrome.runtime.onStartup) chrome.runtime.onStartup.addListener(setSessionAccess);
setSessionAccess();
