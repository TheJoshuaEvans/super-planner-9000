import { describe, expect, it } from "vitest";
import { resolveCurrentTimePercent } from "./timelineNow";

describe("resolveCurrentTimePercent", () => {
  it("returns 0 at local midnight", () => {
    const midnight = new Date(2026, 5, 9, 0, 0, 0);

    expect(resolveCurrentTimePercent(midnight)).toBe(0);
  });

  it("returns 50 at local noon", () => {
    const noon = new Date(2026, 5, 9, 12, 0, 0);

    expect(resolveCurrentTimePercent(noon)).toBe(50);
  });

  it("returns a value just below 100 before midnight", () => {
    const beforeMidnight = new Date(2026, 5, 9, 23, 59, 59);

    expect(resolveCurrentTimePercent(beforeMidnight)).toBeGreaterThan(99.9);
    expect(resolveCurrentTimePercent(beforeMidnight)).toBeLessThan(100);
  });
});
