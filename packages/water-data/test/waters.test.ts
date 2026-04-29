import { describe, expect, it } from "vitest";
import { getWatersForTarget, waters } from "../src/index";

describe("waters catalog", () => {
  it("contains a useful trusted-source starter set", () => {
    expect(waters.length).toBeGreaterThanOrEqual(10);
  });

  it("has complete, unique, non-negative entries", () => {
    const ids = new Set<string>();
    const trustedSourceTypes = new Set([
      "manufacturer",
      "manufacturer_lab",
      "official_lab",
      "consumer_test",
    ]);

    for (const water of waters) {
      expect(water.id).toMatch(/^[a-z0-9-]+$/);
      expect(ids.has(water.id)).toBe(false);
      ids.add(water.id);

      expect(water.brand).not.toHaveLength(0);
      expect(water.name).not.toHaveLength(0);
      expect(water.country).not.toHaveLength(0);
      expect(water.availableAt.length).toBeGreaterThan(0);
      expect(water.sourceUrl).toMatch(/^https:\/\//);
      expect(water.sourceUrl).not.toContain("mineralwasser-test.com");
      expect(trustedSourceTypes.has(water.sourceType)).toBe(true);
      expect(water.sourceLabel).not.toHaveLength(0);
      expect(water.lastVerified).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(water.calciumMgL).toBeGreaterThanOrEqual(0);
      expect(water.magnesiumMgL).toBeGreaterThanOrEqual(0);
      expect(water.bicarbonateMgL).toBeGreaterThanOrEqual(0);
    }
  });

  it("sorts enriched waters by score for the requested target", () => {
    const enriched = getWatersForTarget("espresso");

    expect(enriched[0]?.score).toBeLessThanOrEqual(enriched[1]?.score ?? Number.POSITIVE_INFINITY);
    expect(enriched[0]?.profile.totalHardness).toBeGreaterThanOrEqual(0);
    expect(enriched[0]?.classification.best.target).toMatch(/filter|espresso/);
    expect(enriched[0]?.classification.evaluations.filter.roundedGrade).toBeGreaterThanOrEqual(1);
    expect(enriched[0]?.classification.evaluations.espresso.roundedGrade).toBeGreaterThanOrEqual(1);
  });
});
