/* ============================================================
   KONTRAKT - konfiguracja gry i treści fabularne
   ============================================================
   1) FIREBASE: wklej poniżej konfigurację projektu Firebase
      (tę samą, której używają Building Tomorrow / The Turnaround).
      Dopóki pola zawierają "WKLEJ-", gra działa w trybie lokalnym
      (jedna drużyna, zapis w przeglądarce) - wystarczy do testów.
   2) Wszystkie treści fabularne i tabele (w tym UMEWAP) są tutaj
      i można je edytować bez dotykania logiki gry.
   ============================================================ */

const FIREBASE_CONFIG = {
    apiKey: "AIzaSyCSCc7QlbUv8f9Iae8eRZtLo9ER25feXkU",
  authDomain: "my-edu-games.firebaseapp.com",
  databaseURL: "https://my-edu-games-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "my-edu-games",
  storageBucket: "my-edu-games.firebasestorage.app",
  messagingSenderId: "535387410502",
  appId: "1:535387410502:web:512e168834426cdaf93a47"};

(typeof window !== 'undefined' ? window : globalThis).KONFIG = {

  meta: {
    tytul: 'KONTRAKT',
    podtytul: 'Analityka operacyjna i procesów pracy — gra decyzyjna',
    firma: 'Fabryka Mebli FALA sp. z o.o., Tczew',
    klient: 'NORDIKA (sieć skandynawska)',
    wersja: '1.0',
    rootKey: 'kontrakt' // gałąź w Firebase
  },

  kpiStart: { cash: 400000, otif: 100, unitCost: 262, climate: 62 },
  kpiWagi: { cash: 0.35, otif: 0.30, unitCost: 0.15, climate: 0.20 },
  progOTIF: 92,

  postacie: {
    joanna:    { name: 'Joanna Falkowska', rola: 'prezes zarządu', ini: 'JF', opis: 'Przejęła firmę po ojcu miesiąc temu. Podpisała kontrakt życia i wie, że fabryka nie jest na niego gotowa.' },
    grabowski: { name: 'inż. Ryszard Grabowski', rola: 'dyrektor produkcji', ini: 'RG', opis: '32 lata w FALI. Zna każdą maszynę po dźwięku. Danym nie ufa, ufa hali.' },
    magda:     { name: 'Magda Wiśniewska', rola: 'planistka produkcji', ini: 'MW', opis: 'Planuje całą fabrykę w trzech arkuszach i na karteczkach samoprzylepnych. Wie, gdzie leżą wszystkie trupy.' },
    szulc:     { name: 'Tomasz Szulc', rola: 'kierownik logistyki', ini: 'TS', opis: 'Ogarnia przewozy telefonem i intuicją. Intuicja bywa droga.' },
    beata:     { name: 'Beata Sowa', rola: 'kierownik kadr', ini: 'BS', opis: 'Pierwsza zauważyła, że lakiernia się sypie. Boi się rozmowy z Mazurem.' },
    mazur:     { name: 'Henryk Mazur', rola: 'przewodniczący związku', ini: 'HM', opis: 'Twardy, ale uczciwy. Chce jednego: żeby płace miały logikę.' },
    zenek:     { name: 'pan Zenek', rola: 'brygadzista montażu', ini: 'Z', opis: 'Legenda hali. Montuje szufladę szybciej, niż inni ją podnoszą.' }
  },

  /* -------- E1.1: pula problemów do klasyfikacji (losowanych 12) -------- */
  problemyPula: [
    { t: 'Płyty wiórowe zamawiane są dopiero wtedy, gdy Magda zauważy pusty regał.', obszar: 'materialy', metoda: 'prognozy_mrp' },
    { t: 'Zapas okuć raz sięga sufitu, raz kończy się w środku zmiany.', obszar: 'materialy', metoda: 'prognozy_mrp' },
    { t: 'Nikt nie wie, ile płyty naprawdę zużywa jedna szafa — norma jest "z pamięci".', obszar: 'materialy', metoda: 'normowanie' },
    { t: 'Zużycie kleju w październiku przekroczyło budżet, nie wiadomo dlaczego.', obszar: 'materialy', metoda: 'prognozy_mrp' },
    { t: 'Deklaracje wolumenów dla NORDIKI powstają metodą "zeszły miesiąc plus trochę".', obszar: 'materialy', metoda: 'prognozy_mrp' },
    { t: 'Tiry do Skandynawii wracają puste, a stawki promowe rosną.', obszar: 'transport', metoda: 'przewozy' },
    { t: 'Każdy magazyn wysyła do tego klienta, który głośniej krzyczy.', obszar: 'transport', metoda: 'przewozy' },
    { t: 'NORDIKA wymaga awizacji dostaw z dokładnością do 30 minut.', obszar: 'transport', metoda: 'przewozy' },
    { t: 'Nikt nie porównał trasy przez Gdynię z trasą przez Świnoujście.', obszar: 'transport', metoda: 'przewozy' },
    { t: 'Koszt transportu na m³ nie jest nigdzie liczony.', obszar: 'transport', metoda: 'przewozy' },
    { t: 'Okleiniarka staje kilka razy w tygodniu, ale "zawsze tak było".', obszar: 'produkcja', metoda: 'harmonogram' },
    { t: 'Zlecenia idą na maszyny w kolejności zgłoszeń, pilne czekają za niepilnymi.', obszar: 'produkcja', metoda: 'harmonogram' },
    { t: 'Na linii montażu komód dwa stanowiska stoją, a jedno się nie wyrabia.', obszar: 'produkcja', metoda: 'harmonogram' },
    { t: 'Nikt nie wie, czy fabryka udźwignie +40% wolumenu.', obszar: 'produkcja', metoda: 'harmonogram' },
    { t: 'Braki jakościowe na trzeciej zmianie są wyraźnie wyższe.', obszar: 'produkcja', metoda: 'normowanie' },
    { t: 'Normy wydajności pochodzą "z sufitu" i nikt im nie wierzy.', obszar: 'hr', metoda: 'normowanie' },
    { t: 'Nowi pracownicy zarabiają więcej niż starzy na tych samych stanowiskach.', obszar: 'hr', metoda: 'normowanie' },
    { t: 'W pakowaniu nikt nie zagrzewa miejsca dłużej niż pół roku.', obszar: 'hr', metoda: 'normowanie' },
    { t: 'Absencja w lakierni jest dwa razy wyższa niż w reszcie zakładu.', obszar: 'hr', metoda: 'normowanie' },
    { t: 'Nie wiadomo, ilu ludzi naprawdę potrzeba w pakowaniu po wejściu kontraktu.', obszar: 'hr', metoda: 'normowanie' }
  ],
  obszary: [
    { id: 'materialy', nazwa: 'Materiały i zapasy' },
    { id: 'transport', nazwa: 'Transport i dystrybucja' },
    { id: 'produkcja', nazwa: 'Produkcja i zdolności' },
    { id: 'hr', nazwa: 'Zasoby ludzkie' }
  ],
  metody: [
    { id: 'prognozy_mrp', nazwa: 'Prognozowanie i MRP' },
    { id: 'przewozy', nazwa: 'Optymalizacja przewozów' },
    { id: 'harmonogram', nazwa: 'Harmonogramowanie i balansowanie' },
    { id: 'normowanie', nazwa: 'Normowanie i wartościowanie pracy' }
  ],

  /* -------- EPIZODY -------- */
  epizody: [
    {
      nr: 1, id: 'e1', tytul: 'Audyt', miesiac: 'Wrzesień',
      cel: 'Poznać firmę, zdiagnozować bałagan i zaplanować materiały pod rampę produkcyjną.',
      prolog: [
        { kto: 'narrator', tekst: 'Tczew, hala Fabryki Mebli FALA. Pachnie trocinami i świeżą kawą z automatu, który przyjmuje tylko monety dwuzłotowe.' },
        { kto: 'joanna', tekst: 'Miesiąc temu przejęłam firmę po tacie. Tydzień temu podpisałam kontrakt z NORDIKĄ: wolumen o czterdzieści procent większy, niż kiedykolwiek zrobiliśmy. Pierwsza wielka dostawa: grudzień.' },
        { kto: 'grabowski', tekst: 'Pani prezes, z całym szacunkiem: ta fabryka działa od czterdziestu lat bez żadnych analityków.' },
        { kto: 'joanna', tekst: 'Działa, panie Ryszardzie. Ale na oko. A NORDIKA nie płaci za "na oko". Dlatego od dziś macie Dział Analityki Operacyjnej. To wy.' },
        { kto: 'narrator', tekst: 'Joanna kładzie na stole klucz do "data roomu": trzech arkuszy Magdy, segregatora księgowej i notesu pana Zenka.' },
        { kto: 'joanna', tekst: 'Macie wrzesień na audyt. Powiedzcie mi, co tu naprawdę nie działa — i zabezpieczcie materiał na jesień. Od czegoś trzeba zacząć: porozmawiajcie z ludźmi.' }
      ],
      wywiady: [
        { npc: 'grabowski', pytanie: 'Co Pana zdaniem najbardziej kuleje na produkcji?', odpowiedz: 'Jakość. A konkretnie trzecia zmiana — to jakaś klątwa, braki lecą jak szalone. Ja bym ich wszystkich powymieniał. Ale niech pani/pan sprawdzi liczby, skoro jesteście od liczb.', hint: 'Brzmi jak hipoteza do testu: czy zmiany naprawdę różnią się istotnie? (zadanie 1.3)' },
        { npc: 'beata', pytanie: 'Skąd tyle nadgodzin w wykazach?', odpowiedz: 'Bo goni nas plan. Najwięcej biorą ludzie z trzeciej zmiany — i, między nami, po dwunastu godzinach nikt nie skleja idealnych korpusów.', hint: 'Druga hipoteza: braki rosną z nadgodzinami. Regresja to sprawdzi. (zadanie 1.3)' },
        { npc: 'magda', pytanie: 'Jak powstają prognozy sprzedaży?', odpowiedz: 'Prognozy? Biorę zeszły miesiąc i dodaję trochę. Jak jest wrzesień, to dodaję więcej, bo jesień zawsze ciągnie. Mam to wszystko w arkuszu, 24 miesiące wstecz.', hint: 'Ten arkusz to paczka danych do zadania 1.2. Sezonowość jesienna naprawdę istnieje.' },
        { npc: 'magda', pytanie: 'A zamówienia materiałów?', odpowiedz: 'To jest mój system — pokazuje monitor obklejony karteczkami. — Żółte to płyta, różowe okucia. Jak karteczka spada, to znaczy, że trzeba dzwonić. Okucia idą z importu, płyną trzy tygodnie, więc czasem... no, bywa nerwowo.', hint: 'Czasy dostaw (LT) będą kluczowe w planie MRP. (zadanie 1.4)' },
        { npc: 'zenek', pytanie: 'Co się dzieje z płytą przy przycince?', odpowiedz: 'Ano, panie, jak formatka źle wejdzie, to wiór. Norma mówi cztery płyty na szafę, ale my ostatnio bierzemy z zapasu jakby więcej. I jeszcze dostawca cenę podniósł, złodziejstwo.', hint: 'Dwa efekty naraz: ilość i cena. To klasyczna analiza odchyleń. (zadanie 1.5)' },
        { npc: 'joanna', pytanie: 'Czego NORDIKA wymaga w pierwszej kolejności?', odpowiedz: 'Deklaracji wolumenów na trzy miesiące do przodu. Jak zadeklarujemy za mało — oddamy półki konkurencji. Za dużo — zapłacimy kary za niedowiezienie. Potrzebuję prognozy, nie wróżby.', hint: 'Trafność prognozy przełoży się wprost na wynik firmy. (zadanie 1.2)' }
      ],
      zdarzenie: null,
      zadania: [
        { id: 'e1_1', nazwa: 'Mapa obszarów analityki', forma: 'gra', czas: '15 min' },
        { id: 'e1_2', nazwa: 'Prognoza popytu', forma: 'excel', czas: '40 min' },
        { id: 'e1_3', nazwa: 'Śledztwo jakościowe: ANOVA i regresja', forma: 'excel', czas: '30 min' },
        { id: 'e1_4', nazwa: 'Plan MRP dla szafy PAK-3D', forma: 'excel', czas: '45 min', zaleznosc: 'e1_2' },
        { id: 'e1_5', nazwa: 'Odchylenia zużycia materiałów', forma: 'gra', czas: '15 min' }
      ],
      debrief: [
        'Metody jakościowe to też analityka: wywiad i obserwacja wskazały, gdzie szukać (integracja danych jakościowych i ilościowych).',
        'Prognozowanie: średnia ruchoma vs wygładzanie wykładnicze vs trend — o wyborze decyduje walidacja wsteczna (MAPE), nie przyzwyczajenie.',
        'ANOVA odpowiada "czy grupy się różnią", regresja — "o ile i od czego". Grabowski i Beata mieli rację jednocześnie.',
        'MRP: potrzeby brutto → netto → planowane uruchomienia; cykl dostaw (LT) przesuwa zamówienie wstecz. Karteczki Magdy tego nie umieją.',
        'Analiza odchyleń rozdziela efekt ilości od efektu ceny — dwie różne rozmowy: z halą i z dostawcą.',
        'Literatura: Gruszczyński (red.), Ekonometria i badania operacyjne, PWN 2022 — rozdziały o prognozowaniu i regresji.'
      ]
    },
    {
      nr: 2, id: 'e2', tytul: 'Wąskie gardło', miesiac: 'Październik',
      cel: 'Rozpędzić produkcję pod kontrakt — i przeżyć awarię okleiniarki.',
      prolog: [
        { kto: 'narrator', tekst: 'Październik. Na hali wisi wydrukowany na A3 harmonogram dostaw NORDIKI. Ktoś dorysował pod nim zdenerwowaną buźkę.' },
        { kto: 'joanna', tekst: 'Wrzesień pokazał, gdzie jesteśmy. Teraz musimy pokazać, ile naprawdę umiemy wyprodukować.' },
        { kto: 'grabowski', tekst: 'Maszyny chodzą na sto procent, mówię od lat.' },
        { kto: 'magda', tekst: 'Ryszard, okleiniarka stała wczoraj dwie godziny. Znowu.' },
        { kto: 'grabowski', tekst: '...na dziewięćdziesiąt procent.' },
        { kto: 'joanna', tekst: 'Zmierzcie to. OEE dla trzech kluczowych maszyn, ustawcie linię komód, i policzcie, co produkować, żeby nie utopić marży. Liczby, nie wrażenia.' }
      ],
      wywiady: [
        { npc: 'grabowski', pytanie: 'Która maszyna jest sercem fabryki?', odpowiedz: 'Okleiniarka. Rocznik dziewięćdziesiąty szósty, niemiecka robota. Wszystko przez nią przechodzi — szafa, komoda, regał. Jak ona staje, staje fabryka.', hint: 'Wszystko przez nią przechodzi = kandydat na wąskie gardło. (zadania 2.1 i 2.3)' },
        { npc: 'zenek', pytanie: 'Jak ustawiona jest linia montażu komód?', odpowiedz: 'Po uważaniu, panie. Cztery stanowiska, bo cztery stoły były wolne. Tylko że u Krzyśka to się nudzą, a u mnie góra roboty. Ale zawsze tak było.', hint: 'Cztery stanowiska "bo tak" — sprawdź, ile potrzeba naprawdę. (zadanie 2.2)' },
        { npc: 'magda', pytanie: 'W jakiej kolejności puszcza Pani zlecenia?', odpowiedz: 'Jak przyszły, tak idą. Ostatnio NORDIKA wysłała pięć pilnych naraz — cięcie, potem oklejanie — i wszystko się skotłowało. Musi być jakaś mądrzejsza kolejność, tylko jaka?', hint: 'Dwa gniazda, pięć zleceń, minimalny czas całkowity — to zadanie z nazwiskiem. (zadanie 2.4)' },
        { npc: 'joanna', pytanie: 'Co jeśli nie zmieścimy wszystkiego w październiku?', odpowiedz: 'To produkujemy to, co daje najwięcej marży na godzinie wąskiego gardła. Wiem, że Grabowski dostanie zawału, jak usłyszy o wstrzymaniu któregoś produktu. Ale wolę jego zawał niż karę od NORDIKI.', hint: 'Marża na godzinie wąskiego gardła — dokładnie to policzy Solver. (zadanie 2.3)' },
        { npc: 'szulc', pytanie: 'Podobno jest oferta kooperacji?', odpowiedz: 'Zakład z Malborka odkupi od nas godziny oklejania, 62 złote za godzinę. Tylko uprzedzam: oni robią dobrze, ale nie tak dobrze jak my. Procent braków będzie wyższy.', hint: 'Jedna z trzech opcji domknięcia zdolności w listopadzie. (zadanie 2.5)' },
        { npc: 'beata', pytanie: 'Jak załoga znosi tempo?', odpowiedz: 'Na razie znosi. Ale jak dosypiecie nadgodzin, to każde czterdzieści godzin w miesiącu będzie kosztować atmosferę. Ludzie to nie okleiniarka, nie da się ich wyremontować w weekend.', hint: 'Nadgodziny są tanie w złotówkach, droższe w klimacie. (zadanie 2.5)' }
      ],
      zdarzenie: { tytul: 'AWARIA OKLEINIARKI', tekst: 'Huk, zapach spalenizny, cisza. Grabowski wychodzi z hali blady: "Wałek dociskowy. Serwis mówi: części z Niemiec, do końca miesiąca jedziemy na sześćdziesięciu procentach zdolności." Zdolność okleiniarki w zadaniu 2.3 już uwzględnia awarię.' },
      zadania: [
        { id: 'e2_1', nazwa: 'OEE i wąskie gardło', forma: 'gra', czas: '20 min' },
        { id: 'e2_2', nazwa: 'Balansowanie linii komód', forma: 'interaktywne', czas: '30 min' },
        { id: 'e2_3', nazwa: 'Optymalny asortyment (Solver)', forma: 'excel', czas: '45 min' },
        { id: 'e2_4', nazwa: 'Kolejność zleceń i Gantt', forma: 'interaktywne', czas: '25 min' },
        { id: 'e2_5', nazwa: 'CRP: domknięcie zdolności', forma: 'excel', czas: '30 min' }
      ],
      debrief: [
        'OEE = dostępność × wydajność × jakość. "Maszyny chodzą na sto procent" spotyka rzeczywistość.',
        'Balansowanie linii: minimalna liczba stanowisk = ⌈suma czasów / takt⌉; reszta to układanie z poprzedzaniami. Efektywność zależy od liczby stanowisk, wygładzenie — od Was.',
        'Programowanie liniowe: optimum leży w wierzchołku; cena dualna godziny okleiniarki mówi, ile warta jest godzina wąskiego gardła — zapamiętajcie tę liczbę, wróci w epizodzie 3.',
        'Reguła Johnsona daje optymalny przepływ dwóch gniazd — a intuicyjne FIFO zostawia pieniądze na stole.',
        'CRP: niedobór zdolności ma zawsze co najmniej trzy ceny — nadgodzin, kooperacji i inwestycji. Rachunek plus skutki miękkie.',
        'Literatura: Gruszczyński (red.) 2022 (programowanie liniowe); Wagner, Badania operacyjne, PWE 1980 (klasyka harmonogramowania).'
      ]
    },
    {
      nr: 3, id: 'e3', tytul: 'Logistyka', miesiac: 'Listopad',
      cel: 'Dowieźć towar do czterech odbiorców najtaniej, jak się da — i zainstalować nową okleiniarkę na czas.',
      prolog: [
        { kto: 'narrator', tekst: 'Listopad. Magazyn wysokiego składowania pełny po sufit. Palety z logo NORDIKI czekają na kierunek.' },
        { kto: 'joanna', tekst: 'Dobra wiadomość: mamy co wozić. Zła: Szulc wozi to "po swojemu".' },
        { kto: 'szulc', tekst: 'Po swojemu, czyli skutecznie! Wysyłam z tego magazynu, który ma towar, do tego klienta, który głośniej krzyczy.' },
        { kto: 'joanna', tekst: 'Tomasz, to jest definicja braku metody. — Odwraca się do Was. — Policzcie ten plan przewozów porządnie. I jeszcze jedno: zatwierdziłam zakup nowej okleiniarki. Wasza wycena godziny wąskiego gardła z października przekonała radę w pięć minut. Warunek banku: maszyna rusza przed grudniową dostawą.' },
        { kto: 'grabowski', tekst: 'Instalacja okleiniarki w niecały miesiąc? Fundamenty, elektryka, kalibracja, szkolenia... To się musi spiąć co do dnia.' },
        { kto: 'joanna', tekst: 'To niech się spina. Macie sieć czynności, macie metodę. Do roboty.' }
      ],
      wywiady: [
        { npc: 'szulc', pytanie: 'Skąd dokąd wozimy?', odpowiedz: 'Trzy punkty nadania: Tczew, Grudziądz i bufor w porcie Gdańsk. Czterech odbiorców: centra NORDIKI w Malmö i Kopenhadze, Hamburg i klient krajowy pod Wrocławiem. Stawki mam w telefonie... gdzieś.', hint: 'Macierz kosztów jest w paczce danych. Zacznij od kąta pn.-zach., skończ na optimum. (zadanie 3.1)' },
        { npc: 'szulc', pytanie: 'Jak jeździmy do Sztokholmu?', odpowiedz: 'Zawsze przez Gdynię, bo pierwszy odcinek najtańszy. Prom z Gdyni bywa kapryśny w listopadzie, ale co może pójść nie tak?', hint: '"Pierwszy odcinek najtańszy" to nie jest kryterium optymalności całej trasy. (zadanie 3.4)' },
        { npc: 'grabowski', pytanie: 'Co może opóźnić instalację okleiniarki?', odpowiedz: 'Wszystko. Ale najbardziej boję się elektryki — nowa maszyna ciągnie tyle prądu, że trzeba przerobić pół rozdzielni. Dostawa maszyny? Ta akurat przypłynie, Niemcy się nie spóźniają.', hint: 'Intuicja mówi "najdłuższa czynność najważniejsza". Sieć CPM zweryfikuje. (zadanie 3.3)' },
        { npc: 'joanna', pytanie: 'Czego pilnuje NORDIKA w listopadzie?', odpowiedz: 'Przysłali szablon scorecardu dostawcy: OTIF, koszt na metr sześcienny, wykorzystanie ładowności. Poniżej 92% OTIF zaczynają się kary umowne. Chcę znać nasze liczby, zanim oni je policzą.', hint: 'Trzy wskaźniki z danych o dostawach października. (zadanie 3.2)' },
        { npc: 'magda', pytanie: 'Kto koordynuje projekt instalacji?', odpowiedz: 'Formalnie Grabowski, praktycznie ja. Mam harmonogram... na serwetce. Dziesięć czynności, wiem, co po czym, ale nie wiem, co jest naprawdę krytyczne, a co może poczekać.', hint: 'Serwetka Magdy = tabela czynności w zadaniu 3.3.' },
        { npc: 'zenek', pytanie: 'Załoga gotowa na nową maszynę?', odpowiedz: 'Chłopaki się cieszą, tylko Heniek elektryk wziął urlop na grzyby. W listopadzie! Mówię mu: Heniu, prąd sam się nie podłączy. A on, że opieńki same się nie zbiorą.', hint: 'Ciekawe, czy czynność Heńka leży na ścieżce krytycznej...' }
      ],
      zdarzenie: { tytul: 'PROM ODWOŁANY', tekst: 'Telefon od armatora: sztorm na Bałtyku, połączenie z Gdyni zawieszone do odwołania. Trasa do Sztokholmu musi ominąć Gdynię — przelicz wariant awaryjny w zadaniu 3.4.' },
      zadania: [
        { id: 'e3_1', nazwa: 'Plan przewozów (zagadnienie transportowe)', forma: 'excel', czas: '45 min' },
        { id: 'e3_2', nazwa: 'Scorecard logistyki', forma: 'gra', czas: '15 min' },
        { id: 'e3_3', nazwa: 'Sieć CPM: instalacja okleiniarki', forma: 'interaktywne', czas: '40 min' },
        { id: 'e3_4', nazwa: 'Trasa do Sztokholmu (programowanie dynamiczne)', forma: 'interaktywne', czas: '30 min' }
      ],
      debrief: [
        'Zagadnienie transportowe: kąt pn.-zach. daje start, metoda najmniejszego kosztu — przyzwoitą heurystykę, optimum — realne oszczędności. Sekwencja kosztów Waszych trzech rozwiązań to cała lekcja.',
        'KPI logistyki: OTIF liczy się "na czas I w komplecie" — spójnik "i" jest w tym wskaźniku najdroższym słowem.',
        'CPM: krytyczne jest to, co ma zerowy zapas, a nie to, co najdłuższe. Dostawa maszyny miała zapas; elektryka nie. Skracanie czynności niekrytycznej to wyrzucanie pieniędzy.',
        'Programowanie dynamiczne: zasada Bellmana — optymalna trasa składa się z optymalnych końcówek. Zachłanne "najtańszy pierwszy krok" bywa pułapką.',
        'Cena dualna z epizodu 2 sfinansowała projekt z epizodu 3 — tak analityka składa się w decyzje inwestycyjne.',
        'Literatura: Gruszczyński (red.) 2022; Wagner 1980; a o badaniach operacyjnych w transporcie — pozycja 2 uzupełniającej listy lektur (Suchanek, Studia Ekonomiczne 165/2014).'
      ]
    },
    {
      nr: 4, id: 'e4', tytul: 'Ludzie', miesiac: 'Grudzień',
      cel: 'Zdiagnozować kadry, urealnić normy, zbudować sprawiedliwy taryfikator — i odwołać strajk przed wielką dostawą.',
      prolog: [
        { kto: 'narrator', tekst: 'Grudzień. Na bramie wisi plakat: POGOTOWIE STRAJKOWE. Ktoś dokleił pod spodem karteczkę Magdy: "proszę nie strajkować we wtorki, mamy wysyłkę".' },
        { kto: 'mazur', tekst: 'Pani prezes, ludzie mają dość. Płace to loteria: nowi zarabiają więcej od starych, magazynier więcej od stolarza. Normy są z sufitu. Lakiernia pada z nóg. Tydzień przed waszą wielką dostawą — mamy komitet strajkowy.' },
        { kto: 'joanna', tekst: 'Henryku, dajcie mi tydzień. Pokażę wam płace, które mają logikę — policzone, nie uznaniowe.' },
        { kto: 'mazur', tekst: 'Tydzień. I niech liczą ci nowi od analityki, nie księgowość. Księgowości już dziękujemy.' },
        { kto: 'joanna', tekst: '— Do Was, ciszej: — Diagnoza kadr, pomiar norm u Zenka, etatyzacja pakowania i pełne wartościowanie stanowisk. Budżet na korekty: osiem tysięcy miesięcznie. Od tego zależy dostawa. I trochę więcej niż dostawa.' }
      ],
      wywiady: [
        { npc: 'mazur', pytanie: 'Co konkretnie boli załogę w płacach?', odpowiedz: 'Że nie wiadomo, skąd się biorą. Pokażcie mi metodę: za co są punkty, jak punkty przechodzą na kategorie, kategorie na widełki. Jak metoda będzie uczciwa, podpiszę się pod nią pierwszy.', hint: 'To niemal definicja wartościowania analityczno-punktowego. (zadanie 4.5)' },
        { npc: 'mazur', pytanie: 'A normy pracy?', odpowiedz: 'Z sufitu. Zenkowi wpisali dwanaście sztuk na godzinę, bo tyle zrobił raz, w osiemdziesiątym dziewiątym, przed urlopem. Zmierzcie to uczciwie, z narzutami na odpoczynek, jak człowiek, nie jak stoper.', hint: 'Chronometraż z współczynnikiem tempa i narzutami. (zadanie 4.2)' },
        { npc: 'beata', pytanie: 'Co pokazują dane o absencji?', odpowiedz: 'Lakiernia mnie martwi od czerwca: zwolnienia lekarskie rosną z miesiąca na miesiąc. Zbieżność z wykazem nadgodzin jest... niepokojąca. Pamiętacie swoje wrześniowe śledztwo?', hint: 'Wątek z zadania 1.3 domyka się w dashboardzie HR. (zadanie 4.1)' },
        { npc: 'beata', pytanie: 'A rotacja?', odpowiedz: 'W pakowaniu drzwi się nie zamykają: przychodzą, uczą się, odchodzą do marketu za rogiem, bo tam płacą lepiej za lżejszą pracę. Koszt wdrożenia jednej osoby to dwa tygodnie brygadzisty.', hint: 'Rotacja = odejścia / przeciętne zatrudnienie. Przyczyna wyjdzie w taryfikatorze. (zadania 4.1 i 4.5)' },
        { npc: 'zenek', pytanie: 'Zgodzi się Pan na pomiar czasu pracy?', odpowiedz: 'Ja? Ja swoje robię, mierzcie na zdrowie. Tylko uprzedzam: jak mi wyjdzie mniej niż w papierach, to nie moja wina, że papiery pisał poeta.', hint: 'Dziesięć pomiarów montażu szuflady czeka w zadaniu 4.2.' },
        { npc: 'joanna', pytanie: 'Ile możemy wydać na podwyżki?', odpowiedz: 'Osiem tysięcy miesięcznie, ani złotówki więcej — bank patrzy nam na ręce po zakupie okleiniarki. Wydajcie je tam, gdzie taryfikator pokaże realną krzywdę, nie tam, gdzie kto głośniej krzyczy.', hint: 'Budżet korekt w zadaniu 4.5. Brzmi znajomo? Szulc też tak alokował przewozy.' }
      ],
      zdarzenie: { tytul: 'NEGOCJACJE', tekst: 'Mazur siada przy stole i rozkłada ręce: "Słucham. Przekonajcie mnie liczbami." Wynik negocjacji policzy się z Waszych zadań: diagnozy, pomiaru norm, decyzji kadrowych i taryfikatora.' },
      zadania: [
        { id: 'e4_1', nazwa: 'Dashboard HR: diagnoza', forma: 'interaktywne', czas: '30 min' },
        { id: 'e4_2', nazwa: 'Chronometraż u pana Zenka', forma: 'gra', czas: '20 min' },
        { id: 'e4_3', nazwa: 'Etatyzacja pakowania', forma: 'excel', czas: '25 min', zaleznosc: 'e4_1' },
        { id: 'e4_4', nazwa: 'VSM: zamówienie → wysyłka', forma: 'interaktywne', czas: '30 min' },
        { id: 'e4_5', nazwa: 'UMEWAP i taryfikator', forma: 'interaktywne', czas: '50 min' }
      ],
      debrief: [
        'Wskaźniki kadrowe (absencja, rotacja) to system wczesnego ostrzegania — anomalia w lakierni była widoczna od czerwca, wystarczyło policzyć.',
        'Chronometraż: czas normatywny = czas średni × współczynnik tempa × (1 + narzuty). Norma "z sufitu" przegrała z pomiarem — i Mazur to uszanował.',
        'Etatyzacja: pracochłonność / efektywny fundusz czasu. Fundusz efektywny jest zawsze mniejszy, niż się wydaje — urlopy i absencja są częścią rachunku, nie niespodzianką.',
        'VSM: czas przetwarzania to ułamek czasu przejścia (PCE kilka procent!) — skracamy czekanie, nie pracę.',
        'Wartościowanie: metoda rangowa daje kolejność bez uzasadnienia; analityczno-punktowa (UMEWAP) — uzasadnienie, które obroni się przed związkiem. Porównajcie swój ranking intuicyjny z punktacją: kto awansował?',
        'Literatura: Martyniak (red.), Metodologia wartościowania pracy, PWN 2014; Armstrong, Zarządzanie wynagrodzeniami, 2021; Borkowska, Strategie wynagrodzeń, 2021.'
      ]
    }
  ],

  /* -------- CRP: opcje (E2.5) -------- */
  crp: {
    opis: 'Listopadowy plan produkcji nie mieści się w zdolnościach okleiniarki. Niedobór godzin (H) wynika z Twojego MPS — jest podany w zadaniu. Policz koszt każdej opcji i wybierz wariant.',
    opcje: [
      { id: 'OT', nazwa: 'Nadgodziny', opis: '57 zł/h, limit 144 h/mies. (+20% zdolności). Skutek uboczny: −4 pkt klimatu za każde pełne 40 h.' },
      { id: 'COOP', nazwa: 'Kooperacja (Malbork)', opis: '62 zł/h ekwiwalentu, bez limitu. Skutek uboczny: +2 p.p. braków na wolumenie kooperowanym (koszt jednostkowy w górę).' },
      { id: 'SHIFT', nazwa: 'II zmiana na okleiniarce', opis: 'Koszt stały 18 000 zł/mies. (dodatki, rozruch). Skutek uboczny: +2 pkt klimatu (nowe etaty), otwiera wątek rekrutacji w epizodzie 4.' }
    ]
  },

  /* -------- UMEWAP (E4.5): wersja dydaktyczna wzorowana na UMEWAP-2000 --------
     Skale uproszczone na potrzeby zajęć; strukturę i pułapy można podmienić
     wg Martyniak (red.) 2014 bez zmian w kodzie gry. */
  umewap: {
    etykieta: 'UMEWAP-2000 (adaptacja dydaktyczna)',
    scale: [
      { id: 'A', name: 'Złożoność pracy', sub: [
        { id: 'A1', name: 'Wykształcenie zawodowe', pts: [5, 10, 15, 20, 25] },
        { id: 'A2', name: 'Doświadczenie zawodowe', pts: [4, 8, 12, 16, 20] },
        { id: 'A3', name: 'Innowacyjność, twórczość', pts: [2, 5, 8, 12, 15] },
        { id: 'A4', name: 'Zręczność', pts: [2, 4, 6, 8, 10] }
      ] },
      { id: 'B', name: 'Odpowiedzialność', sub: [
        { id: 'B1', name: 'Za przebieg i skutki pracy', pts: [5, 10, 15, 20, 25] },
        { id: 'B2', name: 'Za decyzje', pts: [3, 7, 11, 15, 20] },
        { id: 'B3', name: 'Za środki i przedmioty pracy', pts: [2, 5, 8, 11, 15] },
        { id: 'B4', name: 'Za bezpieczeństwo innych', pts: [2, 5, 8, 11, 15] },
        { id: 'B5', name: 'Za kontakty zewnętrzne', pts: [1, 3, 6, 9, 12] }
      ] },
      { id: 'C', name: 'Współpraca', sub: [
        { id: 'C1', name: 'Współdziałanie', pts: [2, 4, 7, 10, 14] },
        { id: 'C2', name: 'Motywowanie i kierowanie', pts: [0, 4, 8, 12, 16] }
      ] },
      { id: 'D', name: 'Uciążliwość pracy', sub: [
        { id: 'D1', name: 'Wysiłek fizyczny', pts: [2, 5, 8, 11, 15] },
        { id: 'D2', name: 'Wysiłek psychonerwowy i umysłowy', pts: [2, 4, 7, 10, 13] },
        { id: 'D3', name: 'Monotonia', pts: [1, 3, 5, 7, 10] },
        { id: 'D4', name: 'Warunki pracy', pts: [2, 5, 8, 11, 15] }
      ] }
    ],
    jobs: [
      { id: 'pakowanie', name: 'Pracownik pakowania', pay: 4300, opis: 'Pakuje elementy do kartonów wg specyfikacji, praca powtarzalna, fizyczna.' },
      { id: 'magazynier', name: 'Magazynier', pay: 5900, opis: 'Przyjęcia, wydania, wózek widłowy, odpowiada za stany magazynowe.' },
      { id: 'stolarz', name: 'Stolarz-monter', pay: 5400, opis: 'Montaż korpusów i elementów, praca precyzyjna przy różnych wyrobach.' },
      { id: 'operator', name: 'Operator okleiniarki', pay: 5800, opis: 'Obsługa kluczowej maszyny, ustawienia, drobna konserwacja.' },
      { id: 'brygadzista', name: 'Brygadzista montażu', pay: 6900, opis: 'Kieruje brygadą 8 osób, rozdziela pracę, odpowiada za BHP zespołu.' },
      { id: 'planistka', name: 'Planistka produkcji', pay: 5600, opis: 'Układa harmonogram całej fabryki, zamawia materiały, kontakt z klientami.' }
    ],
    expertKey: {
      pakowanie:   { A1: 1, A2: 1, A3: 1, A4: 2, B1: 2, B2: 1, B3: 1, B4: 1, B5: 1, C1: 2, C2: 1, D1: 4, D2: 2, D3: 5, D4: 3 },
      magazynier:  { A1: 2, A2: 2, A3: 1, A4: 2, B1: 2, B2: 2, B3: 3, B4: 2, B5: 2, C1: 2, C2: 1, D1: 4, D2: 2, D3: 3, D4: 3 },
      stolarz:     { A1: 3, A2: 3, A3: 2, A4: 4, B1: 3, B2: 2, B3: 3, B4: 2, B5: 1, C1: 2, C2: 1, D1: 4, D2: 3, D3: 3, D4: 3 },
      operator:    { A1: 3, A2: 3, A3: 2, A4: 4, B1: 3, B2: 2, B3: 4, B4: 3, B5: 1, C1: 2, C2: 1, D1: 3, D2: 3, D3: 3, D4: 3 },
      brygadzista: { A1: 3, A2: 4, A3: 3, A4: 3, B1: 4, B2: 3, B3: 3, B4: 4, B5: 2, C1: 4, C2: 4, D1: 3, D2: 4, D3: 2, D4: 3 },
      planistka:   { A1: 4, A2: 4, A3: 4, A4: 2, B1: 5, B2: 5, B3: 3, B4: 2, B5: 4, C1: 4, C2: 2, D1: 1, D2: 5, D3: 2, D4: 1 }
    },
    bands: [
      { kat: 'I',   min: 0,   w: [3800, 4200] },
      { kat: 'II',  min: 60,  w: [4200, 4800] },
      { kat: 'III', min: 80,  w: [4600, 5200] },
      { kat: 'IV',  min: 100, w: [5200, 6000] },
      { kat: 'V',   min: 120, w: [5800, 6600] },
      { kat: 'VI',  min: 140, w: [6200, 7200] },
      { kat: 'VII', min: 160, w: [6800, 7800] },
      { kat: 'VIII', min: 180, w: [7400, 8400] },
      { kat: 'IX',  min: 200, w: [8000, 9000] }
    ],
    anomalie: ['planistka', 'magazynier'],
    underpaid: 'planistka',
    budzet: 8000,
    sumTol: 12,
    poziomy: ['bardzo niski', 'niski', 'średni', 'wysoki', 'bardzo wysoki']
  },

  /* -------- zdarzenia opcjonalne (konsola prowadzącego) -------- */
  zdarzeniaOpcjonalne: [
    { id: 'pip', nazwa: 'Kontrola PIP', tekst: 'Inspektor Państwowej Inspekcji Pracy prosi o dokumentację norm pracy.', efekt: 'Jeśli chronometraż (4.2) zaliczony ≥60: +2 klimat ("normy w porządku"). Jeśli nie: kara 3 000 zł.' },
    { id: 'reklamacja', nazwa: 'Reklamacja jakościowa NORDIKI', tekst: 'Partia komód z zarysowanymi frontami. NORDIKA żąda wyjaśnień.', efekt: 'Jeśli linia komód (2.2) osiągnęła ≥75% efektywności: reklamacja oddalona. Jeśli nie: −3 p.p. OTIF.' },
    { id: 'choroba', nazwa: 'Choroba brygadzisty', tekst: 'Pan Zenek na L4 ("kręgosłup, panie, nie ja"). Brygada pracuje wolniej.', efekt: 'Koszt zastępstw: 1 500 zł.' }
  ],

  /* -------- epilogi (dobierane po finale) -------- */
  epilogi: [
    { prog: 'top', tytul: 'Fabryka, która liczy', tekst: 'Ciężarówki z logo NORDIKI wyjeżdżają z Tczewa co wtorek, punktualnie. W styczniu NORDIKA podnosi wolumen o kolejne piętnaście procent — tym razem nikt w FALI nie wpada w panikę: dział analityki otwiera arkusz i liczy. Grabowski, przechodząc obok Waszego biura, zostawia na biurku pudełko czekoladek. Bez słowa. Magda ma wreszcie prawdziwy system MRP, choć jedną żółtą karteczkę zostawiła na monitorze. Na szczęście.' },
    { prog: 'mid', tytul: 'Zaliczony egzamin dojrzałości', tekst: 'Dostawa wyjechała. Nie wszystko poszło gładko — było nerwowo, były dopłaty, była jedna bardzo długa noc przy rampie — ale kontrakt obroniony. Joanna na spotkaniu podsumowującym: "Wiem już, gdzie tracimy pieniądze. W przyszłym roku będziemy je tam odzyskiwać." Mazur zawiesza pogotowie strajkowe. Na razie.' },
    { prog: 'low', tytul: 'Drugie podejście', tekst: 'NORDIKA nie zerwała kontraktu — ale przysłała aneks z karami i "planem naprawczym dostawcy". Joanna czyta go w ciszy, po czym mówi: "To był drogi rok szkolny. Ale przynajmniej wiemy już, czego nie wiedzieliśmy." Fabryka dostaje drugą szansę. Analityka operacyjna — pierwszą pozycję w budżecie na przyszły rok.' }
  ],

  /* -------- pomoc dla zespołu -------- */
  pomoc: [
    'Dołączyliście do gry kodem od prowadzącego. Wasz zespół ma własne dane — kopiowanie liczb od sąsiadów nie zadziała, bo każdy zespół gra innym wariantem.',
    'Zakładka FABUŁA: prolog miesiąca i wywiady (limit 3 rozmów na epizod — wybierajcie mądrze, odpowiedzi zawierają wskazówki).',
    'Zakładka ZADANIA: karty zadań miesiąca. Zadania "Excel" mają przycisk pobrania paczki danych (XLSX); wynik wpisujecie w grze. Zadania interaktywne rozwiązujecie w całości na ekranie.',
    'Punktacja: pierwsza próba do 100 pkt, druga do 60 pkt, po dwóch próbach zadanie się zamyka (omówimy je w debriefingu). Punkty merytoryczne liczą się do oceny; kondycja firmy (KPI) — do rankingu.',
    'KPI firmy: gotówka, OTIF, koszt jednostkowy, klimat pracowniczy. Wasze odpowiedzi i decyzje zmieniają je po symulacji każdego miesiąca.',
    'Ranking: widzicie wyniki wszystkich zespołów na żywo. Wynik firmy = 35% gotówka + 30% OTIF + 15% koszt (odwrotnie) + 20% klimat, normalizowane w ramach gry.'
  ],

  lit: {
    podstawowa: [
      'Gruszczyński M. (red.), Ekonometria i badania operacyjne, PWN, Warszawa 2022.',
      'Martyniak Z. (red.), Metodologia wartościowania pracy, PWN, Warszawa 2014.',
      'Armstrong M., Zarządzanie wynagrodzeniami, Wolters Kluwer, Kraków 2021.'
    ],
    uzupelniajaca: [
      'Wagner H.M., Badania operacyjne, PWE, Warszawa 1980.',
      'Suchanek M., Badania operacyjne ograniczeń aktywności organizacji pozarządowych..., Studia Ekonomiczne 165, 2014.',
      'Borkowska S., Strategie wynagrodzeń, Oficyna Ekonomiczna, Kraków 2021.'
    ]
  }
};
