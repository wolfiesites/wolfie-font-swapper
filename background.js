// Skrót klawiszowy Ctrl+Shift+L jest powiązany z "_execute_action",
// więc Chrome sam otwiera popup — tutaj nie jest wymagana dodatkowa logika.
// Plik istnieje, aby zarejestrować service workera i ułatwić ewentualne rozszerzenia.

chrome.runtime.onInstalled.addListener(() => {
  console.log("Wolfie Font Swapper zainstalowany. Skrót: Ctrl+Shift+L.");
});
