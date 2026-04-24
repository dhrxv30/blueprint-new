import { describe, expect, it } from "vitest";
import {
  calculateCompleteness,
  calculateComplexity,
  calculateTimelineWeeks,
  normalizeHealthScore,
} from "@/lib/projectMetrics";

describe("projectMetrics", () => {
  it("calculates weighted completeness instead of binary 100", () => {
    const score = calculateCompleteness({
      features: [{}],
      stories: [{}],
      tasks: [{}],
      architecture: { nodes: [] },
    });

    expect(score).toBe(50);
  });

  it("increases complexity when dependencies and ambiguities rise", () => {
    const complexity = calculateComplexity(
      [
        { complexity: 5, dependencies: ["a", "b"] },
        { complexity: 8, dependencies: ["c", "d"] },
        { complexity: 8, dependencies: ["e", "f"] },
      ],
      ["amb1", "amb2", "amb3", "amb4", "amb5", "amb6", "amb7", "amb8"]
    );

    expect(complexity).toBe("Medium");
  });

  it("keeps timeline at least planned sprint count and risk-adjusts", () => {
    const weeks = calculateTimelineWeeks(
      [
        { complexity: 8, dependencies: ["a", "b", "c"] },
        { complexity: 8, dependencies: ["d", "e"] },
      ],
      { ambiguities: ["x", "y", "z"], plannedSprints: 3 }
    );

    expect(weeks).toBeGreaterThanOrEqual(3);
  });

  it("derives bounded health score when model score missing", () => {
    const health = normalizeHealthScore(undefined, ["a", "b", "c"], 80);

    expect(health).toBeGreaterThanOrEqual(10);
    expect(health).toBeLessThanOrEqual(92);
  });
});
