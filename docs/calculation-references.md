# Kaffeewasser-Berechnung und Referenzen

Stand: 2026-04-30

## Formeln

Die Rechnerformeln bleiben an Kaffeemacher angelehnt, weil sie direkt zu den
Mineralwerten auf Flaschenetiketten passen:

- `Gesamthaerte (dGH) = calciumMgL / 7.1 + magnesiumMgL / 4.35`
- `Alkalinitaet (d Alk) = bicarbonateMgL / 21.8`

Kaffeemacher zeigt diese Rechnung am Beispiel Volvic: Calcium `12 mg/l`,
Magnesium `8 mg/l`, Hydrogencarbonat `74 mg/l` ergeben etwa `3.53 dGH` und
`3.39 d Alk`.

Quelle: [Kaffeemacher Kaffeewasser-Anleitung](https://kaffeemacher.de/blogs/kaffeewissen/kaffeewasser)

## App-Zielbereiche

Die App bewertet Wasser nicht mehr nur gegen den sehr engen
Kaffeemacher-Filterbereich. Stattdessen nutzt sie pro Getränk zwei Zonen:

- `Kernbereich`: enger Bereich, der aus den strengeren Quellen gut ableitbar ist.
- `Erweiterter Bereich`: fachlich plausibler Bereich, in dem die Quellen weniger
  einheitlich sind, besonders wegen der breiteren SCA-/Water-for-Coffee-Spanne.

| Ziel         | Kernbereich GH | Kernbereich Alk | Erweiterter Bereich GH | Erweiterter Bereich Alk | Begruendung                                                                                                                                                                         |
| ------------ | -------------: | --------------: | ---------------------: | ----------------------: | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Filterkaffee |      `2-3 dGH` |     `1-2 d Alk` |              `2-7 dGH` |             `1-4 d Alk` | Nimmt den engen Kaffeemacher-/Earlybird-/Roastmarket-Filterbereich als Kern ernst, laesst aber SCA-/Water-for-Coffee-kompatible Wasser wie Volvic nicht unnoetig schlecht aussehen. |
| Espresso     |      `3-6 dGH` |     `2-4 d Alk` |              `3-7 dGH` |             `2-4 d Alk` | Kaffeemacher und Earlybird nennen `3-6 dGH`; Roastmarket und Coffee Circle nennen fuer Espresso ebenfalls bzw. sinngemaess `3-7 dGH`.                                               |

Wasser im Kernbereich bekommt Note 1. Wasser im erweiterten Bereich wird als
gut bewertet, aber nicht als Kern-Treffer. Wasser ausserhalb dieser Bereiche
wird weiterhin graduell bewertet. Ein kleiner Abstand ergibt also eher Note 2
statt "ungeeignet".

## Quellenabgleich

| Quelle                                                                                                                                                                                                                                                                                                                           | Relevanz fuer die App                                                                                                                                                                                                                       | In Konstanten uebernommen?                                                                                                         |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| [Kaffeemacher](https://kaffeemacher.de/blogs/kaffeewissen/kaffeewasser)                                                                                                                                                                                                                                                          | Liefert die Etikettenformeln und sehr enge Idealbereiche: Filter `2-3 dGH` / `1-2 d Alk`, Espresso `3-6 dGH` / `2-4 d Alk`.                                                                                                                 | Ja, Formeln direkt; Zielbereiche als enger Referenzpunkt.                                                                          |
| [SCA Gold Cup Standard PDF](https://coffeegeek.com/wp-content/uploads/2023/10/SCAGoldCupStandard.pdf)                                                                                                                                                                                                                            | Verweist fuer Bruehwasser auf `50-175 ppm CaCO3` Haerte, `40-70 ppm CaCO3` Alkalinitaet und pH `6-8`. Umgerechnet sind das grob `2.8-9.8 dH` und `2.2-3.9 d Alk`.                                                                           | Ja, als breite Plausibilitaetsgrenze fuer Filterkaffee.                                                                            |
| [Wildkaffee: Wasser fuer Kaffeezubereitung](https://wild-kaffee.com/blogs/zubereitung-von-kaffee/welches-wasser-fuer-kaffeezubereitung)                                                                                                                                                                                          | Fasst SCA-Werte auf Deutsch zusammen: Alkalinitaet `40-70 ppm`, Haerte `50-175 ppm`, etwa `3-10 dH`; TDS ideal `75-150 mg/l`.                                                                                                               | Ja, bestaetigt den breiteren Filterbereich.                                                                                        |
| [Coffee Circle](https://www.coffeecircle.com/de/e/kaffee-wasser)                                                                                                                                                                                                                                                                 | Nennt `2-3 dH` Filter und `3-7 dH` Espresso, verweist aber zugleich auf SCA/Water for Coffee mit `40-70 ppm` Karbonathaerte (`2.2-4 dH`) und separaten Calcium-/Magnesium-Spannen.                                                          | Ja, bestaetigt breitere Alkalinitaet und Espresso-Oberkante.                                                                       |
| [Roastmarket](https://www.roastmarket.de/magazin/kaffeewasser-fuer-volles-kaffeearoma/)                                                                                                                                                                                                                                          | Nennt Filter `2-3 dH` und Espresso `3-7 dH`; beschreibt hartes Wasser als aromadaempfend und sehr weiches Wasser als potenziell sauer/bitter.                                                                                               | Ja, bestaetigt Espresso-Oberkante und die graduelle Bewertung.                                                                     |
| [Espresso Academy](https://espressoacademy.it/en/coffee-guide/the-impact-of-different-water-minerals-on-coffee-extraction/)                                                                                                                                                                                                      | Keine harte Zielzahl, aber klare qualitative Ableitung: Haerte stuetzt Extraktion/Struktur, Alkalinitaet puffert Saeure; zu hohe Alkalinitaet macht Aromen flacher, zu niedrige Haerte duenn.                                               | Ja, als Begruendung fuer Distanz-Scoring statt hartem Ja/Nein.                                                                     |
| [19grams](https://19grams.coffee/blogs/kaffeelexikon/wasser)                                                                                                                                                                                                                                                                     | Nennt SCA `50-175 mg/l` Haerte (`3-10 dH`) und `40-70 mg/l` Alkalinitaet (`2-4 dH`); bewertet Volvic als guten Allrounder.                                                                                                                  | Ja, bestaetigt, dass Volvic fuer Filter nicht abgewertet werden sollte.                                                            |
| [Vector Coffee Roasters](https://vectorcoffeeroasters.de/2025/09/11/kaffeewasser/)                                                                                                                                                                                                                                               | Nennt fuer Filterkaffee SCA-nahe Werte: GH `50-175 mg/l`, KH `40-75 mg/l`, TDS `75-250 mg/l`, pH `6.5-7.5`; ausserdem grobe Einzelionen-Ideale fuer Ca, Mg und HCO3.                                                                        | Ja, bestaetigt den breiteren Filterbereich. Produktdaten aus diesem Artikel werden nicht in den Mineralwasser-Katalog uebernommen. |
| [Earlybird Coffee](https://earlybird-coffee.de/blogs/earlybird-blog/kaffeewasser)                                                                                                                                                                                                                                                | Nennt allgemeines Kaffeewasser `3-8 dH`, Espresso `3-6 dH` und Filterkaffee `2-3 dH`; entspricht damit eher der engen Kaffeemacher-Linie.                                                                                                   | Ja, als Gegenpol zur breiteren SCA-Linie dokumentiert; keine weitere Einschraenkung der App-Konstanten.                            |
| [Mahlkoenig](https://www.mahlkoenig.com/de/blogs/news/the-best-water-for-coffee-brewing)                                                                                                                                                                                                                                         | Qualitative Einordnung: weich/gefiltert mit genuegend Haerte ist ideal; konkrete Haertezahlen stehen dort nicht im Fokus.                                                                                                                   | Nein, nur Kontext.                                                                                                                 |
| [Kaffee-Netz Forum: Wasser fuer Filterkaffee](https://www.kaffee-netz.de/threads/wasser-fuer-filterkaffee.111090/), [Richtiges Wasser fuer Kaffee](https://www.kaffee-netz.de/threads/richtiges-wasser-fuer-kaffee.62505/), [Wasser fuer Filterkaffee 2020](https://www.kaffee-netz.de/threads/wasser-fuer-filterkaffee.131194/) | Community-Diskussionen mit Praxiswerten, Mineralwasser-Vergleichen, Filter-/BWT-Erfahrungen und DIY-Water-Rezepten. Ein aelterer Thread nennt praxisnah etwa `4-8 dGH` und `3-6 dKH`; andere diskutieren Volvic und Barista-Hustle-Rezepte. | Nein, nicht fuer Konstanten; hilfreich als Plausibilitaets- und Praxisabgleich.                                                    |
| [Wildkaffee: Filterkaffee-Temperatur](https://wild-kaffee.com/blogs/zubereitung-von-kaffee/kaffee-filterkaffee-temperatur)                                                                                                                                                                                                       | Relevant fuer Bruehtemperatur, nicht fuer Wasserhaerte.                                                                                                                                                                                     | Nein.                                                                                                                              |
| [Kaffee Partner: Handfilterkaffee](https://www.kaffee-partner.de/de/magazin/lesen/handfilterkaffee-so-geht-die-zubereitung)                                                                                                                                                                                                      | Relevant fuer Handfilter-Rezept, nicht fuer Wasserhaerte.                                                                                                                                                                                   | Nein.                                                                                                                              |

## Warum Filterkaffee breiter bewertet wird

Die alte App-Logik behandelte `2-3 dGH` und `1-2 d Alk` als den einzigen
passenden Bereich fuer Filterkaffee. Das ist als enges Ideal aus Kaffeemacher
vertretbar, aber im Vergleich zu SCA/Water for Coffee zu streng. Mit den zwei
Zonen bleibt dieser Bereich als Kern sichtbar, waehrend `2-7 dGH` und `1-4 d
Alk` als erweiterter Bereich realistisch brauchbare Mineralwaesser nicht
unnoetig hart abstraft.

Die zusaetzlich geprueften Quellen vom 2026-04-30 bestaetigen diese Richtung:
Vector und 19grams stuetzen die breitere SCA-Spanne, Earlybird stuetzt die enge
Filter-Idealzone, und die Kaffee-Netz-Praxisdiskussionen zeigen, dass viele
Nutzerinnen und Nutzer gute Ergebnisse auch ausserhalb des engen `2-3 dGH`
Fensters suchen bzw. mischen.
