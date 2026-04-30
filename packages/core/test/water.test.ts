import { describe, expect, it } from "vitest";
import {
  calculateWaterHardness,
  classifyWaterProfile,
  isInTargetRange,
  scoreWaterProfile,
} from "../src/index";

describe("calculateWaterHardness", () => {
  it("uses the Kaffeemacher mineral water formula", () => {
    const result = calculateWaterHardness({
      calcium: 12,
      magnesium: 8,
      bicarbonate: 74,
    });

    expect(result.totalHardness).toBeCloseTo(3.53, 2);
    expect(result.alkalinity).toBeCloseTo(3.39, 2);
  });

  it("rejects negative mineral values", () => {
    expect(() =>
      calculateWaterHardness({
        calcium: -1,
        magnesium: 0,
        bicarbonate: 0,
      }),
    ).toThrow(RangeError);
  });
});

describe("target ranges", () => {
  it("treats values on filter boundaries as matching", () => {
    expect(isInTargetRange({ totalHardness: 2, alkalinity: 1 }, "filter")).toBe(true);
    expect(isInTargetRange({ totalHardness: 7, alkalinity: 4 }, "filter")).toBe(true);
  });

  it("treats values on espresso boundaries as matching", () => {
    expect(isInTargetRange({ totalHardness: 3, alkalinity: 2 }, "espresso")).toBe(true);
    expect(isInTargetRange({ totalHardness: 7, alkalinity: 4 }, "espresso")).toBe(true);
  });

  it("classifies the best target when all targets are requested", () => {
    const classification = classifyWaterProfile({ totalHardness: 2.2, alkalinity: 1.4 }, "all");

    expect(classification.best.roundedGrade).toBe(1);
    expect(classification.best.target).toBe("filter");
    expect(classification.evaluations.espresso.roundedGrade).toBeGreaterThan(1);
  });

  it("treats SCA-compatible filter water as matching", () => {
    const volvicLike = calculateWaterHardness({
      calcium: 12,
      magnesium: 8,
      bicarbonate: 74,
    });

    expect(isInTargetRange(volvicLike, "filter")).toBe(true);
  });

  it("uses tolerant school grades for small misses", () => {
    const blackForestLike = classifyWaterProfile({ totalHardness: 1.54, alkalinity: 1.4 }, "all");

    expect(blackForestLike.evaluations.filter.roundedGrade).toBe(2);
    expect(blackForestLike.evaluations.espresso.roundedGrade).toBe(2);
  });

  it("scores larger misses higher than close misses", () => {
    const close = scoreWaterProfile({ totalHardness: 3.5, alkalinity: 2.2 }, "espresso");
    const far = scoreWaterProfile({ totalHardness: 10, alkalinity: 8 }, "espresso");

    expect(close).toBeLessThan(far);
  });
});
