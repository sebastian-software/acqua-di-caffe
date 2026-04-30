export type CoffeeTarget = "filter" | "espresso" | "all";

export type WaterMinerals = {
  calcium: number;
  magnesium: number;
  bicarbonate: number;
};

export type WaterHardness = {
  totalHardness: number;
  alkalinity: number;
};

export type TargetRange = {
  totalHardness: {
    min: number;
    max: number;
  };
  alkalinity: {
    min: number;
    max: number;
  };
};

export type SingleCoffeeTarget = Exclude<CoffeeTarget, "all">;

export type WaterGradeLabel =
  | "sehr gut"
  | "gut"
  | "brauchbar"
  | "grenzwertig"
  | "schwierig"
  | "deutlich daneben";

export type WaterTargetEvaluation = {
  target: SingleCoffeeTarget;
  grade: number;
  roundedGrade: number;
  label: WaterGradeLabel;
  distance: number;
  inIdealRange: boolean;
};

export type WaterClassification = {
  target: CoffeeTarget;
  best: WaterTargetEvaluation;
  evaluations: Record<SingleCoffeeTarget, WaterTargetEvaluation>;
  score: number;
};

export const TARGET_RANGES: Record<SingleCoffeeTarget, TargetRange> = {
  filter: {
    totalHardness: { min: 2, max: 7 },
    alkalinity: { min: 1, max: 4 },
  },
  espresso: {
    totalHardness: { min: 3, max: 7 },
    alkalinity: { min: 2, max: 4 },
  },
};

const CALCIUM_TO_DH = 7.1;
const MAGNESIUM_TO_DH = 4.35;
const BICARBONATE_TO_ALKALINITY = 21.8;
const HARDNESS_GRADE_TOLERANCE = 3;
const ALKALINITY_GRADE_TOLERANCE = 3;

export function calculateWaterHardness(minerals: WaterMinerals): WaterHardness {
  validateMineral("calcium", minerals.calcium);
  validateMineral("magnesium", minerals.magnesium);
  validateMineral("bicarbonate", minerals.bicarbonate);

  return {
    totalHardness: minerals.calcium / CALCIUM_TO_DH + minerals.magnesium / MAGNESIUM_TO_DH,
    alkalinity: minerals.bicarbonate / BICARBONATE_TO_ALKALINITY,
  };
}

export function scoreWaterProfile(profile: WaterHardness, target: CoffeeTarget): number {
  validateProfile(profile);
  return calculateScore(evaluateAllTargets(profile), target);
}

export function classifyWaterProfile(
  profile: WaterHardness,
  target: CoffeeTarget,
): WaterClassification {
  validateProfile(profile);
  const evaluations = evaluateAllTargets(profile);
  const best = getBestEvaluation(evaluations, target);

  return {
    target,
    best,
    evaluations,
    score: calculateScore(evaluations, target),
  };
}

export function evaluateWaterProfile(
  profile: WaterHardness,
  target: SingleCoffeeTarget,
): WaterTargetEvaluation {
  validateProfile(profile);
  const distance = distanceToRange(profile, target);
  const normalizedDistance = normalizedDistanceToRange(profile, target);
  const grade = clamp(1 + normalizedDistance * 2, 1, 6);
  const roundedGrade = distance === 0 ? 1 : Math.max(2, Math.round(grade));

  return {
    target,
    grade,
    roundedGrade,
    label: labelForGrade(roundedGrade),
    distance,
    inIdealRange: distance === 0,
  };
}

export function isInTargetRange(profile: WaterHardness, target: SingleCoffeeTarget): boolean {
  validateProfile(profile);
  return distanceToRange(profile, target) === 0;
}

export function getTargetKeys(target: CoffeeTarget): SingleCoffeeTarget[] {
  if (target === "all") {
    return ["filter", "espresso"];
  }

  return [target];
}

function distanceToRange(profile: WaterHardness, target: SingleCoffeeTarget): number {
  const range = TARGET_RANGES[target];
  const hardnessDistance = axisDistance(profile.totalHardness, range.totalHardness);
  const alkalinityDistance = axisDistance(profile.alkalinity, range.alkalinity);

  return Math.hypot(hardnessDistance, alkalinityDistance);
}

function normalizedDistanceToRange(profile: WaterHardness, target: SingleCoffeeTarget): number {
  const range = TARGET_RANGES[target];
  const hardnessDistance =
    axisDistance(profile.totalHardness, range.totalHardness) / HARDNESS_GRADE_TOLERANCE;
  const alkalinityDistance =
    axisDistance(profile.alkalinity, range.alkalinity) / ALKALINITY_GRADE_TOLERANCE;

  return Math.hypot(hardnessDistance, alkalinityDistance);
}

function axisDistance(value: number, range: { min: number; max: number }): number {
  if (value < range.min) {
    return range.min - value;
  }

  if (value > range.max) {
    return value - range.max;
  }

  return 0;
}

function evaluateAllTargets(
  profile: WaterHardness,
): Record<SingleCoffeeTarget, WaterTargetEvaluation> {
  return {
    filter: evaluateWaterProfile(profile, "filter"),
    espresso: evaluateWaterProfile(profile, "espresso"),
  };
}

function getBestEvaluation(
  evaluations: Record<SingleCoffeeTarget, WaterTargetEvaluation>,
  target: CoffeeTarget,
): WaterTargetEvaluation {
  const targetKeys = getTargetKeys(target);
  return targetKeys
    .map((targetKey) => evaluations[targetKey])
    .sort(
      (a, b) => a.grade - b.grade || a.target.localeCompare(b.target),
    )[0] as WaterTargetEvaluation;
}

function calculateScore(
  evaluations: Record<SingleCoffeeTarget, WaterTargetEvaluation>,
  target: CoffeeTarget,
): number {
  if (target === "all") {
    return Math.min(evaluations.filter.grade, evaluations.espresso.grade);
  }

  return evaluations[target].grade;
}

function labelForGrade(grade: number): WaterGradeLabel {
  if (grade < 1.5) {
    return "sehr gut";
  }
  if (grade < 2.5) {
    return "gut";
  }
  if (grade < 3.5) {
    return "brauchbar";
  }
  if (grade < 4.5) {
    return "grenzwertig";
  }
  if (grade < 5.5) {
    return "schwierig";
  }

  return "deutlich daneben";
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function validateMineral(name: keyof WaterMinerals, value: number): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`${name} must be a finite non-negative number.`);
  }
}

function validateProfile(profile: WaterHardness): void {
  if (
    !Number.isFinite(profile.totalHardness) ||
    profile.totalHardness < 0 ||
    !Number.isFinite(profile.alkalinity) ||
    profile.alkalinity < 0
  ) {
    throw new RangeError("Water profile must contain finite non-negative values.");
  }
}
