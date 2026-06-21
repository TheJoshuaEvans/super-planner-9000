import { describe, expect, it } from "vitest";
import { endTimeToSlot, resolveDraggedSlot, slotToTimeString, startTimeToSlot } from "./timeRangeSlider";

describe("startTimeToSlot", () => {
  it("converts a wall-clock time to its quarter-hour slot", () => {
    expect(startTimeToSlot("09:00")).toBe(36);
    expect(startTimeToSlot("00:00")).toBe(0);
    expect(startTimeToSlot("23:45")).toBe(95);
  });

  it("falls back to slot 0 for malformed input", () => {
    expect(startTimeToSlot("not-a-time")).toBe(0);
  });
});

describe("endTimeToSlot", () => {
  it("converts a wall-clock time to its quarter-hour slot", () => {
    expect(endTimeToSlot("17:00")).toBe(68);
  });

  it("treats 00:00 as the end of the day (slot 96), not the start", () => {
    expect(endTimeToSlot("00:00")).toBe(96);
  });

  it("falls back to slot 96 for malformed input", () => {
    expect(endTimeToSlot("not-a-time")).toBe(96);
  });
});

describe("slotToTimeString", () => {
  it("formats a normal slot", () => {
    expect(slotToTimeString(36)).toBe("09:00");
  });

  it("wraps slot 96 back to 00:00, round-tripping through endTimeToSlot", () => {
    expect(slotToTimeString(96)).toBe("00:00");
    expect(endTimeToSlot(slotToTimeString(96))).toBe(96);
  });
});

describe("resolveDraggedSlot", () => {
  it("snaps to the nearest slot when away from the stationary handle", () => {
    expect(resolveDraggedSlot(40.4, 10)).toBe(40);
  });

  it("nudges left (away) when rounding up onto the stationary handle from below", () => {
    expect(resolveDraggedSlot(19.6, 20)).toBe(19);
  });

  it("nudges right (away) when rounding down onto the stationary handle from above", () => {
    expect(resolveDraggedSlot(20.4, 20)).toBe(21);
  });

  it("nudges right as an arbitrary tie-break when landing exactly on the stationary handle", () => {
    expect(resolveDraggedSlot(20, 20)).toBe(21);
  });

  it("nudges forward when the stationary handle is at the very start of the day", () => {
    expect(resolveDraggedSlot(0, 0)).toBe(1);
  });

  it("nudges backward when the stationary handle is at the very end of the day", () => {
    expect(resolveDraggedSlot(96, 96)).toBe(95);
  });

  it("clamps to the valid day range", () => {
    expect(resolveDraggedSlot(-5, 50)).toBe(0);
    expect(resolveDraggedSlot(150, 50)).toBe(96);
  });
});
