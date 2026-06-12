import { describe, expect, it } from "vitest";
import {
  buildCalendarMonthView,
  formatCalendarDateLabel,
  formatCalendarDateIdentity,
  getMillisecondsUntilNextMidnight,
  getRelativeCalendarDateKey,
  getMonthStart,
  parseCalendarDateKey,
  shiftMonth
} from "./calendar";

describe("calendar", () => {
  it("formats stable date identities", () => {
    expect(formatCalendarDateIdentity(new Date(2026, 5, 9))).toBe("2026-06-09");
    expect(formatCalendarDateIdentity(new Date(2024, 0, 1))).toBe("2024-01-01");
  });

  it("parses and validates date keys", () => {
    expect(formatCalendarDateIdentity(parseCalendarDateKey("2026-06-09") as Date)).toBe("2026-06-09");
    expect(parseCalendarDateKey("2026-02-30")).toBeNull();
    expect(parseCalendarDateKey("invalid")).toBeNull();
  });

  it("formats calendar date header labels", () => {
    expect(formatCalendarDateLabel("2026-06-09")).toBe("Tuesday, June 9, 2026");
    expect(formatCalendarDateLabel("not-a-date")).toBe("not-a-date");
  });

  it("builds monday-first calendar alignment", () => {
    const month = buildCalendarMonthView(new Date(2025, 5, 1), new Date(2025, 5, 15));

    expect(month.weekdayLabels).toEqual(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]);
    expect(month.weeks[0][0].isoDate).toBe("2025-05-26");
    expect(month.weeks[0][6].isoDate).toBe("2025-06-01");
  });

  it("builds complete week rows with trailing filler cells", () => {
    const month = buildCalendarMonthView(new Date(2026, 1, 1), new Date(2026, 1, 10));
    const flat = month.weeks.flat();

    expect(month.weeks.every((week) => week.length === 7)).toBe(true);
    expect(flat.length).toBeGreaterThanOrEqual(35);
    expect(flat.length).toBeLessThanOrEqual(42);
  });

  it("navigates month boundaries across years", () => {
    expect(formatCalendarDateIdentity(shiftMonth(new Date(2025, 11, 15), 1))).toBe("2026-01-01");
    expect(formatCalendarDateIdentity(shiftMonth(new Date(2026, 0, 2), -1))).toBe("2025-12-01");
    expect(formatCalendarDateIdentity(getMonthStart(new Date(2026, 7, 22)))).toBe("2026-08-01");
  });

  it("derives relative date keys from a base date", () => {
    const base = new Date(2025, 11, 31);

    expect(getRelativeCalendarDateKey(0, base)).toBe("2025-12-31");
    expect(getRelativeCalendarDateKey(1, base)).toBe("2026-01-01");
    expect(getRelativeCalendarDateKey(-1, base)).toBe("2025-12-30");
  });

  it("computes milliseconds until the next local midnight", () => {
    expect(getMillisecondsUntilNextMidnight(new Date(2026, 5, 9, 23, 59, 0))).toBe(60_000);
    expect(getMillisecondsUntilNextMidnight(new Date(2026, 5, 9, 0, 0, 0))).toBe(24 * 60 * 60 * 1000);
    expect(getMillisecondsUntilNextMidnight(new Date(2025, 11, 31, 12, 0, 0))).toBe(12 * 60 * 60 * 1000);
  });
});
