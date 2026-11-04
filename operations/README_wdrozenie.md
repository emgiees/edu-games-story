# KONTRAKT — wdrożenie

Gra decyzyjna do przedmiotu „Analityka operacyjna i procesów pracy" (UG). Trzecia gra serii edu-games-story: React + Firebase Realtime Database + GitHub Pages, wszystko po stronie przeglądarki, bez etapu budowania.

## Zawartość folderu

| Plik | Rola |
|---|---|
| `index.html` | powłoka, style, biblioteki z CDN |
| `config.js` | **konfiguracja Firebase** + cała treść fabularna, tabele UMEWAP, zdarzenia, epilogi |
| `engines.js` | matematyka: generatory danych per zespół, rozwiązania wzorcowe, walidacja, symulacja KPI |
| `app.jsx` | interfejs (zespoły, konsola prowadzącego, projektor) |
| `test_engines.js` | testy silnika (node) — 44 asercje względem wartości zweryfikowanych w Pythonie |
| `PRZEWODNIK_PROWADZACEGO.md` | instrukcja prowadzenia zajęć |

## Wdrożenie

1. Folder `operations/` jest już w repozytorium `edu-games-story`, a `config.js` ma wklejoną konfigurację projektu Firebase `my-edu-games` (tę samą co pozostałe gry). Gra zapisuje dane pod własną gałęzią `kontrakt/games/<KOD GRY>/`, więc nie koliduje z poprzednimi grami.
2. **Reguły Firebase muszą zawierać gałąź `kontrakt`** — bez niej baza odrzuca każdy zapis („permission denied”), a gra zgłasza to komunikatem na stronie startowej. Pełne reguły (z zachowaniem `rooms`, `quiz_results` i `retraction-room`) wkleja się w konsoli Firebase → Realtime Database → Reguły → Opublikuj. Fragment dla tej gry:

```json
"kontrakt": {
  ".read": true,
  "games": {
    "$code": {
      ".write": "!data.exists() || newData.exists()",
      ".validate": "$code.matches(/^[A-Z0-9]{3,10}$/)",
      "config": {
        ".validate": "newData.hasChildren(['pin', 'created'])",
        "pin": { ".validate": "newData.isString() && newData.val().length <= 10" },
        "created": { ".validate": "newData.isNumber()" },
        "$other": { ".validate": false }
      },
      "episode": { ".validate": "newData.isNumber() && newData.val() >= 0 && newData.val() <= 5" },
      "events": { "$eventId": { ".validate": "$eventId.matches(/^[a-z0-9_-]{1,30}$/) && newData.isNumber()" } },
      "teams": {
        "$teamId": {
          ".validate": "$teamId.matches(/^[a-z0-9-]{1,24}$/)",
          "name": { ".validate": "newData.isString() && newData.val().length <= 60" }
        }
      },
      "$other": { ".validate": false }
    }
  }
}
```

   Reguły blokują usunięcie całej gry i dopisywanie nieznanych pól; dane zespołów (zadania, KPI, symulacje) są zapisywane swobodnie.
3. Gra jest dostępna pod `https://emgiees.github.io/edu-games-story/operations/` (GitHub Pages z gałęzi `main`).

## Zapis i wczytywanie postępów (sale / grupy)

- Każda grupa zajęciowa to osobna gra: prowadzący klika „Panel prowadzącego” → „Utwórz nową grę” i dostaje **KOD GRY** (5 liter) i **PIN**. Zapisz oba — np. jeden kod na grupę/salę.
- Wszystko (zespoły, odpowiedzi, punkty, KPI, bieżący epizod) zapisuje się na bieżąco w Firebase pod tym kodem. Nie ma osobnego przycisku „zapisz”.
- Na kolejnych zajęciach: zespół wpisuje **ten sam kod gry i tę samą nazwę zespołu** (wielkość liter i polskie znaki nie mają znaczenia) i wraca dokładnie tam, gdzie skończył. Prowadzący wchodzi do konsoli tym samym kodem i PIN-em.
- Odświeżenie strony w trakcie zajęć nie gubi stanu (widok pamięta się w karcie przeglądarki).

## Test lokalny przed zajęciami

Babel dociąga `app.jsx` przez XHR, więc plik otwarty podwójnym kliknięciem (adres `file://`) nie zadziała. Uruchom lokalny serwer w folderze gry:

```bash
python3 -m http.server 8000
# potem http://localhost:8000
```

Na stronie startowej wybierz „Tryb testowy (lokalnie)” (albo dopisz `?local=1` do adresu): gra przełącza się na zapis w przeglądarce, bez Firebase — testy nigdy nie trafiają do wspólnej bazy. Wchodzisz jako zespół testowy z epizodem 1 otwartym; konsolę otworzysz kodem `LOKAL` i PIN `0000`. Tryb lokalny obsługuje jedną kartę przeglądarki naraz.

Testy matematyki (opcjonalnie, wymaga node):

```bash
node test_engines.js
```

## Kafelek na stronę hubu

Dopasuj klasy do istniejących kart na stronie głównej; treść:

```html
<a href="operations/" class="game-card">
  <h3>KONTRAKT</h3>
  <p>Fabryka Mebli FALA podpisała kontrakt życia ze skandynawską siecią NORDIKA.
  Cztery miesiące, cztery epizody: prognozy i MRP, wąskie gardła i Solver,
  transport i CPM, normy pracy i UMEWAP. Analityka operacyjna jako gra decyzyjna.</p>
  <span>4 epizody · zespoły 3–5 os. · Excel + Solver</span>
</a>
```

## Edycja treści

Wszystkie treści są w `config.js`: dialogi, wywiady, pula problemów 1.1, opcje CRP, tabele UMEWAP (skale, klucz ekspercki, kategorie, widełki, budżet korekt), zdarzenia, epilogi, debriefingi. Parametry losowania danych (zakresy marż, kosztów itd.) są w generatorach w `engines.js`. Po każdej zmianie w `engines.js` warto przepuścić `node test_engines.js`.
