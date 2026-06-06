# Chrome Web Store — listing (Wolfie Font Swapper)

## Name
Wolfie Font Swapper

## Category
Developer Tools (alternatywnie: Productivity)

## Short description (≤132 chars)
**EN:** Quickly swap and preview fonts on any page — Google Fonts + system fonts, presets, and copyable CSS/SCSS/JS snippets.

**PL:** Szybka podmiana i podgląd fontów na każdej stronie — Google Fonts + systemowe, presety i gotowe snippety CSS/SCSS/JS.

---

## Detailed description

### EN
**Preview any font on any website — instantly.**

Wolfie Font Swapper lets you try fonts live on the page you're looking at, without touching code. Pick from 300+ Google Fonts (loaded on demand) or the fonts installed on your system, and watch the page update immediately.

✦ **Searchable font picker** — start typing, results filter on the fly. Popular Google Fonts are pinned to the top (★).
✦ **Target what you want** — set fonts independently for the whole page, headings (h1–h6), paragraphs, navigation, and buttons.
✦ **Fine‑tune with one tap** — quick chips for weight (Light → Extra Bold), letter‑spacing, size, and letter case (UPPERCASE / lowercase / Capitalize for buttons).
✦ **Presets** — save up to 5 looks and switch between them; they persist across sessions.
✦ **Copy‑ready snippets** — grab the exact CSS, SCSS, or JS to drop the font into your own project. The Google Fonts files are embedded so the preview works even on sites with strict CSP.
✦ **System fonts** — with your permission, browse fonts actually installed on your machine.
✦ **9 languages** — PL, EN, FR, DE, ES, UK, RU, RO, IT. Follows your browser language; switchable in Options.
✦ **One‑click reset** and a handy **Ctrl+Shift+L** shortcut.

No tracking, no accounts, no data collection. Fonts are fetched directly from Google's public endpoints only when you preview them.

### PL
**Podejrzyj dowolny font na dowolnej stronie — natychmiast.**

Wolfie Font Swapper pozwala testować fonty na żywo na oglądanej stronie, bez dotykania kodu. Wybierz z ponad 300 Google Fonts (ładowane na żądanie) lub z fontów zainstalowanych w systemie — strona zmieni się od razu.

✦ **Wyszukiwarka fontów** — zacznij pisać, lista filtruje się na bieżąco. Popularne Google Fonts przypięte na górze (★).
✦ **Osobne sekcje** — cała strona, nagłówki (h1–h6), akapity, nawigacja i przyciski.
✦ **Szybkie chipy** — grubość (Light → Extra Bold), odstęp liter, rozmiar, wielkość liter (dla przycisków).
✦ **Presety** — zapisz do 5 zestawów i przełączaj się między nimi; przetrwają zamknięcie przeglądarki.
✦ **Gotowe snippety** — skopiuj CSS, SCSS lub JS do swojego projektu. Pliki fontów są osadzone, więc podgląd działa nawet przy ostrym CSP.
✦ **Fonty systemowe**, **9 języków**, **reset jednym kliknięciem**, skrót **Ctrl+Shift+L**.

Bez śledzenia, kont i zbierania danych.

---

## Screenshots (1280×800)
1. **01-hero.png** — dodatek w akcji: popup nad artykułem na Wikipedii (po zmianie fontów).
2. **02-result.png** — efekt na stronie (nagłówki Playfair Display, tekst Merriweather).
3. **03-before.png** — strona przed zmianą (porównanie).
4. **04-popup.png** — interfejs popupu (sekcje, chipy, presety) na gradiencie marki.

## Promo tile
- **promo-440x280.png** — mały kafelek promocyjny (Small promo tile, 440×280) wymagany przy promowaniu w sklepie.

## Privacy
Polityka prywatności (hostowana): **https://wfs.wolfiesites.com/policy** (źródło: PRIVACY.md w repo).

