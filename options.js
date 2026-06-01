"use strict";

const I18N = window.WOLFIE_I18N;
const select = document.getElementById("lang");
const savedEl = document.getElementById("saved");

// Zbuduj listę: Automatyczny (przeglądarka) + 9 języków po nazwach natywnych.
function buildOptions() {
  select.innerHTML = "";
  const auto = document.createElement("option");
  auto.value = "";
  auto.textContent = I18N.t("options_lang_auto");
  select.appendChild(auto);
  I18N.SUPPORTED.forEach((code) => {
    const opt = document.createElement("option");
    opt.value = code;
    opt.textContent = I18N.LANG_NAMES[code];
    select.appendChild(opt);
  });
}

function currentPref() {
  try {
    return localStorage.getItem("wfs_lang") || "";
  } catch (e) {
    return "";
  }
}

function refresh() {
  // Tłumaczenia statyczne + tytuł dokumentu.
  I18N.applyI18n(document);
  document.title = I18N.t("options_title");
  // Odśwież etykietę opcji "Automatyczny" (zależy od języka).
  if (select.options[0]) select.options[0].textContent = I18N.t("options_lang_auto");
}

buildOptions();
select.value = currentPref();
refresh();

select.addEventListener("change", () => {
  I18N.setLang(select.value); // "" => automatyczny (język przeglądarki)
  // zapis też do chrome.storage (kopia/synchronizacja informacyjna)
  try {
    chrome.storage.local.set({ wfs_lang: select.value || null });
  } catch (e) {
    /* ignore */
  }
  refresh();
  savedEl.textContent = I18N.t("options_saved");
  setTimeout(() => (savedEl.textContent = ""), 1500);
});
