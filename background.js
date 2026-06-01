// Skrót Ctrl+Shift+L jest powiązany z "_execute_action" (Chrome sam otwiera popup).
// Tu rysujemy małą, okrągłą zieloną kropkę na ikonce, gdy podmiana fontów jest
// aktywna (zapisany niepusty stan w wfs_state) — przez setIcon + OffscreenCanvas.

const STORAGE_KEY = "wfs_state";

function isActive(state) {
  if (!state) return false;
  return Object.values(state).some(
    (p) => p && (p.family || p.weight || p.spacing || p.size || p.case)
  );
}

// Narysuj ikonę (z opcjonalną kropką) w danym rozmiarze -> ImageData.
async function iconWithDot(size, withDot) {
  const srcSize = size >= 48 ? 48 : size >= 32 ? 48 : 16;
  const resp = await fetch(chrome.runtime.getURL("icons/icon" + srcSize + ".png"));
  const bmp = await createImageBitmap(await resp.blob());
  const c = new OffscreenCanvas(size, size);
  const ctx = c.getContext("2d");
  ctx.clearRect(0, 0, size, size);
  ctx.drawImage(bmp, 0, 0, size, size);
  if (withDot) {
    const r = Math.max(2, Math.round(size * 0.16)); // mała, okrągła kropka
    const m = Math.round(size * 0.06);
    const cx = size - r - m;
    const cy = size - r - m;
    // ciemny obrys dla kontrastu
    ctx.beginPath();
    ctx.arc(cx, cy, r + Math.max(1, Math.round(size * 0.04)), 0, Math.PI * 2);
    ctx.fillStyle = "rgba(10,13,20,0.92)";
    ctx.fill();
    // zielona kropka
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = "#21c95e";
    ctx.fill();
  }
  return ctx.getImageData(0, 0, size, size);
}

async function updateIcon(active) {
  try {
    // wyczyść ewentualny stary badge (z poprzedniej wersji)
    chrome.action.setBadgeText({ text: "" });
    const [d16, d32, d48] = await Promise.all([
      iconWithDot(16, active),
      iconWithDot(32, active),
      iconWithDot(48, active),
    ]);
    await chrome.action.setIcon({ imageData: { 16: d16, 32: d32, 48: d48 } });
  } catch (e) {
    /* ignore */
  }
}

function refreshFromStorage() {
  chrome.storage.local.get(STORAGE_KEY, (d) => updateIcon(isActive(d[STORAGE_KEY])));
}

chrome.runtime.onInstalled.addListener(refreshFromStorage);
if (chrome.runtime.onStartup) chrome.runtime.onStartup.addListener(refreshFromStorage);

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes[STORAGE_KEY]) {
    updateIcon(isActive(changes[STORAGE_KEY].newValue));
  }
});

refreshFromStorage();
