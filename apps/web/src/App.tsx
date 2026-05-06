import {
  calculateWaterHardness,
  classifyWaterProfile,
  TARGET_ZONES,
  type CoffeeTarget,
  type SingleCoffeeTarget,
  type TargetRange,
  type WaterClassification,
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
  BookOpen,
  Calculator,
  CheckCircle2,
  ChevronRight,
  Coffee,
  Database,
  Droplet,
  ExternalLink,
  FlaskConical,
  Info,
  MapPin,
  Search,
  SlidersHorizontal,
  Store,
  SunMedium,
  Target,
} from "lucide-react";
import { useEffect, useMemo, useState, type MouseEvent } from "react";

type MineralInput = {
  calcium: string;
  magnesium: string;
  bicarbonate: string;
};

type GradeFilter = "any" | "top" | "solid" | "avoid";
type CatalogFilter = "all" | "broad" | "regional" | "discounter" | "bio";
type SortMode = "best" | "filter" | "espresso" | "name" | "hardness";
type AxisScale = "coffee" | "full";

const DEFAULT_WATER_ID = "odenwald-quelle-gourmet-naturelle";
const emptyInput: MineralInput = {
  calcium: "",
  magnesium: "",
  bicarbonate: "",
};
const defaultWater = waters.find((water) => water.id === DEFAULT_WATER_ID);
const defaultInput = defaultWater ? toInput(defaultWater) : emptyInput;

const targetLabels: Record<CoffeeTarget, string> = {
  filter: "Filterkaffee",
  espresso: "Espresso",
  all: "Beide",
};

const targetShortLabels: Record<SingleCoffeeTarget, string> = {
  filter: "Filter",
  espresso: "Espresso",
};

const gradeFilterLabels: Record<GradeFilter, string> = {
  any: "Alle Noten",
  top: "Note 1-2",
  solid: "Note 1-3",
  avoid: "Note 4-6",
};

const catalogFilterLabels: Record<CatalogFilter, string> = {
  all: "Alle",
  broad: "Deutschlandweit",
  regional: "Regional",
  discounter: "Discounter",
  bio: "Bio",
};

const sortLabels: Record<SortMode, string> = {
  best: "Beste Note",
  filter: "Beste Note (Filter)",
  espresso: "Beste Note (Espresso)",
  name: "Name A-Z",
  hardness: "Härte aufsteigend",
};

const axisScaleLabels: Record<AxisScale, string> = {
  coffee: "Kaffeebereich",
  full: "Gesamter Katalog",
};

const zoneLabels: Record<WaterTargetEvaluation["zone"], string> = {
  core: "Kernbereich",
  extended: "erweiterter Bereich",
  usable: "Toleranzbereich",
  outside: "außerhalb",
};

type AppRoute = "/" | "/datenbank" | "/wissen" | "/projekt";

const routeItems = [
  { label: "Rechner", path: "/", icon: Calculator },
  { label: "Wasser Datenbank", path: "/datenbank", icon: Database },
  { label: "Quellen & Wissen", path: "/wissen", icon: BookOpen },
  { label: "Über das Projekt", path: "/projekt", icon: Info },
] as const;

const githubPagesRedirectKey = "coffeewater:redirect";
const routePaths = new Set<AppRoute>(["/", "/datenbank", "/wissen", "/projekt"]);

