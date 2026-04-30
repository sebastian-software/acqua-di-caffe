import {
  calculateWaterHardness,
  classifyWaterProfile,
  TARGET_RANGES,
  type CoffeeTarget,
  type SingleCoffeeTarget,
  type WaterHardness,
  type WaterTargetEvaluation,
} from "@coffeewater/core";
import {
  getWatersForTarget,
  waters,
  type EnrichedMineralWater,
  type MineralWater,
} from "@coffeewater/water-data";
import {
  Calculator,
  Database,
  Droplets,
  ExternalLink,
  RotateCcw,
  Search,
  Target,
} from "lucide-react";
import { useMemo, useState } from "react";

type MineralInput = {
  calcium: string;
  magnesium: string;
  bicarbonate: string;
};

type GradeFilter = "any" | "top" | "solid" | "avoid";

const DEFAULT_WATER_ID = "volvic-naturelle";

const targetLabels: Record<CoffeeTarget, string> = {
  filter: "Filterkaffee",
  espresso: "Espresso",
  all: "Beide",
};

const shortTargetLabels: Record<SingleCoffeeTarget, string> = {
  filter: "Filter",
  espresso: "Espresso",
};

const gradeFilterLabels: Record<GradeFilter, string> = {
  any: "Alle Noten",
  top: "Note 1-2",
  solid: "Note 1-3",
  avoid: "Note 4-6",
};

const initialWater = (waters.find((water) => water.id === DEFAULT_WATER_ID) ??
  waters[0]) as MineralWater;

