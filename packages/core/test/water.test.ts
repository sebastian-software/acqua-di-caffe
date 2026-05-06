import { describe, expect, it } from "vitest";
import {
  calculateWaterHardness,
  classifyWaterProfile,
  evaluateWaterProfile,
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
    expect(isInTargetRange({ totalHardness: 1.5, alkalinity: 0.8 }, "filter")).toBe(true);
    expect(isInTargetRange({ totalHardness: 8, alkalinity: 4.5 }, "filter")).toBe(true);
  });

  it("treats values on espresso boundaries as matching", () => {
    expect(isInTargetRange({ totalHardness: 2, alkalinity: 1.5 }, "espresso")).toBe(true);
    expect(isInTargetRange({ totalHardness: 7.5, alkalinity: 4.8 }, "espresso")).toBe(true);
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
    expect(evaluateWaterProfile(volvicLike, "filter")).toMatchObject({
      zone: "extended",
      roundedGrade: 2,
      inIdealRange: false,
      inExtendedRange: true,
    });
  });

  it("treats close misses around the filter core as very good", () => {
    expect(evaluateWaterProfile({ totalHardness: 2.06, alkalinity: 2.11 }, "filter")).toMatchObject(
      {
        zone: "extended",
        roundedGrade: 1,
        label: "sehr gut",
      },
    );
    expect(evaluateWaterProfile({ totalHardness: 3.03, alkalinity: 3.03 }, "filter")).toMatchObject(
      {
        zone: "extended",
        roundedGrade: 1,
        label: "sehr gut",
      },
    );
  });

  it("separates core, extended, usable, and outside zones", () => {
    expect(evaluateWaterProfile({ totalHardness: 2.5, alkalinity: 1.5 }, "filter")).toMatchObject({
      zone: "core",
      roundedGrade: 1,
    });
    expect(evaluateWaterProfile({ totalHardness: 7.8, alkalinity: 4.4 }, "filter")).toMatchObject({
      zone: "extended",
      roundedGrade: 2,
    });
    expect(evaluateWaterProfile({ totalHardness: 12, alkalinity: 7 }, "filter")).toMatchObject({
      zone: "usable",
      roundedGrade: 3,
      inUsableRange: true,
    });
    expect(evaluateWaterProfile({ totalHardness: 20, alkalinity: 12 }, "filter")).toMatchObject({
      zone: "outside",
      inUsableRange: false,
    });
  });

  it("uses tolerant school grades for close low-mineral water", () => {
    const blackForestLike = classifyWaterProfile({ totalHardness: 1.54, alkalinity: 1.4 }, "all");

    expect(blackForestLike.evaluations.filter.roundedGrade).toBe(1);
    expect(blackForestLike.evaluations.espresso.roundedGrade).toBe(2);
  });

  it("keeps moderately hard misses in the usable middle grades", () => {
    const fuerstBismarckLike = classifyWaterProfile(
      { totalHardness: 9.48, alkalinity: 8.62 },
      "all",
    );

    expect(fuerstBismarckLike.evaluations.filter.roundedGrade).toBe(3);
    expect(fuerstBismarckLike.evaluations.espresso.roundedGrade).toBe(3);
    expect(fuerstBismarckLike.best.label).toBe("brauchbar");
  });

  it("scores larger misses higher than close misses", () => {
    const close = scoreWaterProfile({ totalHardness: 3.5, alkalinity: 2.2 }, "espresso");
    const far = scoreWaterProfile({ totalHardness: 10, alkalinity: 8 }, "espresso");

    expect(close).toBeLessThan(far);
  });
});