export function App() {
  const [route, setRoute] = useState<AppRoute>(() => readInitialRoute());
  const [target, setTarget] = useState<CoffeeTarget>("filter");
  const [selectedWaterId, setSelectedWaterId] = useState<string>(DEFAULT_WATER_ID);
  const [input, setInput] = useState<MineralInput>(defaultInput);
  const [query, setQuery] = useState("");
  const [gradeFilter, setGradeFilter] = useState<GradeFilter>("any");
  const [catalogFilter, setCatalogFilter] = useState<CatalogFilter>("all");
  const [sortMode, setSortMode] = useState<SortMode>("best");
  const [axisScale, setAxisScale] = useState<AxisScale>("coffee");
  const [showLegend, setShowLegend] = useState(true);

  const hasMineralInput = Object.values(input).some((value) => value.trim() !== "");
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
  const visibleWaters = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    const filtered = enrichedWaters.filter((water) => {
      const haystack = `${water.brand} ${water.name} ${water.country} ${water.availableAt.join(
        " ",
      )} ${water.sourceLabel}`.toLowerCase();
      const matchesQuery = haystack.includes(normalizedQuery);
      const bestGrade = water.classification.best.roundedGrade;
      const matchesGrade =
        gradeFilter === "any" ||
        (gradeFilter === "top" && bestGrade <= 2) ||
        (gradeFilter === "solid" && bestGrade <= 3) ||
        (gradeFilter === "avoid" && bestGrade >= 4);
      const matchesAvailability = waterMatchesCatalogFilter(water, catalogFilter);

      return matchesQuery && matchesGrade && matchesAvailability;
    });

    return [...filtered].sort((a, b) => compareWaters(a, b, sortMode));
  }, [catalogFilter, enrichedWaters, gradeFilter, query, sortMode]);

  const selectedWater =
    selectedWaterId === "manual"
      ? null
      : (waters.find((water) => water.id === selectedWaterId) ?? null);
  const selectedEnrichedWater =
    selectedWaterId === "manual"
      ? null
      : (enrichedWaters.find((water) => water.id === selectedWaterId) ?? null);

  useEffect(() => {
    const handlePopState = () => setRoute(normalizeRoutePath(window.location.pathname));

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  function updateInput(field: keyof MineralInput, value: string) {
    setSelectedWaterId("manual");
    setInput((current) => ({ ...current, [field]: value }));
  }

  function selectWater(id: string) {
    if (id === "manual") {
      setSelectedWaterId("manual");
      setInput(emptyInput);
      return;
    }

    const water = waters.find((candidate) => candidate.id === id);
    if (!water) {
      return;
    }

    setSelectedWaterId(water.id);
    setInput(toInput(water));
  }

  function submitManualAnalysis() {
    if (parsedInput) {
      setSelectedWaterId("manual");
    }
  }

  function navigateTo(nextRoute: AppRoute) {
    if (nextRoute !== route) {
      window.history.pushState(null, "", buildRouteHref(nextRoute));
      setRoute(nextRoute);
      try {
        window.scrollTo({ top: 0 });
      } catch {
        // jsdom does not implement scrollTo; browser navigation should still scroll.
      }
    }
  }

  function handleRouteClick(event: MouseEvent<HTMLAnchorElement>, nextRoute: AppRoute) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }

    event.preventDefault();
    navigateTo(nextRoute);
  }

  return (
    <main className="app-shell">
      <header className="topbar" aria-label="Hauptnavigation">
        <a
          className="brand-mark"
          href={buildRouteHref("/")}
          aria-label="Kaffeewasser Rechner"
          onClick={(event) => handleRouteClick(event, "/")}
        >
          <span className="brand-icon" aria-hidden="true">
            <Droplet size={26} />
            <Coffee size={18} />
          </span>
          <span>Kaffeewasser Rechner</span>
        </a>

        <nav className="topnav" aria-label="Bereiche">
          {routeItems.map(({ label, path, icon: Icon }) => (
            <a
              key={path}
              className={route === path ? "is-active" : ""}
              href={buildRouteHref(path)}
              aria-current={route === path ? "page" : undefined}
              onClick={(event) => handleRouteClick(event, path)}
            >
              <Icon aria-hidden="true" size={18} />
              {label}
            </a>
          ))}
        </nav>

        <div className="topbar-actions" aria-label="Anzeige">
          <button type="button" aria-label="Light Mode">
            <SunMedium aria-hidden="true" size={18} />
          </button>
          <a
            href={buildRouteHref("/projekt")}
            onClick={(event) => handleRouteClick(event, "/projekt")}
          >
            <Info aria-hidden="true" size={18} />
            Info
          </a>
        </div>
      </header>

      <h1 className="sr-only">Kaffeewasser Rechner</h1>

      {route === "/" ? (
        <div className="app-layout">
          <aside className="analysis-rail" aria-label="Analyse">
            <section className="panel analysis-panel" aria-labelledby="analysis-heading">
              <PanelTitle
                icon={Droplet}
                title="Manuelle Analyse"
                description="Gib die wichtigsten Werte deiner Wasseranalyse ein."
                id="analysis-heading"
              />

              <div className="field-stack">
                <NumberField
                  id="calcium"
                  label="Calcium (Ca²⁺)"
                  value={input.calcium}
                  onChange={(value) => updateInput("calcium", value)}
                />
                <NumberField
                  id="magnesium"
                  label="Magnesium (Mg²⁺)"
                  value={input.magnesium}
                  onChange={(value) => updateInput("magnesium", value)}
                />
                <NumberField
                  id="bicarbonate"
                  label="Hydrogencarbonat (HCO₃⁻)"
                  value={input.bicarbonate}
                  onChange={(value) => updateInput("bicarbonate", value)}
                />
              </div>

              <div className="control-group">
                <span className="control-label">Zielbereich</span>
                <p>Wähle den gewünschten Brühstil.</p>
                <TargetSwitch target={target} setTarget={setTarget} />
              </div>

              {hasMineralInput && !parsedInput ? (
                <p className="form-error" role="alert">
                  Bitte trage für alle drei Werte Zahlen ab 0 ein.
                </p>
              ) : null}

              <button className="primary-action" type="button" onClick={submitManualAnalysis}>
                Analyse berechnen
                <Calculator aria-hidden="true" size={18} />
              </button>
            </section>

            <CurrentWaterPanel
              selectedWater={selectedWater}
              parsedInput={parsedInput}
              currentProfile={currentProfile}
              currentClassification={currentClassification}
            />

            <p className="formula-note">Formeln: GH = Ca/7,1 + Mg/4,35 · Alk = HCO₃/21,8</p>
          </aside>

          <section className="dashboard" aria-label="Wasservergleich">
            <ChartPanel
              waters={visibleWaters}
              target={target}
              selectedWater={selectedEnrichedWater}
              onSelect={selectWater}
              axisScale={axisScale}
              setAxisScale={setAxisScale}
              showLegend={showLegend}
              onToggleLegend={() => setShowLegend((current) => !current)}
            />
          </section>
        </div>
      ) : null}

      {route === "/datenbank" ? (
        <section className="page-shell" aria-labelledby="database-page-heading">
          <div className="page-intro">
            <p className="page-kicker">Datenbank</p>
            <h2 id="database-page-heading">Mineralwasser vergleichen</h2>
            <p>
              Suche, filtere und sortiere die geprüften stillen Mineralwasser. Ein Wasser kann hier
              ausgewählt werden und erscheint danach wieder im Rechner.
            </p>
          </div>

          <DatabasePanel
            visibleWaters={visibleWaters}
            selectedWaterId={selectedWaterId}
            onSelect={selectWater}
            target={target}
            setTarget={setTarget}
            query={query}
            setQuery={setQuery}
            gradeFilter={gradeFilter}
            setGradeFilter={setGradeFilter}
            sortMode={sortMode}
            setSortMode={setSortMode}
            catalogFilter={catalogFilter}
            setCatalogFilter={setCatalogFilter}
          />
        </section>
      ) : null}

      {route === "/wissen" ? (
        <section className="page-shell" aria-labelledby="knowledge-page-heading">
          <div className="page-intro">
            <p className="page-kicker">Quellen & Wissen</p>
            <h2 id="knowledge-page-heading">Was der Rechner wirklich berechnet</h2>
            <p>
              Die Formeln sind Einheitenumrechnungen aus der Wasserchemie. Die eigentliche
              Produktentscheidung entsteht erst durch Zielbereiche und Bewertung.
            </p>
          </div>

          <section className="support-grid route-support" aria-label="Wasserwissen">
            <KnowledgePanel />
            <section className="panel info-panel" aria-labelledby="targets-heading">
              <PanelTitle
                icon={Target}
                title="Zielbereiche"
                description="Kernbereiche bleiben streng, die erweiterten Bereiche und Note-3-Toleranzen bilden den Quellenkonsens praxisnäher ab."
                id="targets-heading"
              />

              <div className="info-list">
                <div>
                  <strong>Filterkaffee</strong>
                  <p>
                    Weiches Wasser bleibt der Kern. SCA-nahe Quellen lassen aber mehr Härte und
                    Alkalinität zu als die strengsten Specialty-Empfehlungen.
                  </p>
                  <code>Kern: GH 2-3 · Alk 1-2</code>
                  <code>Erweitert: GH 1,5-8 · Alk 0,8-4,5</code>
                </div>
                <div>
                  <strong>Espresso</strong>
                  <p>
                    Espresso hat praxisnah höhere Toleranzen, besonders bei der Alkalinität. Mehr
                    ist trotzdem nicht automatisch besser.
                  </p>
                  <code>Kern: GH 3-6 · Alk 2-4</code>
                  <code>Erweitert: GH 2-7,5 · Alk 1,5-4,8</code>
                </div>
              </div>
            </section>
          </section>
        </section>
      ) : null}

      {route === "/projekt" ? (
        <section className="page-shell" aria-labelledby="project-page-heading">
          <div className="page-intro">
            <p className="page-kicker">Projekt</p>
            <h2 id="project-page-heading">Statische App, prüfbare Daten</h2>
            <p>
              Die Anwendung ist bewusst klein gehalten: lokale JSON-Daten, reine
              TypeScript-Berechnung und Deployment als statische GitHub-Pages-App.
            </p>
          </div>

          <section className="support-grid route-support" aria-label="Projektinformationen">
            <ProjectPanel onDatabaseClick={() => navigateTo("/datenbank")} />
            <section className="panel info-panel" aria-labelledby="privacy-heading">
              <PanelTitle
                icon={CheckCircle2}
                title="App-Prinzipien"
                description="Die Oberfläche soll schnell, nachvollziehbar und ohne Serverabhängigkeit funktionieren."
                id="privacy-heading"
              />

              <div className="project-facts">
                <div>
                  <Database aria-hidden="true" size={18} />
                  <span>Keine API-Runtime, keine SQLite-Datei, kein Tracking.</span>
                </div>
                <div>
                  <FlaskConical aria-hidden="true" size={18} />
                  <span>Neue Wasser brauchen vollständige Werte und eine belastbare Quelle.</span>
                </div>
                <div>
                  <CheckCircle2 aria-hidden="true" size={18} />
                  <span>Tests prüfen Formeln, Zielbereiche, UI-Flows und Datenqualität.</span>
                </div>
              </div>
            </section>
          </section>
        </section>
      ) : null}
    </main>
  );
}

