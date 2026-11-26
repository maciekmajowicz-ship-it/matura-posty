# Jak pisać posty (karuzele) – instrukcja dla autorów treści

Projekt: trzy profile na Instagramie dla maturzystów (matura 2027, formuła 2023, poziom podstawowy z elementami przydatnymi na rozszerzeniu): **matma**, **polski**, **angielski**.
Każdy post to karuzela slajdów 1080×1350. Treści leżą w `tresci/<przedmiot>.json` (tablica postów, **w kolejności publikacji**).
Render: `node render.js <przedmiot>` (tylko nowe) lub `node render.js <przedmiot> --id N` (jeden post od nowa). Grafiki: `output/<przedmiot>/NNN_n.jpg`.

## Format posta
```json
{
  "id": 1,                     // kolejne liczby od 1, bez dziur
  "typ": "lekcja",             // "lekcja" albo "quiz"
  "dzial": "Liczby",           // krótko, pokazuje się u góry slajdu (np. "Antyk", "Tenses")
  "temat": "Zbiory liczbowe",  // krótko – pokazuje się na końcu poprzedniego posta jako zapowiedź
  "opis": "1–2 zdania do opisu posta na IG (bez hashtagów – dodają się same)",
  "slajdy": [ ... ]            // slajd końcowy (zapisz/obserwuj + zapowiedź) dodaje się SAM – nie dodawaj go
}
```

## Typy slajdów
| t | pola | do czego |
|---|---|---|
| `okladka` | `nad` (pigułka, np. "MATMA OD ZERA #3"), `tytul`, `pod`, opcjonalnie `wzor` (LaTeX) | ZAWSZE pierwszy slajd. Tytuł krótki (max ~6 słów) z haczykiem, `pod` zachęca do przesunięcia 👉 |
| `punkty` | `tytul`, `wstep?`, `punkty` (2–5), `uwaga?`, `numeruj?` (false = kropki) | najważniejsze informacje |
| `wzor` | `tytul`, `wstep?`, `wzor` (LaTeX lub tablica max 3), `opis?`, `uwaga?` | wzory, definicje w białej karcie |
| `przyklad` | `tytul`, `tresc?`, `kroki` (2–4), `wynik?` | rozwiązany przykład krok po kroku |
| `porownanie` | `tytul`, `lewa{naglowek,punkty}`, `prawa{naglowek,punkty}`, `uwaga?` | dwie kolumny: X vs Y (max 4 krótkie punkty w kolumnie) |
| `cytat` | `cytat`, `autor`, `opis?` | cytat z lektury + krótki komentarz |
| `pytanie` | `tytul?`, `tresc`, `odp?` (2–4 odpowiedzi A–D; bez = zadanie otwarte) | zadanie; sam dopisuje "Odpowiedź na następnym slajdzie 👉" |
| `odpowiedz` | `poprawna` (np. "C. $\\sqrt8$"), `kroki?`, `tresc?` | ZAWSZE zaraz po `pytanie` |

Formatowanie w każdym tekście: `**słowo**` = wyróżnienie kolorem (używaj do 2–3 kluczowych słów na slajd), `==tekst==` = marker, `$...$` = wzór KaTeX (w JSON backslash podwójny: `$\\frac{1}{2}$`), `\n` = nowa linia.

## Zasady (ważne!)
1. **Mało tekstu.** Slajd ma się dać przeczytać w 5–8 sekund. Punkt = max ~12 słów. Jeśli render zgłasza „⚠️ za dużo treści” – skróć albo podziel na dwa slajdy.
2. **Post = 5–8 slajdów** (z końcowym). Jeden post = jeden mały temat. Lepiej więcej krótkich postów niż jeden długi.
3. **Okładka z haczykiem**: „Błąd, który robi 80% maturzystów”, „Zapamiętasz to w minutę”, „Ten wzór wraca co roku” – ale bez kłamstw i bez wymyślonych statystyk.
4. **Po kolei, od początku** – zgodnie z planem przedmiotu poniżej. Nie przeskakuj.
5. **Co 2–3 lekcje post typu `quiz`** z 2–3 zadaniami (pytanie → odpowiedz, pytanie → odpowiedz) z tego, co już było. Zadania w stylu CKE.
6. **Bezbłędność merytoryczna** to priorytet nr 1. Każdy wzór, datę, autora, przykład i odpowiedź sprawdź dwa razy. W razie wątpliwości – nie pisz tego.
7. Po polsku, poprawnie (ortografia, interpunkcja!). Język prosty, do ucznia na „ty”, bez infantylności. Emoji oszczędnie (max 1–2 na slajd).
8. Nie używaj nazw płatnych kursów/marek ani logotypów. Nie pisz, że coś jest „lekturą obowiązkową”, chyba że jesteś pewien według aktualnej listy CKE.
9. Po napisaniu: wyrenderuj, **obejrzyj kilka slajdów** (Read na pliku .jpg) i popraw to, co źle wygląda (ucięte, za ciasne, zbyt małe).

