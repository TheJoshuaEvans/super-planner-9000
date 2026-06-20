import { describe, expect, it } from "vitest";
import { isWorkday, parseHoursInput, parseTimeRangeToHours, roundToQuarterHour } from "./workHours";

describe("roundToQuarterHour", () => {
  it("rounds to the nearest quarter hour", () => {
    expect(roundToQuarterHour(1.1)).toBe(1);
    expect(roundToQuarterHour(1.2)).toBe(1.25);
    expect(roundToQuarterHour(1.4)).toBe(1.5);
  });
});

describe("parseHoursInput", () => {
  it("parses a plain integer", () => {
    expect(parseHoursInput("8")).toBe(8);
  });

  it("parses a decimal and rounds to nearest quarter hour", () => {
    expect(parseHoursInput("1.1")).toBe(1);
    expect(parseHoursInput("7.5")).toBe(7.5);
  });

  it("trims surrounding whitespace", () => {
    expect(parseHoursInput("  4  ")).toBe(4);
  });

  it("rejects zero and negative values", () => {
    expect(parseHoursInput("0")).toBeNull();
    expect(parseHoursInput("-2")).toBeNull();
  });

  it("rejects empty or non-numeric input", () => {
    expect(parseHoursInput("")).toBeNull();
    expect(parseHoursInput("   ")).toBeNull();
    expect(parseHoursInput("abc")).toBeNull();
  });
});

describe("parseTimeRangeToHours", () => {
  it("converts a simple morning range", () => {
    expect(parseTimeRangeToHours("09:00", "17:00")).toBe(8);
  });

  it("rounds fractional minutes to nearest quarter hour", () => {
    expect(parseTimeRangeToHours("09:00", "09:50")).toBe(0.75);
  });

  it("rejects end equal to or before start (no overnight ranges)", () => {
    expect(parseTimeRangeToHours("17:00", "09:00")).toBeNull();
    expect(parseTimeRangeToHours("09:00", "09:00")).toBeNull();
  });

  it("rejects malformed time strings", () => {
    expect(parseTimeRangeToHours("9:00", "17:00")).toBeNull();
    expect(parseTimeRangeToHours("09:00", "25:00")).toBeNull();
    expect(parseTimeRangeToHours("09:00", "09:75")).toBeNull();
  });
});

describe("isWorkday", () => {
  it("treats Monday through Friday as workdays", () => {
    expect(isWorkday(new Date(2026, 5, 8))).toBe(true); // Mon Jun 8 2026
    expect(isWorkday(new Date(2026, 5, 12))).toBe(true); // Fri Jun 12 2026
  });

  it("treats Saturday and Sunday as non-workdays", () => {
    expect(isWorkday(new Date(2026, 5, 13))).toBe(false); // Sat
    expect(isWorkday(new Date(2026, 5, 14))).toBe(false); // Sun
  });
});