function TargetSwitch({
  target,
  setTarget,
}: {
  target: CoffeeTarget;
  setTarget: (target: CoffeeTarget) => void;
}) {
  return (
    <div className="segmented-control" aria-label="Zielbereich">
      <button
        type="button"
        className={target === "filter" ? "is-active" : ""}
        aria-pressed={target === "filter"}
        onClick={() => setTarget("filter")}
      >
        <Target aria-hidden="true" size={16} />
        Filter
      </button>
      <button
        type="button"
        className={target === "espresso" ? "is-active" : ""}
        aria-pressed={target === "espresso"}
        onClick={() => setTarget("espresso")}
      >
        <Coffee aria-hidden="true" size={16} />
        Espresso
      </button>
      <button
        type="button"
        className={target === "all" ? "is-active" : ""}
        aria-pressed={target === "all"}
        onClick={() => setTarget("all")}
      >
        <CheckCircle2 aria-hidden="true" size={16} />
        Beide
      </button>
    </div>
  );
}

function CurrentWaterPanel({
  selectedWater,
  parsedInput,
  currentProfile,
  currentClassification,
}: {
  selectedWater: MineralWater | null;
  parsedInput: { calcium: number; magnesium: number; bicarbonate: number } | null;
  currentProfile: WaterHardness | null;
  currentClassification: WaterClassification | null;
}) {
  return (
    <section className="panel current-panel" aria-labelledby="result-heading">
      <div className="current-heading">
        <span className="status-dot" aria-hidden="true" />
        <div>
          <h2 id="result-heading">Dein Wasser</h2>
          <p>
            {selectedWater
              ? `${selectedWater.brand} ${selectedWater.name}`
              : parsedInput
                ? "Manuelle Analyse"
                : "Noch keine vollständige Analyse"}
          </p>
        </div>
      </div>

      <div className="metric-grid" aria-live="polite">
        <Metric label="Gesamthärte" value={currentProfile?.totalHardness} unit="°d GH" />
        <Metric label="Alkalinität" value={currentProfile?.alkalinity} unit="°d Alk" />
      </div>

      {currentClassification ? (
        <div className="recommendation-card">
          <CheckCircle2 aria-hidden="true" size={22} />
          <div>
            <strong>{formatEvaluationHeadline(currentClassification.best)}</strong>
            <span>{formatEvaluationDetail(currentClassification.best)}</span>
          </div>
        </div>
      ) : (
        <div className="empty-state">
          <FlaskConical aria-hidden="true" size={20} />
          <span>Wähle ein Wasser aus der Datenbank oder ergänze alle Werte.</span>
        </div>
      )}
    </section>
  );
}

