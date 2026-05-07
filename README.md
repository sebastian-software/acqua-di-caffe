# Acqua di Caffè

A small React app for calculating coffee water from bottled mineral-water labels.

## Packages

- `packages/core`: Pure TypeScript functions for total hardness, alkalinity, scoring, and target-zone classification.
- `packages/water-data`: Local JSON database of still mineral waters with verified source URLs.
- `apps/web`: React/Vite app for manual input, search, catalog browsing, and charts.

## Formulas

- Total hardness: `calciumMgL / 7.1 + magnesiumMgL / 4.35`
- Alkalinity: `bicarbonateMgL / 21.8`

The formulas follow the Kaffeemacher coffee-water guide because they map directly to the mineral values printed on bottle labels. The app's target ranges are cross-checked against SCA/SCAE, Coffee Circle, Roastmarket, La Marzocco, Sanremo, and Italian espresso references. The scoring model separates core, extended, and usable tolerance zones and shows school-style grades for filter coffee and espresso instead of forcing a hard suitable/unsuitable decision.

Details are documented in [docs/calculation-references.md](docs/calculation-references.md).

## Data Sources

The mineral-water catalog only accepts entries whose mineral values can be verified through manufacturer information, official product sheets, public laboratory analyses, or reputable consumer tests. Aggregated third-party pages without a primary source are rejected by tests. This keeps the catalog smaller, but more traceable and reviewable in Git.

## Development

```bash
pnpm install
pnpm dev
```

## Verification

```bash
pnpm test:run
pnpm build
```

## GitHub Pages

The workflow in `.github/workflows/pages.yml` installs dependencies with `pnpm`, runs the test suite, builds `apps/web`, and deploys `apps/web/dist` to GitHub Pages. For the Pages build, Vite uses `/acqua-di-caffe/` as its base path.
