import { describe, expect, it } from "vitest";
import { buildCalendarMonthView } from "./calendar";
import {
  buildCalendarStatusLabel,
  buildDateKeysByWeekday,
  buildSegmentPreviewPercentages,
  toPreviewFill
} from "./monthlyCalendarPreview";

describe("monthlyCalendarPreview", () => {
  it("builds in-month date keys grouped by weekday", () => {
    const monthView = buildCalendarMonthView(new Date(2026, 5, 1), new Date(2026, 5, 9));
    const grouped = buildDateKeysByWeekday(monthView);

    expect(grouped).toHaveLength(7);
    expect(grouped[0][0]).toBe("2026-06-01");
    expect(grouped[6][0]).toBe("2026-06-07");
    expect(grouped.every((weekdayDates) => weekdayDates.every((dateKey) => dateKey.startsWith("2026-06-")))).toBe(true);
  });

  it("returns accessibility-friendly status labels", () => {
    expect(buildCalendarStatusLabel(0)).toBe("no scheduled timeline data");
    expect(buildCalendarStatusLabel(3)).toBe("scheduled timeline data present");
  });

  it("adds alpha channel to six-digit hex colors", () => {
    expect(toPreviewFill("#112233")).toBe("#11223366");
    expect(toPreviewFill("rgb(17, 34, 51)")).toBe("rgb(17, 34, 51)");
  });

  it("normalizes segment preview percentages", () => {
    expect(buildSegmentPreviewPercentages(0, 24)).toEqual({ leftPercent: 0, widthPercent: 25 });
    expect(buildSegmentPreviewPercentages(-8, 120)).toEqual({ leftPercent: 0, widthPercent: 100 });
    expect(buildSegmentPreviewPercentages(50, 40)).toEqual({ leftPercent: 52.083333333333336, widthPercent: 0 });
  });
});