function ChartPanel({
  waters: chartWaters,
  target,
  selectedWater,
  onSelect,
  axisScale,
  setAxisScale,
  showLegend,
  onToggleLegend,
}: {
  waters: EnrichedMineralWater[];
  target: CoffeeTarget;
  selectedWater: EnrichedMineralWater | null;
  onSelect: (id: string) => void;
  axisScale: AxisScale;
  setAxisScale: (axisScale: AxisScale) => void;
  showLegend: boolean;
  onToggleLegend: () => void;
}) {
  return (
    <section className="panel chart-panel" aria-labelledby="catalog-chart-heading">
      <div className="panel-toolbar">
        <PanelTitle
          icon={Droplet}
          title="Alle Wasser im Vergleich"
          description="Jeder Punkt ist ein Mineralwasser. Klicke auf einen Punkt für Details."
          id="catalog-chart-heading"
        />

        <div className="toolbar-actions">
          <button
            type="button"
            className="toolbar-button"
            aria-pressed={showLegend}
            onClick={onToggleLegend}
          >
            <SlidersHorizontal aria-hidden="true" size={17} />
            Legende {showLegend ? "ausblenden" : "einblenden"}
          </button>
          <label className="select-button">
            <span className="sr-only">Achsen anpassen</span>
            <SlidersHorizontal aria-hidden="true" size={17} />
            <select
              value={axisScale}
              onChange={(event) => setAxisScale(event.target.value as AxisScale)}
            >
              {Object.entries(axisScaleLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <CatalogChart
        waters={chartWaters}
        target={target}
        selectedWater={selectedWater}
        onSelect={onSelect}
        axisScale={axisScale}
        showLegend={showLegend}
      />
    </section>
  );
}

function DatabasePanel({
  visibleWaters,
  selectedWaterId,
  onSelect,
  target,
  setTarget,
  query,
  setQuery,
  gradeFilter,
  setGradeFilter,
  sortMode,
  setSortMode,
  catalogFilter,
  setCatalogFilter,
}: {
  visibleWaters: EnrichedMineralWater[];
  selectedWaterId: string;
  onSelect: (id: string) => void;
  target: CoffeeTarget;
  setTarget: (target: CoffeeTarget) => void;
  query: string;
  setQuery: (query: string) => void;
  gradeFilter: GradeFilter;
  setGradeFilter: (gradeFilter: GradeFilter) => void;
  sortMode: SortMode;
  setSortMode: (sortMode: SortMode) => void;
  catalogFilter: CatalogFilter;
  setCatalogFilter: (catalogFilter: CatalogFilter) => void;
}) {
  return (
    <section className="panel database-panel" aria-labelledby="database-heading">
      <div className="database-head">
        <div className="title-with-count">
          <PanelTitle
            icon={Database}
            title="Mineralwasser Datenbank"
            description=""
            id="database-heading"
          />
          <span>{waters.length} Wasser</span>
        </div>

        <div className="database-target-control">
          <span>Zielwertung</span>
          <TargetSwitch target={target} setTarget={setTarget} />
        </div>

        <div className="catalog-controls">
          <label className="search-field">
            <Search aria-hidden="true" size={18} />
            <span className="sr-only">Wasser suchen</span>
            <input
              type="search"
              placeholder="Wasser suchen..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>

          <label className="compact-select">
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

          <label className="compact-select">
            <span>Sortierung</span>
            <select
              value={sortMode}
              onChange={(event) => setSortMode(event.target.value as SortMode)}
            >
              {Object.entries(sortLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <div className="filter-chips" aria-label="Katalogfilter">
            {(Object.keys(catalogFilterLabels) as CatalogFilter[]).map((filterKey) => (
              <button
                key={filterKey}
                type="button"
                className={catalogFilter === filterKey ? "is-active" : ""}
                aria-pressed={catalogFilter === filterKey}
                onClick={() => setCatalogFilter(filterKey)}
              >
                {catalogFilterIcon(filterKey)}
                {catalogFilterLabels[filterKey]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <WaterTable waters={visibleWaters} selectedWaterId={selectedWaterId} onSelect={onSelect} />
    </section>
  );
}

function KnowledgePanel() {
  return (
    <section className="panel info-panel" aria-labelledby="knowledge-card-heading">
      <PanelTitle
        icon={BookOpen}
        title="Formeln & Einheiten"
        description="Die Berechnung nutzt etablierte Wasserchemie, die Bewertung bleibt bewusst praxisnah."
        id="knowledge-card-heading"
      />

      <div className="info-list">
        <div>
          <strong>Gesamthärte</strong>
          <p>Calcium und Magnesium werden als deutsche Härtegrade zusammengeführt.</p>
          <code>GH = Ca / 7,1 + Mg / 4,35</code>
        </div>
        <div>
          <strong>Alkalinität</strong>
          <p>Hydrogencarbonat ist bei Mineralwasser meist der dominante Puffer.</p>
          <code>Alk = HCO₃ / 21,8</code>
        </div>
      </div>

      <div className="resource-links" aria-label="Referenzen">
        <a
          href="https://kaffeemacher.de/blogs/kaffeewissen/kaffeewasser"
          target="_blank"
          rel="noreferrer"
        >
          Kaffeemacher Kaffeewasser
          <ExternalLink aria-hidden="true" size={14} />
        </a>
        <a
          href="https://brandconnect.gr/wp-content/uploads/2021/01/SCAE-water-chart-report.pdf"
          target="_blank"
          rel="noreferrer"
        >
          SCAE Water Chart
          <ExternalLink aria-hidden="true" size={14} />
        </a>
        <a
          href="https://sca.coffee/sca-news/25/issue-9/english/water-and-coffee-acidity-how-to-adapt-your-water-for-different-extraction-methods-25-magazine-issue-9"
          target="_blank"
          rel="noreferrer"
        >
          SCA zu Brew Ratio
          <ExternalLink aria-hidden="true" size={14} />
        </a>
        <a
          href="https://www.lamarzocco.com/uk/en/technical-questions/la-marzocco-water-specifications/"
          target="_blank"
          rel="noreferrer"
        >
          La Marzocco Specs
          <ExternalLink aria-hidden="true" size={14} />
        </a>
        <a
          href="https://www.portioli.it/it/blog/caff-e-acqua-l-importanza-della-qualit-dell-acqua-nell-espresso"
          target="_blank"
          rel="noreferrer"
        >
          Portioli Espresso
          <ExternalLink aria-hidden="true" size={14} />
        </a>
      </div>
    </section>
  );
}

function ProjectPanel({ onDatabaseClick }: { onDatabaseClick: () => void }) {
  return (
    <section className="panel info-panel" aria-labelledby="project-card-heading">
      <PanelTitle
        icon={Info}
        title="Über das Projekt"
        description="Eine statische React-App für GitHub Pages, ohne Server und ohne Tracking."
        id="project-card-heading"
      />

      <div className="project-facts">
        <div>
          <Database aria-hidden="true" size={18} />
          <span>Lokale JSON-Datenbank mit {waters.length} stillen Mineralwassern.</span>
        </div>
        <div>
          <FlaskConical aria-hidden="true" size={18} />
          <span>Nur Hersteller-, Labor-, Test- oder nachvollziehbare Händlerquellen.</span>
        </div>
        <div>
          <CheckCircle2 aria-hidden="true" size={18} />
          <span>Formeln und Daten werden per Tests gegen ungültige Werte abgesichert.</span>
        </div>
      </div>

      <button className="inline-source" type="button" onClick={onDatabaseClick}>
        Zur Datenbank springen
        <ChevronRight aria-hidden="true" size={16} />
      </button>
    </section>
  );
}

function PanelTitle({
  icon: Icon,
  title,
  description,
  id,
}: {
  icon: typeof Droplet;
  title: string;
  description: string;
  id: string;
}) {
  return (
    <div className="panel-title">
      <Icon aria-hidden="true" size={20} />
      <div>
        <h2 id={id}>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>
    </div>
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
      <span>{label}</span>
      <span className="unit-input">
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
        <span aria-hidden="true">mg/L</span>
      </span>
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

function WaterTable({
  waters: tableWaters,
  selectedWaterId,
  onSelect,
}: {
  waters: EnrichedMineralWater[];
  selectedWaterId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="table-shell">
      <table>
        <caption>
          {tableWaters.length} von {waters.length} Wasser
        </caption>
        <thead>
          <tr>
            <th scope="col">Marke</th>
            <th scope="col">Wasser</th>
            <th scope="col">GH (°d)</th>
            <th scope="col">Alk (°d)</th>
            <th scope="col">Filterkaffee</th>
            <th scope="col">Espresso</th>
            <th scope="col">Verfügbarkeit</th>
            <th scope="col">Quelle</th>
            <th scope="col">
              <span className="sr-only">Aktion</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {tableWaters.map((water) => (
            <tr key={water.id} className={water.id === selectedWaterId ? "is-selected" : ""}>
              <td>
                <span className="brand-cell">
                  <span className="brand-avatar" aria-hidden="true">
                    {water.brand.slice(0, 2)}
                  </span>
                  {water.brand}
                </span>
              </td>
              <td>{water.name}</td>
              <td>{formatNumber(water.profile.totalHardness)}</td>
              <td>{formatNumber(water.profile.alkalinity)}</td>
              <td>
                <GradePill evaluation={water.classification.evaluations.filter} />
              </td>
              <td>
                <GradePill evaluation={water.classification.evaluations.espresso} />
              </td>
              <td>
                <AvailabilityPills water={water} />
              </td>
              <td>
                <a className="source-link" href={water.sourceUrl} target="_blank" rel="noreferrer">
                  {sourceTypeLabel(water.sourceType)}
                  <ExternalLink aria-hidden="true" size={14} />
                </a>
              </td>
              <td>
                <button
                  className="row-action"
                  type="button"
                  aria-label={`${water.brand} ${water.name} übernehmen`}
                  onClick={() => onSelect(water.id)}
                >
                  <ChevronRight aria-hidden="true" size={18} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function GradePill({ evaluation }: { evaluation: WaterTargetEvaluation }) {
  return (
    <span className={`grade-pill grade-${evaluation.roundedGrade}`}>
      <strong>{evaluation.roundedGrade}</strong>
      {evaluation.label}
    </span>
  );
}

function AvailabilityPills({ water }: { water: MineralWater }) {
  const flags = availabilityFlags(water);
  const visibleFlags: CatalogFilter[] = flags.length > 0 ? flags : ["regional"];

  return (
    <span className="availability-pills">
      {visibleFlags.slice(0, 2).map((flag) => (
        <span key={flag}>{availabilityLabel(flag)}</span>
      ))}
    </span>
  );
}

function CatalogChart({
  waters: plottedWaters,
  target,
  selectedWater,
  onSelect,
  axisScale,
  showLegend,
}: {
  waters: EnrichedMineralWater[];
  target: CoffeeTarget;
  selectedWater: EnrichedMineralWater | null;
  onSelect: (id: string) => void;
  axisScale: AxisScale;
  showLegend: boolean;
}) {
  const width = 980;
  const height = 420;
  const padding = { top: 28, right: 26, bottom: 54, left: 62 };
  const fullXMax = Math.max(
    10,
    Math.ceil(Math.max(...plottedWaters.map((water) => water.profile.alkalinity), 10) / 5) * 5,
  );
  const fullYMax = Math.max(
    14,
    Math.ceil(Math.max(...plottedWaters.map((water) => water.profile.totalHardness), 14) / 10) * 10,
  );
  const xMax = axisScale === "coffee" ? 10 : fullXMax;
  const yMax = axisScale === "coffee" ? 14 : fullYMax;
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const x = (value: number) => padding.left + (clamp(value, 0, xMax) / xMax) * plotWidth;
  const y = (value: number) =>
    padding.top + plotHeight - (clamp(value, 0, yMax) / yMax) * plotHeight;
  const targetKeys = target === "all" ? (["filter", "espresso"] as const) : ([target] as const);
  const hasClampedPoints = plottedWaters.some(
    (water) =>
      water.profile.alkalinity > xMax ||
      water.profile.totalHardness > yMax ||
      water.profile.alkalinity < 0 ||
      water.profile.totalHardness < 0,
  );
  const selectedVisible = selectedWater
    ? plottedWaters.some((water) => water.id === selectedWater.id)
    : false;

  return (
    <figure className="catalog-chart-wrap">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-labelledby="catalog-chart-title catalog-chart-desc"
      >
        <title id="catalog-chart-title">Vergleich aller gefilterten Mineralwasser</title>
        <desc id="catalog-chart-desc">
          Streudiagramm mit Alkalinität auf der X-Achse und Gesamthärte auf der Y-Achse.
        </desc>
        <rect x="0" y="0" width={width} height={height} rx="12" className="chart-bg" />

        {chartTicks(xMax, axisScale === "coffee" ? 1 : 5).map((tick) => (
          <g key={`catalog-x-${tick}`}>
            <line
              x1={x(tick)}
              x2={x(tick)}
              y1={padding.top}
              y2={padding.top + plotHeight}
              className="grid-line"
            />
            <text x={x(tick)} y={height - 24} className="axis-tick" textAnchor="middle">
              {tick}
            </text>
          </g>
        ))}

        {chartTicks(yMax, axisScale === "coffee" ? 2 : 10).map((tick) => (
          <g key={`catalog-y-${tick}`}>
            <line
              x1={padding.left}
              x2={padding.left + plotWidth}
              y1={y(tick)}
              y2={y(tick)}
              className="grid-line"
            />
            <text x={padding.left - 14} y={y(tick) + 5} className="axis-tick" textAnchor="end">
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

        {targetKeys.includes("filter") ? <TargetZoneGroup targetKey="filter" x={x} y={y} /> : null}
        {targetKeys.includes("espresso") ? (
          <TargetZoneGroup targetKey="espresso" x={x} y={y} />
        ) : null}

        {plottedWaters.map((water) => {
          const active = selectedWater?.id === water.id;
          const isClamped =
            water.profile.alkalinity > xMax ||
            water.profile.totalHardness > yMax ||
            water.profile.alkalinity < 0 ||
            water.profile.totalHardness < 0;
          const grade = water.classification.best.roundedGrade;
          const label = `${water.brand} ${water.name}`;
          const summary =
            formatBestTargetSummary(water.classification.best) ??
            `${water.classification.best.label} · Note ${grade}`;

          return (
            <g
              key={water.id}
              className={`catalog-point-group${active ? " is-selected" : ""}`}
              role="button"
              tabIndex={0}
              aria-label={`${label} übernehmen`}
              onClick={() => onSelect(water.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelect(water.id);
                }
              }}
            >
              <title>
                {label}: {formatNumber(water.profile.totalHardness)} °d GH,{" "}
                {formatNumber(water.profile.alkalinity)} °d Alk, {summary}
              </title>
              <circle
                cx={x(water.profile.alkalinity)}
                cy={y(water.profile.totalHardness)}
                r={active ? 7 : 4.7}
                className={`catalog-point point-grade-${grade}${isClamped ? " is-clamped" : ""}`}
              />
            </g>
          );
        })}

        {selectedWater && selectedVisible ? (
          <ChartTooltip water={selectedWater} x={x} y={y} xMax={xMax} yMax={yMax} />
        ) : null}

        <text x={width / 2} y={height - 7} className="axis-label" textAnchor="middle">
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
      </svg>

      {showLegend ? (
        <figcaption>
          <span className="legend-group-label filter">Filterkaffee</span>
          <span className="legend-item legend-filter-core">Kernbereich</span>
          <span className="legend-item legend-filter-extended">Erweiterter Bereich</span>
          <span className="legend-item legend-filter-usable">Note-3-Toleranz</span>
          <span className="legend-group-label espresso">Espresso</span>
          <span className="legend-item legend-espresso-core">Kernbereich</span>
          <span className="legend-item legend-espresso-extended">Erweiterter Bereich</span>
          <span className="legend-item legend-espresso-usable">Note-3-Toleranz</span>
          <span className="legend-item legend-point-good">Mineralwasser</span>
          {hasClampedPoints ? (
            <span className="chart-note">Einige Punkte liegen am Rand.</span>
          ) : null}
        </figcaption>
      ) : null}
    </figure>
  );
}

function TargetZoneGroup({
  targetKey,
  x,
  y,
}: {
  targetKey: SingleCoffeeTarget;
  x: (value: number) => number;
  y: (value: number) => number;
}) {
  const zones = TARGET_ZONES[targetKey];
  const classPrefix = targetKey === "filter" ? "filter-range" : "espresso-range";

  return (
    <>
      <TargetRect range={zones.usable} x={x} y={y} className={`${classPrefix} range-usable`} />
      <TargetRect range={zones.extended} x={x} y={y} className={`${classPrefix} range-extended`} />
      <TargetRect range={zones.core} x={x} y={y} className={`${classPrefix} range-core`} />
    </>
  );
}

function TargetRect({
  range,
  x,
  y,
  className,
}: {
  range: TargetRange;
  x: (value: number) => number;
  y: (value: number) => number;
  className: string;
}) {
  const rectX = x(range.alkalinity.min);
  const rectY = y(range.totalHardness.max);
  const width = x(range.alkalinity.max) - x(range.alkalinity.min);
  const height = y(range.totalHardness.min) - y(range.totalHardness.max);

  return <rect x={rectX} y={rectY} width={width} height={height} className={className} />;
}

function ChartTooltip({
  water,
  x,
  y,
  xMax,
  yMax,
}: {
  water: EnrichedMineralWater;
  x: (value: number) => number;
  y: (value: number) => number;
  xMax: number;
  yMax: number;
}) {
  const pointX = x(water.profile.alkalinity);
  const pointY = y(water.profile.totalHardness);
  const width = 220;
  const height = 112;
  const tooltipX = clamp(pointX + 16, 76, 980 - width - 28);
  const tooltipY = clamp(pointY - height / 2, 36, 420 - height - 62);
  const titleLines = splitTitle(`${water.brand} ${water.name}`);
  const isClamped =
    water.profile.alkalinity > xMax ||
    water.profile.totalHardness > yMax ||
    water.profile.alkalinity < 0 ||
    water.profile.totalHardness < 0;

  return (
    <g className="chart-tooltip" pointerEvents="none">
      <line x1={pointX} y1={pointY} x2={tooltipX} y2={tooltipY + 58} />
      <rect x={tooltipX} y={tooltipY} width={width} height={height} rx="8" />
      {titleLines.map((line, index) => (
        <text key={line} x={tooltipX + 14} y={tooltipY + 24 + index * 18} className="tooltip-title">
          {line}
        </text>
      ))}
      <text x={tooltipX + 14} y={tooltipY + 66} className="tooltip-metric">
        GH {formatNumber(water.profile.totalHardness)}
      </text>
      <text x={tooltipX + 91} y={tooltipY + 66} className="tooltip-metric">
        Alk {formatNumber(water.profile.alkalinity)}
      </text>
      <text x={tooltipX + 14} y={tooltipY + 91} className="tooltip-status">
        {formatBestTargetSummary(water.classification.best) ??
          `${water.classification.best.label} · Note ${water.classification.best.roundedGrade}`}
      </text>
      {isClamped ? (
        <text x={tooltipX + 14} y={tooltipY + 106} className="tooltip-muted">
          Punkt am Rand der Skala
        </text>
      ) : null}
    </g>
  );
}

function waterMatchesCatalogFilter(
  water: Pick<MineralWater, "availableAt" | "brand" | "name" | "sourceLabel">,
  filter: CatalogFilter,
): boolean {
  if (filter === "all") {
    return true;
  }

  return availabilityFlags(water).includes(filter);
}

function availabilityFlags(
  water: Pick<MineralWater, "availableAt" | "brand" | "name" | "sourceLabel">,
): CatalogFilter[] {
  const text = `${water.brand} ${water.name} ${water.availableAt.join(" ")} ${
    water.sourceLabel
  }`.toLowerCase();
  const flags: CatalogFilter[] = [];

  if (
    text.includes("lebensmittelhandel") ||
    text.includes("deutschlandweit") ||
    text.includes("rewe") ||
    text.includes("dm") ||
    text.includes("lidl") ||
    text.includes("kaufland") ||
    text.includes("online kaufen") ||
    text.includes("hersteller-webshop")
  ) {
    flags.push("broad");
  }

  if (
    text.includes("regional") ||
    text.includes("getränkemarkt") ||
    text.includes("shopfinder") ||
    text.includes("händlersuche") ||
    text.includes("gastro")
  ) {
    flags.push("regional");
  }

  if (
    text.includes("lidl") ||
    text.includes("kaufland") ||
    text.includes("aldi") ||
    text.includes("discounter") ||
    text.includes("saskia") ||
    text.includes("k-classic")
  ) {
    flags.push("discounter");
  }

  if (text.includes("bio")) {
    flags.push("bio");
  }

  return flags;
}

function availabilityLabel(flag: CatalogFilter): string {
  if (flag === "broad") {
    return "De";
  }

  if (flag === "regional") {
    return "regional";
  }

  if (flag === "discounter") {
    return "Discount";
  }

  if (flag === "bio") {
    return "Bio";
  }

  return "Alle";
}

function catalogFilterIcon(filter: CatalogFilter) {
  if (filter === "broad") {
    return <Store aria-hidden="true" size={16} />;
  }

  if (filter === "regional") {
    return <MapPin aria-hidden="true" size={16} />;
  }

  if (filter === "discounter") {
    return <Database aria-hidden="true" size={16} />;
  }

  if (filter === "bio") {
    return <Droplet aria-hidden="true" size={16} />;
  }

  return <SlidersHorizontal aria-hidden="true" size={16} />;
}

function compareWaters(a: EnrichedMineralWater, b: EnrichedMineralWater, sortMode: SortMode) {
  if (sortMode === "name") {
    return `${a.brand} ${a.name}`.localeCompare(`${b.brand} ${b.name}`, "de");
  }

  if (sortMode === "hardness") {
    return a.profile.totalHardness - b.profile.totalHardness;
  }

  if (sortMode === "filter") {
    return (
      a.classification.evaluations.filter.grade - b.classification.evaluations.filter.grade ||
      a.brand.localeCompare(b.brand, "de")
    );
  }

  if (sortMode === "espresso") {
    return (
      a.classification.evaluations.espresso.grade - b.classification.evaluations.espresso.grade ||
      a.brand.localeCompare(b.brand, "de")
    );
  }

  return a.score - b.score || a.brand.localeCompare(b.brand, "de");
}

function sourceTypeLabel(sourceType: MineralWater["sourceType"]): string {
  if (sourceType === "retailer") {
    return "Handel (mit Laborangabe)";
  }

  if (sourceType === "manufacturer_lab" || sourceType === "official_lab") {
    return "Hersteller / Labor";
  }

  if (sourceType === "consumer_test") {
    return "Testquelle";
  }

  return "Hersteller";
}

function formatEvaluationHeadline(evaluation: WaterTargetEvaluation): string {
  const targetLabel = targetLabels[evaluation.target];

  if (evaluation.roundedGrade <= 2) {
    return `${evaluation.label} für ${targetLabel}`;
  }

  if (evaluation.roundedGrade === 3) {
    return `Brauchbar für ${targetLabel}`;
  }

  return `Nur eingeschränkt für ${targetLabel}`;
}

function formatEvaluationDetail(evaluation: WaterTargetEvaluation): string {
  if (evaluation.roundedGrade === 1 && evaluation.zone === "extended") {
    return `${evaluation.label} · nahe Kernbereich`;
  }

  return `${evaluation.label} · ${zoneLabels[evaluation.zone]}`;
}

function formatBestTargetSummary(evaluation: WaterTargetEvaluation): string | null {
  const targetLabel = targetShortLabels[evaluation.target];

  if (evaluation.roundedGrade <= 3) {
    return `${targetLabel} · Note ${evaluation.roundedGrade}`;
  }

  if (evaluation.roundedGrade === 4) {
    return `grenzwertig · Note 4`;
  }

  return null;
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

function chartTicks(max: number, step: number): number[] {
  const ticks: number[] = [];

  for (let value = 0; value <= max; value += step) {
    ticks.push(value);
  }

  return ticks;
}

function splitTitle(title: string): string[] {
  if (title.length <= 24) {
    return [title];
  }

  const words = title.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;
    if (nextLine.length > 24 && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = nextLine;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.slice(0, 2);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("de-DE", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(value);
}

function readInitialRoute(): AppRoute {
  if (typeof window === "undefined") {
    return "/";
  }

  const redirectedRoute = window.sessionStorage.getItem(githubPagesRedirectKey);
  if (redirectedRoute) {
    window.sessionStorage.removeItem(githubPagesRedirectKey);
    const route = normalizeRoutePath(redirectedRoute);
    window.history.replaceState(null, "", buildRouteHref(route));
    return route;
  }

  return normalizeRoutePath(window.location.pathname);
}

function normalizeRoutePath(pathname: string): AppRoute {
  let path = pathname.split(/[?#]/)[0] || "/";
  const basePath = getBasePath();

  if (basePath !== "/" && path.startsWith(basePath)) {
    path = path.slice(basePath.length) || "/";
  }

  if (!path.startsWith("/")) {
    path = `/${path}`;
  }

  if (path.length > 1 && path.endsWith("/")) {
    path = path.slice(0, -1);
  }

  return routePaths.has(path as AppRoute) ? (path as AppRoute) : "/";
}

function buildRouteHref(route: AppRoute): string {
  const basePath = getBasePath();

  if (basePath === "/") {
    return route;
  }

  return route === "/" ? `${basePath}/` : `${basePath}${route}`;
}

function getBasePath(): string {
  const baseUrl = import.meta.env.BASE_URL || "/";
  const withoutTrailingSlash = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;

  return withoutTrailingSlash || "/";
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