## Permission justification (dla recenzji)
- **activeTab + scripting** — wstrzyknięcie/zdjęcie podglądu fontu na karcie po otwarciu panelu (gest użytkownika).
- **storage** — lokalne zapamiętanie wyboru, presetów, **reguł per-domena** i języka.
- **Content script na wszystkich stronach (`<all_urls>`)** — wymagany, bo dodatek **auto-stosuje zapisane przez użytkownika reguły fontów per-domena** przy powrocie na daną stronę (oraz pozwala otworzyć panel na dowolnej stronie). Czyta wyłącznie **hostname** strony (do dopasowania reguły) i wstrzykuje CSS — **nie czyta ani nie wysyła treści strony**, historii, ani wpisywanego tekstu. Brak analityki/trackingu.
- **host_permissions: fonts.googleapis.com, fonts.gstatic.com, fonts.google.com** — pobranie podglądanych fontów Google + metadanych katalogu. **extensionpay.com** — wyłącznie subskrypcja Pro (płatność przez ExtensionPay/Stripe; deweloper nie widzi danych karty).

## Data usage (formularz CWS)
- **Nie** zbieramy/­sprzedajemy danych osobowych. Brak analityki.
- Jedyne dane opuszczające urządzenie: (1) standardowe żądania Google Fonts do Google przy podglądzie, (2) **tylko przy Pro** — email/płatność do ExtensionPay/Stripe.
- Zadeklaruj w formularzu: „Payment information" + „Authentication information" (email) **tylko jeśli** włączysz Pro; reszta — none.

## Homepage
https://wolfiesites.com

---

# Localized listings (CWS per-locale)

> Wklej do Chrome Web Store → *Store listing* → per-language. EN + PL są wyżej.
> Short description ≤132 znaki.

## 🇫🇷 Français
**Short:** Changez et prévisualisez vite les polices de toute page — Google Fonts + polices système, préréglages, extraits CSS/SCSS/JS.

**Detailed:**
Prévisualisez n'importe quelle police sur n'importe quel site — instantanément.

Wolfie Font Swapper vous permet d'essayer des polices en direct sur la page que vous consultez, sans toucher au code. Choisissez parmi plus de 300 Google Fonts (chargées à la demande) ou les polices installées sur votre système, et regardez la page se mettre à jour immédiatement.

• Sélecteur de polices avec recherche — commencez à taper, les résultats se filtrent à la volée. Les Google Fonts populaires sont épinglées en haut (★).
• Ciblez ce que vous voulez — définissez les polices indépendamment pour toute la page, les titres (h1–h6), les paragraphes, la navigation et les boutons.
• Réglez finement d'un seul geste — des puces rapides pour la graisse, l'espacement des lettres, la taille, l'interligne et la casse.
• Préréglages — enregistrez vos styles favoris et basculez entre eux ; ils persistent d'une session à l'autre. Illimités avec Pro.
• Règles persistantes par domaine — épinglez un style à des sites précis et il s'applique automatiquement à votre retour.
• Extraits prêts à copier — récupérez le CSS, le SCSS ou le JS exact. Les fichiers Google Fonts sont intégrés pour que la prévisualisation fonctionne même sous une CSP stricte.
• Polices système — avec votre autorisation, parcourez les polices installées sur votre machine (noms seulement, conservés sur votre appareil).
• Étiquettes de licence — chaque police est étiquetée Web-safe / Free / Premium / System, pour ne jamais livrer une police que vous n'avez pas le droit d'utiliser.
• 9 langues et un raccourci pratique Ctrl+Shift+L.

Aucun suivi, aucun compte, aucune collecte de données. Les polices sont récupérées directement depuis les points de terminaison publics de Google uniquement lorsque vous les prévisualisez. Pro (en option, via ExtensionPay/Stripe) débloque les préréglages illimités.

## 🇩🇪 Deutsch
**Short:** Schriften auf jeder Seite blitzschnell tauschen & testen — Google Fonts + Systemfonts, Presets, CSS/SCSS/JS-Snippets.

**Detailed:**
Jede Schrift auf jeder Website testen — sofort.

Mit Wolfie Font Swapper probierst du Schriften live auf der Seite aus, die du gerade ansiehst, ganz ohne Code anzufassen. Wähle aus über 300 Google Fonts (bei Bedarf geladen) oder den auf deinem System installierten Schriften und sieh zu, wie sich die Seite sofort aktualisiert.