## Plany kolejności
### Matma (podstawa – od zera)
Liczby rzeczywiste (zbiory, przedziały, wartość bezwzględna) → procenty i punkty procentowe → potęgi → pierwiastki → notacja wykładnicza → logarytmy → wzory skróconego mnożenia → wyrażenia wymierne → równania i nierówności liniowe → układy równań → równania kwadratowe → nierówności kwadratowe → funkcje (pojęcie, dziedzina, zbiór wartości, monotoniczność, odczytywanie z wykresu) → funkcja liniowa → funkcja kwadratowa (postaci, wierzchołek, miejsca zerowe, optymalizacja) → przesunięcia wykresów → funkcja wykładnicza i logarytmiczna → ciągi (arytmetyczny, geometryczny, procent składany) → trygonometria → planimetria (trójkąty, Pitagoras, podobieństwo, okręgi, kąty, pola) → geometria analityczna → stereometria → kombinatoryka → prawdopodobieństwo → statystyka (średnia, mediana, dominanta, odchylenie).

### Polski (epoki po kolei + nauka o języku)
Start: jak wygląda matura z polskiego (krótko) → **Antyk**: ramy czasowe i cechy → mitologia (najważniejsze mity i toposy) → teatr grecki i tragedia („Antygona” Sofoklesa) → Biblia (Księga Rodzaju, Hiob, Kohelet, Psalmy, Apokalipsa, przypowieści) → Horacy → **Średniowiecze**: cechy, uniwersalizm, teocentryzm, wzorce osobowe (asceta, rycerz, władca) → „Bogurodzica”, „Lament świętokrzyski”, „Rozmowa Mistrza Polikarpa ze Śmiercią”, „Pieśń o Rolandzie”, danse macabre → **Renesans**: humanizm, Kochanowski (pieśni, fraszki, „Treny”, „Odprawa posłów greckich”) → **Barok**: cechy, Sęp Szarzyński, Morsztyn, Szekspir („Makbet”) → **Oświecenie**: Krasicki (bajki, satyry), Kartezjusz/rozum, klasycyzm/sentymentalizm → **Romantyzm**: Mickiewicz („Ballady i romanse”, „Dziady” cz. II, III, „Pan Tadeusz”, sonety), Słowacki („Kordian”), Krasiński → **Pozytywizm**: praca organiczna, praca u podstaw, Prus („Lalka”), Orzeszkowa, Sienkiewicz, Dostojewski („Zbrodnia i kara”) → **Młoda Polska**: dekadentyzm, Tetmajer, Wyspiański („Wesele”), Reymont („Chłopi”), Żeromski („Przedwiośnie”, „Rozdziobią nas kruki, wrony…”) → **Dwudziestolecie międzywojenne** (Gombrowicz „Ferdydurke”, Schulz, Bułhakow „Mistrz i Małgorzata”, poezja skamandrytów i awangardy) → **Wojna i okupacja** (Borowski, Herling-Grudziński, Baczyński, Krall „Zdążyć przed Panem Bogiem”, Camus „Dżuma”) → **Współczesność** (Miłosz, Herbert, Szymborska, Różewicz, Orwell „Rok 1984”, Mrożek „Tango”) . Co kilka postów wplataj **naukę o języku / pisanie**: środki stylistyczne, rodzaje narracji, budowa rozprawki/wypracowania, argument i kontekst, częste błędy językowe. Quizy: „z jakiej epoki?”, „kto to napisał?”, „jaki to środek stylistyczny?”.

### Angielski (od podstaw do matury)
Start: jak wygląda matura z angielskiego (krótko) → czasy po kolei: Present Simple vs Continuous → Past Simple (regular/irregular) → Past Continuous → Present Perfect vs Past Simple → Present Perfect Continuous → Past Perfect → przyszłość (will / going to / Present Continuous) → Future Continuous/Perfect → stative verbs → okresy warunkowe 0,1,2,3 i mieszane → I wish / If only → strona bierna → mowa zależna → modal verbs (must/have to/should/might…) → modal perfect → gerund vs infinitive → przedimki a/an/the → stopniowanie przymiotników → zdania względne → question tags → used to / be used to / get used to → phrasal verbs (paczki po 5) → kolokacje make/do, say/tell → false friends → słownictwo z działów maturalnych (szkoła, praca, zdrowie, technologia, podróże…) → pisanie: e-mail (podstawa) i formy z rozszerzenia, zwroty łączące (linking words), zwroty na ustny. Przykłady zdań po angielsku z tłumaczeniem; zasady po polsku. Quizy: „uzupełnij lukę”, „popraw błąd”, „wybierz poprawną formę”.
