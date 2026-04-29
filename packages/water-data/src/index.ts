import {
  calculateWaterHardness,
  classifyWaterProfile,
  scoreWaterProfile,
  type CoffeeTarget,
  type WaterClassification,
  type WaterHardness,
} from "@coffeewater/core";
import watersJson from "./waters.json";

export type MineralWater = {
  id: string;
  name: string;
  brand: string;
  country: string;
  availableAt: string[];
  calciumMgL: number;
  magnesiumMgL: number;
  bicarbonateMgL: number;
  sourceType: "manufacturer" | "manufacturer_lab" | "official_lab" | "consumer_test";
  sourceLabel: string;
  sourceUrl: string;
  lastVerified: string;
};

export type EnrichedMineralWater = MineralWater & {
  profile: WaterHardness;
  classification: WaterClassification;
  score: number;
};

export const waters = watersJson as MineralWater[];

export function enrichWater(water: MineralWater, target: CoffeeTarget): EnrichedMineralWater {
  const profile = calculateWaterHardness({
    calcium: water.calciumMgL,
    magnesium: water.magnesiumMgL,
    bicarbonate: water.bicarbonateMgL,
  });

  return {
    ...water,
    profile,
    classification: classifyWaterProfile(profile, target),
    score: scoreWaterProfile(profile, target),
  };
}

export function getWatersForTarget(target: CoffeeTarget): EnrichedMineralWater[] {
  return waters
    .map((water) => enrichWater(water, target))
    .sort((a, b) => a.score - b.score || a.brand.localeCompare(b.brand, "de"));
}
