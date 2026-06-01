// Service worker:
// - udostępnia chrome.storage.session content scriptom (by mogły czytać konfig per domena),
// - rysuje zieloną kropkę na ikonie karty, gdy content script auto-zastosuje fonty.

function setSessionAccess() {
  try {
    chrome.storage.session.setAccessLevel({ accessLevel: "TRUSTED_AND_UNTRUSTED_CONTEXTS" });
  } catch (e) {}
}

async function iconWithDot(size, withDot) {
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
    ctx.fillStyle = "#21c95e";
    ctx.fill();
  }
  return ctx.getImageData(0, 0, size, size);
}
async function setDot(tabId, on) {
  if (tabId == null) return;
  try {
    const [d16, d32] = await Promise.all([iconWithDot(16, on), iconWithDot(32, on)]);
    await chrome.action.setIcon({ tabId, imageData: { 16: d16, 32: d32 } });
  } catch (e) {}
}

chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg && msg.type === "wfs-active" && sender.tab && sender.tab.id != null) {
    setDot(sender.tab.id, true);
  }
});

chrome.runtime.onInstalled.addListener(setSessionAccess);
if (chrome.runtime.onStartup) chrome.runtime.onStartup.addListener(setSessionAccess);
setSessionAccess();
