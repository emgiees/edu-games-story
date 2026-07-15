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

## Wdrożenie w 3 krokach

1. Skopiuj cały folder `operations/` do repozytorium `edu-games-story` (obok folderów poprzednich gier).
2. W `config.js` na górze pliku wklej do `FIREBASE_CONFIG` konfigurację **tego samego projektu Firebase**, którego używają Building Tomorrow i The Turnaround (gra zapisuje dane pod własnym kluczem `kontrakt/`, więc nie koliduje z poprzednimi grami).
3. Commit i push. Gra będzie dostępna pod `https://emgiees.github.io/edu-games-story/operations/`.

Dopóki w `FIREBASE_CONFIG` zostaje tekst `WKLEJ-...`, gra działa w trybie lokalnym: jedna drużyna, zapis w przeglądarce, konsola dostępna. To wystarcza do pełnego przetestowania wszystkich zadań bez żadnej konfiguracji.

## Reguły bazy Firebase

Jeżeli reguły Realtime Database są ustawione per gałąź, dodaj wpis analogiczny do poprzednich gier:

```json
"kontrakt": { ".read": true, ".write": true }
```

Uwaga jak przy poprzednich grach: publiczny odczyt i zapis gałęzi jest wygodny na zajęcia, ale nie trzymaj tam niczego wrażliwego; kod gry (5 liter) i PIN prowadzącego pełnią rolę miękkiej bariery.

## Test lokalny przed zajęciami

Babel dociąga `app.jsx` przez XHR, więc plik otwarty podwójnym kliknięciem (adres `file://`) nie zadziała. Uruchom lokalny serwer w folderze gry:

```bash
python3 -m http.server 8000
# potem http://localhost:8000
```

Na stronie startowej wybierz „Tryb testowy (lokalnie)": wchodzisz jako zespół testowy z epizodem 1 otwartym; konsolę otworzysz kodem `LOKAL` i PIN `0000`.

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