export function App() {
  const [target, setTarget] = useState<CoffeeTarget>("all");
  const [selectedWaterId, setSelectedWaterId] = useState<string>(initialWater.id);
  const [input, setInput] = useState<MineralInput>(toInput(initialWater));
  const [query, setQuery] = useState("");
  const [gradeFilter, setGradeFilter] = useState<GradeFilter>("any");

  const parsedInput = useMemo(() => parseMineralInput(input), [input]);
  const currentProfile = useMemo(() => {
    if (!parsedInput) {
      return null;
    }

    return calculateWaterHardness(parsedInput);
  }, [parsedInput]);
  const currentClassification = useMemo(() => {
    if (!currentProfile) {
      return null;
    }

    return classifyWaterProfile(currentProfile, "all");
  }, [currentProfile]);

  const enrichedWaters = useMemo(() => getWatersForTarget(target), [target]);
  const visibleWaters = useMemo(
    () =>
      enrichedWaters.filter((water) => {
        const haystack = `${water.brand} ${water.name} ${water.country} ${water.availableAt.join(
          " ",
        )}`.toLowerCase();
        const matchesQuery = haystack.includes(query.trim().toLowerCase());
        const bestGrade = water.classification.best.roundedGrade;
        const matchesGrade =
          gradeFilter === "any" ||
          (gradeFilter === "top" && bestGrade <= 2) ||
          (gradeFilter === "solid" && bestGrade <= 3) ||
          (gradeFilter === "avoid" && bestGrade >= 4);

        return matchesQuery && matchesGrade;
      }),
    [enrichedWaters, gradeFilter, query],
  );

  const selectedWater =
    selectedWaterId === "manual" ? null : waters.find((water) => water.id === selectedWaterId);

  function updateInput(field: keyof MineralInput, value: string) {
    setSelectedWaterId("manual");
    setInput((current) => ({ ...current, [field]: value }));
  }

  function selectWater(id: string) {
    const water = waters.find((candidate) => candidate.id === id);
    if (!water) {
      return;
    }

    setSelectedWaterId(water.id);
    setInput(toInput(water));
  }

  return (
    <main className="app-shell">
      <section className="workspace" aria-labelledby="page-title">
        <div className="intro">
          <p className="eyebrow">Kaffeewasser</p>
          <h1 id="page-title">Rechner für stille Mineralwasser</h1>
          <p>
            Calcium, Magnesium und Hydrogencarbonat reichen aus, um Gesamthärte und Alkalinität
            einzuordnen. Die Noten sind bewusst toleranter als eine harte Ja-Nein-Bewertung.
          </p>
        </div>

        <div className="target-switch" aria-label="Zielbereich">
          {(Object.keys(targetLabels) as CoffeeTarget[]).map((targetKey) => (
            <button
              key={targetKey}
              type="button"
              className={target === targetKey ? "is-active" : ""}
              aria-pressed={target === targetKey}
              onClick={() => setTarget(targetKey)}
            >
              <Target aria-hidden="true" size={18} />
              Sortierung: {targetLabels[targetKey]}
            </button>
          ))}
        </div>

        <div className="tool-grid">
          <section className="panel input-panel" aria-labelledby="input-heading">
            <div className="section-heading">
              <Calculator aria-hidden="true" size={22} />
              <div>
                <h2 id="input-heading">Mineralwerte</h2>
                <p>Angaben vom Etikett in mg pro Liter.</p>
              </div>
            </div>

            <label className="field">
              <span>Wasser auswählen</span>
              <select value={selectedWaterId} onChange={(event) => selectWater(event.target.value)}>
                {selectedWaterId === "manual" ? (
                  <option value="manual">Manuelle Eingabe</option>
                ) : null}
                {waters.map((water) => (
                  <option key={water.id} value={water.id}>
                    {water.brand} {water.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="field-grid">
              <NumberField
                id="calcium"
                label="Calcium"
                value={input.calcium}
                onChange={(value) => updateInput("calcium", value)}
              />
              <NumberField
                id="magnesium"
                label="Magnesium"
                value={input.magnesium}
                onChange={(value) => updateInput("magnesium", value)}
              />
              <NumberField
                id="bicarbonate"
                label="Hydrogencarbonat"
                value={input.bicarbonate}
                onChange={(value) => updateInput("bicarbonate", value)}
              />
            </div>

            {!parsedInput ? (
              <p className="form-error" role="alert">
                Bitte trage für alle drei Werte Zahlen ab 0 ein.
              </p>
            ) : null}

            <button
              className="secondary-action"
              type="button"
              onClick={() => selectWater(DEFAULT_WATER_ID)}
            >
              <RotateCcw aria-hidden="true" size={18} />
              Beispiel zurücksetzen
            </button>
          </section>

          <section className="panel result-panel" aria-labelledby="result-heading">
            <div className="section-heading">
              <Droplets aria-hidden="true" size={22} />
              <div>
                <h2 id="result-heading">Ergebnis</h2>
                <p>
                  {selectedWater
                    ? `${selectedWater.brand} ${selectedWater.name}`
                    : "Manuelle Eingabe"}
                </p>
              </div>
            </div>

            <div className="metric-grid" aria-live="polite">
              <Metric label="Gesamthärte" value={currentProfile?.totalHardness} unit="°d GH" />
              <Metric label="Alkalinität" value={currentProfile?.alkalinity} unit="°d Alk" />
            </div>
            {currentClassification ? (
              <div className="grade-summary" aria-label="Bewertung">
                <GradeBadge evaluation={currentClassification.evaluations.filter} />
                <GradeBadge evaluation={currentClassification.evaluations.espresso} />
              </div>
            ) : null}

            <WaterChart profile={currentProfile} target={target} />
          </section>
        </div>

        <section className="catalog" aria-labelledby="catalog-heading">
          <div className="catalog-head">
            <div className="section-heading">
              <Database aria-hidden="true" size={22} />
              <div>
                <h2 id="catalog-heading">Mineralwasser-Datenbank</h2>
                <p>
                  {visibleWaters.length} quellengeprüfte Einträge. Jede Karte zeigt Filter- und
                  Espresso-Note.
                </p>
              </div>
            </div>

            <div className="catalog-controls">
              <label className="search-field">
                <Search aria-hidden="true" size={18} />
                <span className="sr-only">Wasser suchen</span>
                <input
                  type="search"
                  placeholder="Marke, Händler, Land"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </label>

              <label className="status-field">
                <span>Notenfilter</span>
                <select
                  value={gradeFilter}
                  onChange={(event) => setGradeFilter(event.target.value as GradeFilter)}
                >
                  {Object.entries(gradeFilterLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="water-list">
            {visibleWaters.map((water) => (
              <WaterCard key={water.id} water={water} onSelect={() => selectWater(water.id)} />
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}

function NumberField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="field" htmlFor={id}>
      <span>{label} (mg/L)</span>
      <input
        id={id}
        type="number"
        min="0"
        inputMode="decimal"
        step="0.1"
        placeholder="z. B. 12"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function Metric({ label, value, unit }: { label: string; value?: number; unit: string }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value === undefined ? "–" : formatNumber(value)}</strong>
      <small>{unit}</small>
    </div>
  );
}

function WaterCard({ water, onSelect }: { water: EnrichedMineralWater; onSelect: () => void }) {
  const bestTargetLabel = shortTargetLabels[water.classification.best.target];

  return (
    <article className="water-card">
      <div>
        <div className="water-title-row">
          <h3>
            {water.brand} <span>{water.name}</span>
          </h3>
          <span className={`status grade-${water.classification.best.roundedGrade}`}>
            Beste Note {water.classification.best.roundedGrade} für {bestTargetLabel}
          </span>
        </div>
        <p>
          {formatNumber(water.profile.totalHardness)} °d GH ·{" "}
          {formatNumber(water.profile.alkalinity)} °d Alk · {water.classification.best.label}
        </p>
        <div className="grade-pair" aria-label="Kaffee-Eignung">
          <GradeBadge evaluation={water.classification.evaluations.filter} compact />
          <GradeBadge evaluation={water.classification.evaluations.espresso} compact />
        </div>
        <div className="chips" aria-label="Verfügbarkeit">
          {water.availableAt.map((place) => (
            <span key={place}>{place}</span>
          ))}
        </div>
        <p className="source-info">
          {water.sourceLabel} · geprüft {formatDate(water.lastVerified)}
        </p>
      </div>

      <dl className="mineral-list" aria-label="Mineralwerte">
        <div>
          <dt>Ca</dt>
          <dd>{formatNumber(water.calciumMgL)}</dd>
        </div>
        <div>
          <dt>Mg</dt>
          <dd>{formatNumber(water.magnesiumMgL)}</dd>
        </div>
        <div>
          <dt>HCO3</dt>
          <dd>{formatNumber(water.bicarbonateMgL)}</dd>
        </div>
      </dl>

      <div className="card-actions">
        <button type="button" onClick={onSelect}>
          <Droplets aria-hidden="true" size={18} />
          Übernehmen
        </button>
        <a href={water.sourceUrl} target="_blank" rel="noreferrer">
          <ExternalLink aria-hidden="true" size={16} />
          Quelle
        </a>
      </div>
    </article>
  );
}

function GradeBadge({
  evaluation,
  compact = false,
}: {
  evaluation: WaterTargetEvaluation;
  compact?: boolean;
}) {
  return (
    <div className={`grade-badge grade-${evaluation.roundedGrade}`}>
      <span>
        {compact ? shortTargetLabels[evaluation.target] : targetLabels[evaluation.target]}
      </span>
      <strong>Note {evaluation.roundedGrade}</strong>
      <small>{evaluation.label}</small>
    </div>
  );
}

function WaterChart({ profile, target }: { profile: WaterHardness | null; target: CoffeeTarget }) {
  const width = 680;
  const height = 420;
  const padding = { top: 28, right: 28, bottom: 58, left: 62 };
  const xMax = 8;
  const yMax = 12;
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const x = (value: number) => padding.left + (clamp(value, 0, xMax) / xMax) * plotWidth;
  const y = (value: number) =>
    padding.top + plotHeight - (clamp(value, 0, yMax) / yMax) * plotHeight;
  const currentX = profile ? x(profile.alkalinity) : x(0);
  const currentY = profile ? y(profile.totalHardness) : y(0);
  const filterRange = TARGET_RANGES.filter;
  const espressoRange = TARGET_RANGES.espresso;
  const isClamped =
    profile &&
    (profile.alkalinity > xMax ||
      profile.alkalinity < 0 ||
      profile.totalHardness > yMax ||
      profile.totalHardness < 0);

  return (
    <figure className="chart-wrap">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-labelledby="chart-title chart-desc">
        <title id="chart-title">Zielbereiche für Kaffeewasser</title>
        <desc id="chart-desc">
          Diagramm mit Alkalinität auf der X-Achse und Gesamthärte auf der Y-Achse.
        </desc>
        <rect x="0" y="0" width={width} height={height} rx="18" className="chart-bg" />

        {Array.from({ length: xMax + 1 }, (_, index) => (
          <g key={`x-${index}`}>
            <line
              x1={x(index)}
              x2={x(index)}
              y1={padding.top}
              y2={padding.top + plotHeight}
              className="grid-line"
            />
            <text x={x(index)} y={height - 28} className="axis-tick" textAnchor="middle">
              {index}
            </text>
          </g>
        ))}

        {Array.from({ length: yMax / 2 + 1 }, (_, index) => index * 2).map((tick) => (
          <g key={`y-${tick}`}>
            <line
              x1={padding.left}
              x2={padding.left + plotWidth}
              y1={y(tick)}
              y2={y(tick)}
              className="grid-line"
            />
            <text x={padding.left - 16} y={y(tick) + 5} className="axis-tick" textAnchor="end">
              {tick}
            </text>
          </g>
        ))}

        <line
          x1={padding.left}
          x2={padding.left + plotWidth}
          y1={padding.top + plotHeight}
          y2={padding.top + plotHeight}
          className="axis-line"
        />
        <line
          x1={padding.left}
          x2={padding.left}
          y1={padding.top}
          y2={padding.top + plotHeight}
          className="axis-line"
        />

        <TargetRect
          label="Filter"
          x={x(filterRange.alkalinity.min)}
          y={y(filterRange.totalHardness.max)}
          width={x(filterRange.alkalinity.max) - x(filterRange.alkalinity.min)}
          height={y(filterRange.totalHardness.min) - y(filterRange.totalHardness.max)}
          active={target === "filter" || target === "all"}
          className="filter-range"
        />
        <TargetRect
          label="Espresso"
          x={x(espressoRange.alkalinity.min)}
          y={y(espressoRange.totalHardness.max)}
          width={x(espressoRange.alkalinity.max) - x(espressoRange.alkalinity.min)}
          height={y(espressoRange.totalHardness.min) - y(espressoRange.totalHardness.max)}
          active={target === "espresso" || target === "all"}
          className="espresso-range"
        />

        <text x={width / 2} y={height - 8} className="axis-label" textAnchor="middle">
          Alkalinität (°d Alk)
        </text>
        <text
          x="18"
          y={height / 2}
          className="axis-label"
          textAnchor="middle"
          transform={`rotate(-90 18 ${height / 2})`}
        >
          Gesamthärte (°d GH)
        </text>

        {profile ? (
          <g>
            <circle cx={currentX} cy={currentY} r="9" className="current-point-ring" />
            <circle cx={currentX} cy={currentY} r="5" className="current-point" />
          </g>
        ) : null}
      </svg>
      <figcaption>
        <span className="legend-item legend-filter">Empfohlener Bereich für Filterkaffee</span>
        <span className="legend-item legend-espresso">Empfohlener Bereich für Espresso</span>
        <span className="legend-item legend-current">Dein Wasser</span>
        {isClamped ? <span className="chart-note">Punkt liegt außerhalb der Skala.</span> : null}
      </figcaption>
    </figure>
  );
}

function TargetRect({
  label,
  x,
  y,
  width,
  height,
  active,
  className,
}: {
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  active: boolean;
  className: string;
}) {
  return (
    <g className={active ? "range-active" : "range-muted"}>
      <rect x={x} y={y} width={width} height={height} className={className} />
      <text x={x + 12} y={y + 24} className="range-label">
        {label}
      </text>
    </g>
  );
}

function toInput(water: MineralWater): MineralInput {
  return {
    calcium: String(water.calciumMgL),
    magnesium: String(water.magnesiumMgL),
    bicarbonate: String(water.bicarbonateMgL),
  };
}

function parseMineralInput(input: MineralInput) {
  const calcium = parsePositiveNumber(input.calcium);
  const magnesium = parsePositiveNumber(input.magnesium);
  const bicarbonate = parsePositiveNumber(input.bicarbonate);

  if (calcium === null || magnesium === null || bicarbonate === null) {
    return null;
  }

  return { calcium, magnesium, bicarbonate };
}

function parsePositiveNumber(value: string): number | null {
  if (value.trim() === "") {
    return null;
  }

  const normalized = Number(value.replace(",", "."));
  return Number.isFinite(normalized) && normalized >= 0 ? normalized : null;
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("de-DE", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
  }).format(new Date(`${value}T00:00:00`));
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