• Durchsuchbare Schriftauswahl — einfach tippen, und die Ergebnisse filtern sich in Echtzeit. Beliebte Google Fonts stehen ganz oben (★).
• Gezielt steuern — lege Schriften unabhängig fest für die ganze Seite, Überschriften (h1–h6), Absätze, Navigation und Buttons.
• Feinabstimmung mit einem Tipp — schnelle Chips für Schriftstärke, Laufweite, Größe, Zeilenhöhe und Groß-/Kleinschreibung.
• Presets — speichere deine Lieblings-Looks und wechsle zwischen ihnen; sie bleiben über Sitzungen hinweg erhalten. Unbegrenzt mit Pro.
• Dauerhafte Regeln pro Domain — hefte einen Look an bestimmte Seiten, und er wird bei deiner Rückkehr automatisch angewendet.
• Kopierfertige Snippets — schnapp dir das exakte CSS, SCSS oder JS. Die Google-Fonts-Dateien sind eingebettet, sodass die Vorschau selbst unter strenger CSP funktioniert.
• Systemfonts — durchstöbere mit deiner Erlaubnis die auf deinem Rechner installierten Schriften (nur Namen, bleiben auf deinem Gerät).
• Lizenz-Tags — jede Schrift ist als Web-safe / Free / Premium / System gekennzeichnet, damit du nie eine Schrift einsetzt, die du rechtlich nicht nutzen darfst.
• 9 Sprachen und ein praktisches Tastenkürzel Ctrl+Shift+L.

Kein Tracking, keine Konten, keine Datenerfassung. Schriften werden ausschließlich beim Vorschauen direkt von Googles öffentlichen Endpunkten abgerufen. Pro (optional, über ExtensionPay/Stripe) schaltet unbegrenzte Presets frei.

## 🇪🇸 Español
**Short:** Cambia y previsualiza fuentes en cualquier página — Google Fonts + fuentes del sistema, presets y CSS/SCSS/JS.

**Detailed:**
Previsualiza cualquier fuente en cualquier sitio web — al instante.

Wolfie Font Swapper te permite probar fuentes en vivo en la página que estás viendo, sin tocar código. Elige entre más de 300 Google Fonts (cargadas bajo demanda) o las fuentes instaladas en tu sistema, y mira cómo la página se actualiza de inmediato.

• Selector de fuentes con búsqueda — empieza a escribir y los resultados se filtran al vuelo. Las Google Fonts más populares aparecen fijadas arriba (★).
• Apunta a lo que quieras — configura fuentes de forma independiente para toda la página, los encabezados (h1–h6), los párrafos, la navegación y los botones.
• Ajusta con un solo toque — chips rápidos para grosor, espaciado entre letras, tamaño, interlineado y mayúsculas/minúsculas.
• Presets — guarda tus combinaciones favoritas y alterna entre ellas; se conservan entre sesiones. Ilimitados con Pro.
• Reglas persistentes por dominio — fija un estilo a sitios concretos y se aplica automáticamente cuando vuelves.
• Fragmentos listos para copiar — obtén el CSS, SCSS o JS exacto. Los archivos de Google Fonts van incrustados, así que la vista previa funciona incluso con una CSP estricta.
• Fuentes del sistema — con tu permiso, explora las fuentes instaladas en tu equipo (solo los nombres, que se quedan en tu dispositivo).
• Etiquetas de licencia — cada fuente se etiqueta como Web-safe / Free / Premium / System, para que nunca publiques una fuente que no puedas usar legalmente.
• 9 idiomas y un práctico atajo Ctrl+Shift+L.

Sin rastreo, sin cuentas, sin recopilación de datos. Las fuentes se obtienen directamente de los endpoints públicos de Google solo cuando las previsualizas. Pro (opcional, vía ExtensionPay/Stripe) desbloquea presets ilimitados.

## 🇺🇦 Українська
**Short:** Швидко змінюйте та переглядайте шрифти на будь-якій сторінці — Google Fonts + системні, пресети й CSS/SCSS/JS.

