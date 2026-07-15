# KONTRAKT — przewodnik prowadzącego

## Koncepcja w jednym akapicie

Zespoły 3–5 osób prowadzą Dział Analityki Operacyjnej w Fabryce Mebli FALA (Tczew), która podpisała kontrakt ze skandynawską siecią NORDIKA: +40% wolumenu, pierwsza wielka dostawa w grudniu. Cztery epizody to cztery miesiące i cztery warsztaty. Gra dostarcza fabułę, dane i konsekwencje; rachunki studenci wykonują naprawdę, w Excelu z Solverem albo w zadaniach interaktywnych na ekranie. Każdy zespół gra na własnych, wylosowanych danych (ziarno = kod gry + nazwa zespołu), więc kopiowanie liczb między zespołami nie działa, a klucz rozwiązań liczy się dla każdego zespołu automatycznie.

Dwie równoległe punktacje: punkty merytoryczne za zadania (do oceny, składowa 20% z karty przedmiotu) oraz KPI firmy (gotówka, OTIF, koszt jednostkowy, klimat), które budują ranking widoczny dla wszystkich na żywo. Decyzje mają konsekwencje między epizodami: prognoza zasila MPS i MRP, błędy MRP wracają jako braki w październiku, cena dualna godziny okleiniarki z epizodu 2 finansuje inwestycję z epizodu 3, a suma decyzji kadrowych rozstrzyga o strajku przed finałową dostawą.

## Mapa zadań na bloki karty przedmiotu

Epizod 1, Audyt (wrzesień): 1.1 klasyfikacja problemów i metod; 1.2 prognozowanie (MA, wygładzanie, trend, MAPE); 1.3 ANOVA i regresja (jakość vs zmiany i nadgodziny); 1.4 MRP dla szafy (BOM, LT, partie); 1.5 odchylenia zużycia (ilość vs cena).

Epizod 2, Wąskie gardło (październik): 2.1 OEE trzech maszyn; 2.2 balansowanie linii (takt, poprzedzania, minimum stanowisk); 2.3 programowanie liniowe w Solverze z raportem wrażliwości i ceną dualną; 2.4 reguła Johnsona z wykresem Gantta na żywo; 2.5 CRP, czyli rachunek trzech wariantów domknięcia zdolności.

Epizod 3, Logistyka (listopad): 3.1 zagadnienie transportowe (kąt pn.-zach., najmniejszy koszt, optimum); 3.2 scorecard logistyki (OTIF, koszt/m3, ładowność); 3.3 sieć CPM instalacji nowej okleiniarki; 3.4 programowanie dynamiczne, trasa etapowa do Sztokholmu z odwołanym promem.

Epizod 4, Ludzie (grudzień): 4.1 dashboard HR (absencja, rotacja, diagnozy); 4.2 chronometraż u pana Zenka (tempo, narzuty, norma); 4.3 etatyzacja pakowania; 4.4 VSM z PCE i wyborem usprawnień; 4.5 wartościowanie pracy: ranking intuicyjny, karty ocen UMEWAP, taryfikator, anomalie płacowe i korekty w budżecie. Finał: negocjacje z Mazurem rozstrzygają się z wyników zadań, potem symulacja grudniowej dostawy i epilog.

## Przed zajęciami

Utwórz grę dzień wcześniej: strona startowa, Panel prowadzącego, Utwórz nową grę. Zapisz kod (5 liter) i PIN (4 cyfry); kod podasz studentom, PIN zostaje u Ciebie. Gra po utworzeniu stoi w Poczekalni, zespoły mogą dołączać przed zajęciami.

Sprawdź: laptopy zespołów z Excelem i dodatkiem Solver (konieczny w 2.3, przydatny w 3.1), rzutnik z otwartym widokiem projektora (przycisk w konsoli), własny laptop z konsolą.

Pierwsze zajęcia warto zacząć od 5 minut instrukcji: zakładka Pomoc w grze zawiera zasady dla studentów.

## Przebieg epizodu (2,5–3 h)

Rytm każdego warsztatu: uruchom epizod w konsoli (przycisk E1..E4), zespoły czytają prolog i raport z poprzedniego miesiąca (10 min), wywiady (limit 3 rozmów na epizod, odpowiedzi zawierają wskazówki do zadań), bloki zadań wg czasów na kartach (suma 2–2,5 h), debrief (15 min): treść debriefingu jest w konsoli i na projektorze, razem z rankingiem.

Zdarzenia wpisane w fabułę (awaria okleiniarki w E2, odwołany prom w E3, negocjacje w E4) uruchamiają się same. Zdarzenia opcjonalne (kontrola PIP, reklamacja NORDIKI, choroba brygadzisty) wywołujesz przyciskami w konsoli, kiedy chcesz podbić tempo; efekty są opisane przy przyciskach i liczą się automatycznie na podstawie stanu zespołu.

