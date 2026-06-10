import { describe, expect, it } from "vitest";
import {
  formatDashboardDateSubtitle,
  formatDashboardWeekdayLabel,
  formatDateKeyList,
  formatPasteTargetLabel,
  getRelativeWeekDayLabel
} from "./plannerViewHelpers";

describe("formatDashboardDateSubtitle", () => {
  it("formats a valid date key as month-day-year", () => {
    expect(formatDashboardDateSubtitle("2026-06-10")).toBe("June 10, 2026");
  });

  it("returns the raw key when the date key is invalid", () => {
    expect(formatDashboardDateSubtitle("not-a-date")).toBe("not-a-date");
  });
});

describe("formatDashboardWeekdayLabel", () => {
  it("returns a long weekday name for a valid date key", () => {
    // 2026-06-10 is a Wednesday
    expect(formatDashboardWeekdayLabel("2026-06-10")).toBe("Wednesday");
  });

  it("returns an empty string for an invalid date key", () => {
    expect(formatDashboardWeekdayLabel("bad-key")).toBe("");
  });
});

describe("formatDateKeyList", () => {
  it("formats a single date key as a full label", () => {
    expect(formatDateKeyList(["2026-06-10"])).toBe("Wednesday, June 10, 2026");
  });

  it("formats multiple date keys as a comma-separated list", () => {
    const result = formatDateKeyList(["2026-06-10", "2026-06-11"]);
    expect(result).toBe("Wednesday, June 10, 2026, Thursday, June 11, 2026");
  });

  it("returns an empty string for an empty array", () => {
    expect(formatDateKeyList([])).toBe("");
  });
});

describe("formatPasteTargetLabel", () => {
  it("returns the full date label for a single date key", () => {
    expect(formatPasteTargetLabel(["2026-06-10"])).toBe("Wednesday, June 10, 2026");
  });

  it("summarizes multiple same-weekday same-month same-year dates compactly", () => {
    // Four Thursdays in June 2026
    const result = formatPasteTargetLabel([
      "2026-06-04",
      "2026-06-11",
      "2026-06-18",
      "2026-06-25"
    ]);

    expect(result).toBe("4 Thursdays in June 2026");
  });

  it("falls back to a comma-separated list for dates spanning different months", () => {
    const result = formatPasteTargetLabel(["2026-06-10", "2026-07-10"]);
    expect(result).toContain("June 10, 2026");
    expect(result).toContain("July 10, 2026");
  });

  it("falls back to a comma-separated list for dates with different weekdays", () => {
    // Wednesday and Thursday in the same month and year
    const result = formatPasteTargetLabel(["2026-06-10", "2026-06-11"]);
    expect(result).toContain("Wednesday, June 10, 2026");
    expect(result).toContain("Thursday, June 11, 2026");
  });
});

describe("getRelativeWeekDayLabel", () => {
  it("returns 'Today' for offset 0", () => {
    expect(getRelativeWeekDayLabel(0)).toBe("Today");
  });

  it("returns 'Tomorrow' for offset 1", () => {
    expect(getRelativeWeekDayLabel(1)).toBe("Tomorrow");
  });

  it("returns 'Day after Tomorrow' for offset 2", () => {
    expect(getRelativeWeekDayLabel(2)).toBe("Day after Tomorrow");
  });

  it("returns undefined for offsets 3 and above", () => {
    expect(getRelativeWeekDayLabel(3)).toBeUndefined();
    expect(getRelativeWeekDayLabel(6)).toBeUndefined();
    expect(getRelativeWeekDayLabel(100)).toBeUndefined();
  });
});