**Detailed:**
Переглядайте будь-який шрифт на будь-якому сайті — миттєво.

Wolfie Font Swapper дозволяє приміряти шрифти просто на сторінці, яку ви переглядаєте, без жодного коду. Обирайте з-понад 300 Google Fonts (завантажуються за потреби) або зі шрифтів, встановлених у вашій системі, і спостерігайте, як сторінка оновлюється миттєво.

• Пошук у списку шрифтів — почніть вводити, і результати фільтруються на льоту. Популярні Google Fonts закріплені вгорі (★).
• Налаштовуйте саме те, що потрібно — задавайте шрифти окремо для всієї сторінки, заголовків (h1–h6), абзаців, навігації та кнопок.
• Тонке налаштування одним дотиком — швидкі чипи для насиченості, міжлітерного інтервалу, розміру, висоти рядка та регістру літер.
• Пресети — зберігайте улюблені варіанти й перемикайтеся між ними; вони зберігаються між сеансами. Без обмежень із Pro.
• Постійні правила для доменів — закріпіть вигляд за конкретними сайтами, і він застосовуватиметься автоматично, коли ви повертаєтеся.
• Готові до копіювання фрагменти — отримайте точний CSS, SCSS або JS. Файли Google Fonts вбудовано, тож попередній перегляд працює навіть за суворої CSP.
• Системні шрифти — з вашого дозволу переглядайте шрифти, встановлені на вашому пристрої (лише назви, що залишаються на вашому пристрої).
• Теги ліцензій — кожен шрифт позначено як Web-safe / Free / Premium / System, тож ви ніколи не використаєте шрифт, на який не маєте прав.
• 9 мов і зручне сполучення клавіш Ctrl+Shift+L.

Жодного відстеження, жодних облікових записів, жодного збору даних. Шрифти завантажуються безпосередньо з публічних серверів Google лише тоді, коли ви їх переглядаєте. Pro (опціонально, через ExtensionPay/Stripe) розблоковує необмежену кількість пресетів.

## 🇷🇺 Русский
**Short:** Быстрая замена и предпросмотр шрифтов на любой странице — Google Fonts + системные шрифты, пресеты и CSS/SCSS/JS.

**Detailed:**
Предпросмотр любого шрифта на любом сайте — мгновенно.

Wolfie Font Swapper позволяет примерять шрифты вживую прямо на странице, которую вы просматриваете, не прикасаясь к коду. Выбирайте из 300+ Google Fonts (загружаются по запросу) или шрифтов, установленных в вашей системе, и наблюдайте, как страница обновляется сразу же.

• Поиск по шрифтам — начните печатать, и результаты фильтруются на лету. Популярные Google Fonts закреплены вверху (★).
• Точное нацеливание — задавайте шрифты по отдельности для всей страницы, заголовков (h1–h6), абзацев, навигации и кнопок.
• Тонкая настройка одним касанием — быстрые чипы для насыщенности, межбуквенного интервала, размера, межстрочного интервала и регистра букв.
• Пресеты — сохраняйте любимые оформления и переключайтесь между ними; они сохраняются между сессиями. Без ограничений с Pro.
• Постоянные правила для доменов — закрепите оформление за конкретными сайтами, и оно применится автоматически при возвращении.
• Готовые к копированию сниппеты — берите точный CSS, SCSS или JS. Файлы Google Fonts встроены, поэтому предпросмотр работает даже при строгой CSP.
• Системные шрифты — с вашего разрешения просматривайте шрифты, установленные на вашем устройстве (только названия, остаются на вашем устройстве).
• Метки лицензий — каждый шрифт помечен Web-safe / Free / Premium / System, так что вы никогда не выпустите шрифт, который не имеете права использовать.
• 9 языков и удобное сочетание клавиш Ctrl+Shift+L.

Никакого отслеживания, никаких аккаунтов, никакого сбора данных. Шрифты загружаются напрямую с публичных эндпоинтов Google только в момент предпросмотра. Pro (опционально, через ExtensionPay/Stripe) открывает неограниченное число пресетов.

