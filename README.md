# Coffeewater

Kleine React-App zur Berechnung von Kaffeewasser aus Mineralwasser-Etiketten.

## Pakete

- `packages/core`: Reine TypeScript-Funktionen für Gesamthärte, Alkalinität, Scoring und Zielbereich-Klassifikation.
- `packages/water-data`: Lokale JSON-Datenbank stiller Mineralwasser mit geprüften Quellen-URLs.
- `apps/web`: React/Vite-App für manuelle Eingabe, Suche und Diagramm.

## Formeln

- Gesamthärte: `calciumMgL / 7.1 + magnesiumMgL / 4.35`
- Alkalinität: `bicarbonateMgL / 21.8`

Die Formeln orientieren sich an der Kaffeemacher-Kaffeewasser-Anleitung. Die Zielbereiche sind
gegen weitere Referenzen wie SCA/Water for Coffee, Coffee Circle und Roastmarket abgeglichen; der
Filterbereich ist deshalb bewusst breiter als der enge Kaffeemacher-Idealbereich. Die App zeigt
zusätzlich tolerante Schulnoten je Wasser für Filterkaffee und Espresso, statt Wasser hart als
geeignet/ungeeignet zu klassifizieren.

Details stehen in [docs/calculation-references.md](docs/calculation-references.md).

## Datenquellen

Der Mineralwasser-Katalog nimmt nur Einträge auf, deren Mineralwerte über Herstellerangaben,
offizielle Produktdatenblätter, amtliche Laboranalysen oder seriöse Verbraucherprüfungen belegbar
sind. Aggregierte Drittseiten ohne Primärquelle werden per Test ausgeschlossen. Dadurch ist der
Katalog kleiner, aber nachvollziehbarer und Git-reviewbar.

## Entwicklung

```bash
pnpm install
pnpm dev
```

## Prüfung

```bash
pnpm test:run
pnpm build
```

## GitHub Pages

Der Workflow unter `.github/workflows/pages.yml` installiert mit `pnpm`, führt Tests aus, baut `apps/web` und deployed `apps/web/dist` nach GitHub Pages. Für den Pages-Build setzt Vite den Base-Pfad auf `/coffeewater/`.