Przejście do kolejnego epizodu uruchamia u zespołów symulację zakończonego miesiąca: raport z konsekwencjami pojawia się w zakładce Fabuła, KPI aktualizują się na pasku. Finał (przycisk FINAŁ) uruchamia symulację grudnia: wynik negocjacji, ewentualny strajk, OTIF finalnej dostawy, epilog zespołu i rozbicie punktów.

## Konsola

Macierz zespoły na zadania pokazuje punkty i próby na żywo; kolory: zielony zaliczone, żółty częściowo, czerwony zero. Kliknięcie komórki otwiera odpowiedzi zespołu (z feedbackiem walidatora i surowym JSON) oraz pole ręcznej korekty punktów z notatką; korekta oznacza wynik gwiazdką.

Przycisk Klucz przy zespole otwiera pełny klucz rozwiązań liczony z ziarna tego zespołu, dla 1.4 z uwzględnieniem prognozy zespołu, dla 3.2 z uwzględnieniem jego symulacji. Trzymaj ten widok poza rzutnikiem.

Eksport CSV (średniki, UTF-8 z BOM, otwiera się poprawnie w polskim Excelu): punkty i próby per zadanie, suma, kolumna Propozycja składowej 20% (suma/1900 przeskalowana do 20 pkt), wynik firmy i KPI.

## Punktacja i zasady

Pierwsza próba do 100 pkt, druga do 60% wartości, po dwóch próbach zadanie zamyka się z komunikatem o debriefingu. Walidatory oceniają składowe niezależnie i mówią, co się zgadza, a co nie, bez zdradzania liczb przed drugą próbą. Zależności: 1.4 wymaga zatwierdzonej prognozy 1.2 (MPS liczy się z prognozy zespołu), 4.3 wymaga 4.1 (absencja z dashboardu wchodzi do funduszu czasu). W 2.5 i 4.3 punktujemy poprawny rachunek i spójność decyzji, nie jedną słuszną odpowiedź; konsekwencje różnych decyzji rozgrywa symulacja.

Paczki danych XLSX (przycisk nad listą zadań) są generowane per zespół i zawierają dane do zadań excelowych danego epizodu.

## Rozwiązywanie problemów

Zespół zmienił laptopa lub odświeżył stronę: wchodzi ponownie tym samym kodem i tą samą nazwą zespołu, stan jest w bazie. Podwójne urządzenia w zespole są bezpieczne, symulacje mają blokadę przed podwójnym naliczeniem. Brak internetu do Firebase w sali: gra w trybie lokalnym działa na pojedynczych komputerach (bez wspólnego rankingu); awaryjnie można rozegrać zajęcia lokalnie i przepisać punkty. Pomyłkowe przejście epizodu: wróć przyciskiem do właściwego (symulacje już naliczone nie cofają się, ale zadania pozostają dostępne w bieżącym epizodzie). Reset: najprościej utworzyć nową grę z nowym kodem.

## Dostosowania

Wszystko edytowalne w config.js bez dotykania logiki: dialogi i wywiady, pula problemów 1.1, opcje i stawki CRP, epilogi, a przede wszystkim UMEWAP: skale kryteriów, klucz ekspercki, kategorie z widełkami, budżet korekt. Wersja w grze to uproszczona adaptacja dydaktyczna wzorowana na UMEWAP-2000; pułapy można podmienić wg Martyniaka (red.) 2014, walidator przeliczy się sam. Zakresy losowania danych (marże, koszty, zdolności) są w generatorach w engines.js; po zmianach uruchom node test_engines.js.

Uwaga kalibracyjna względem dokumentu projektowego: stawki CRP w finalnej wersji to nadgodziny 57 zł/h (limit 144 h), kooperacja 62 zł/h, II zmiana 18 000 zł/mies. stałe; przy niedoborze 60–120 h najtańszy rachunkowo jest wariant nadgodzin, a kompromis koszt vs klimat pozostaje przedmiotem decyzji zespołu.

## Literatura w debriefingach

Cytowane pozycje pochodzą z karty przedmiotu: Gruszczyński (red.), Ekonometria i badania operacyjne, PWN 2022; Martyniak (red.), Metodologia wartościowania pracy, PWN 2014; Armstrong, Zarządzanie wynagrodzeniami, 2021; z listy uzupełniającej Wagner 1980 oraz Suchanek, Studia Ekonomiczne 165/2014 (przywołana w debriefingu epizodu 3, przy badaniach operacyjnych w transporcie).