## 🇷🇴 Română
**Short:** Schimbă și previzualizează rapid fonturile pe orice pagină — Google Fonts + fonturi de sistem, presetări și CSS/SCSS/JS.

**Detailed:**
Previzualizează orice font pe orice site web — instant.

Wolfie Font Swapper îți permite să încerci fonturi live pe pagina pe care o privești, fără să atingi codul. Alege dintre peste 300 de Google Fonts (încărcate la cerere) sau dintre fonturile instalate pe sistemul tău și vezi pagina actualizându-se imediat.

• Selector de fonturi cu căutare — începe să scrii, iar rezultatele se filtrează din mers. Cele mai populare Google Fonts sunt fixate în partea de sus (★).
• Țintește exact ce vrei — setează fonturi independent pentru întreaga pagină, titluri (h1–h6), paragrafe, navigație și butoane.
• Reglaje fine dintr-o atingere — chip-uri rapide pentru grosime, spațiere între litere, dimensiune, înălțimea rândului și majuscule/minuscule.
• Presetări — salvează aspectele preferate și comută între ele; se păstrează între sesiuni. Nelimitate cu Pro.
• Reguli persistente per-domeniu — fixează un aspect pentru anumite site-uri și se aplică automat când revii.
• Fragmente gata de copiat — preia exact codul CSS, SCSS sau JS. Fișierele Google Fonts sunt încorporate, așa că previzualizarea funcționează chiar și sub un CSP strict.
• Fonturi de sistem — cu permisiunea ta, răsfoiește fonturile instalate pe mașina ta (doar numele, păstrate pe dispozitivul tău).
• Etichete de licență — fiecare font este etichetat Web-safe / Free / Premium / System, ca să nu publici niciodată un font pe care nu îl poți folosi legal.
• 9 limbi și o scurtătură utilă Ctrl+Shift+L.

Fără urmărire, fără conturi, fără colectare de date. Fonturile sunt preluate direct de la endpoint-urile publice Google doar atunci când le previzualizezi. Pro (opțional, prin ExtensionPay/Stripe) deblochează presetări nelimitate.

## 🇮🇹 Italiano
**Short:** Cambia e anteprima i font su qualsiasi pagina — Google Fonts + font di sistema, preset e snippet CSS/SCSS/JS copiabili.

**Detailed:**
Anteprima di qualsiasi font su qualsiasi sito web — all'istante.

Wolfie Font Swapper ti permette di provare i font dal vivo sulla pagina che stai guardando, senza toccare il codice. Scegli tra oltre 300 Google Fonts (caricati su richiesta) o i font installati sul tuo sistema e guarda la pagina aggiornarsi immediatamente.

• Selettore font con ricerca — inizia a digitare e i risultati si filtrano al volo. I Google Fonts più popolari sono fissati in cima (★).
• Scegli il tuo obiettivo — imposta i font in modo indipendente per l'intera pagina, i titoli (h1–h6), i paragrafi, la navigazione e i pulsanti.
• Regola con un tocco — chip rapidi per peso, spaziatura tra le lettere, dimensione, interlinea e maiuscole/minuscole.
• Preset — salva i tuoi stili preferiti e passa dall'uno all'altro; restano salvati tra le sessioni. Illimitati con Pro.
• Regole persistenti per dominio — fissa uno stile a siti specifici e verrà applicato automaticamente quando torni.
• Snippet pronti da copiare — ottieni l'esatto CSS, SCSS o JS. I file di Google Fonts sono incorporati, così l'anteprima funziona anche con una CSP rigorosa.
• Font di sistema — con il tuo permesso, sfoglia i font installati sul tuo computer (solo i nomi, conservati sul tuo dispositivo).
• Tag di licenza — ogni font è etichettato come Web-safe / Free / Premium / System, così non distribuirai mai un font che non puoi usare legalmente.
• 9 lingue e una comoda scorciatoia Ctrl+Shift+L.

Nessun tracciamento, nessun account, nessuna raccolta dati. I font vengono scaricati direttamente dagli endpoint pubblici di Google solo quando ne fai l'anteprima. Pro (opzionale, tramite ExtensionPay/Stripe) sblocca preset illimitati.
