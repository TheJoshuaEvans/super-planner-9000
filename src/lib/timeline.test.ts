import { describe, expect, it } from "vitest";
import {
  DEFAULT_SEGMENT_DURATION_SLOTS,
  HOURS_PER_DAY,
  SLOTS_PER_HOUR,
  TOTAL_DAY_SLOTS,
  clampSlot,
  clientXToSlot,
  formatClockTimeLabel,
  formatSlotDurationLabel,
  formatHourLabel,
  formatSlotLabel,
  formatSlotLabelMeridiem,
  formatSlotRangeLabel,
  formatSlotRangeLabelMeridiem,
  hourMarks,
  quarterHourMarks,
  slotToHour,
  snapSlot
} from "./timeline";

describe("timeline", () => {
  it("exposes timeline constants and marks", () => {
    expect(HOURS_PER_DAY).toBe(24);
    expect(SLOTS_PER_HOUR).toBe(4);
    expect(TOTAL_DAY_SLOTS).toBe(96);
    expect(DEFAULT_SEGMENT_DURATION_SLOTS).toBe(4);
    expect(hourMarks).toHaveLength(HOURS_PER_DAY + 1);
    expect(quarterHourMarks).toHaveLength(TOTAL_DAY_SLOTS + 1);
  });

  it("formats labels and slot conversions", () => {
    expect(formatHourLabel(0)).toBe("12am");
    expect(formatHourLabel(9)).toBe("9am");
    expect(formatHourLabel(12)).toBe("12pm");
    expect(formatHourLabel(15)).toBe("3pm");
    expect(formatHourLabel(24)).toBe("12am");
    expect(slotToHour(10)).toBe(2.5);
    expect(formatSlotLabel(0)).toBe("00:00");
    expect(formatSlotLabel(5)).toBe("01:15");
    expect(formatSlotRangeLabel(4, 8)).toBe("01:00-02:00");
    expect(formatSlotLabelMeridiem(0)).toBe("12:00 AM");
    expect(formatSlotLabelMeridiem(5)).toBe("1:15 AM");
    expect(formatSlotRangeLabelMeridiem(4, 8)).toBe("1:00 AM-2:00 AM");
    expect(formatSlotRangeLabelMeridiem(47, 53)).toBe("11:45 AM-1:15 PM");
    expect(formatSlotDurationLabel(4, 8)).toBe("1h");
    expect(formatSlotDurationLabel(47, 53)).toBe("1h 30m");
    expect(formatSlotDurationLabel(1, 3)).toBe("30m");
    expect(formatClockTimeLabel(new Date(2024, 0, 1, 0, 5))).toBe("12:05 AM");
    expect(formatClockTimeLabel(new Date(2024, 0, 1, 13, 30))).toBe("1:30 PM");
  });

  it("clamps, snaps, and converts pointer coordinates to slots", () => {
    expect(clampSlot(-3)).toBe(0);
    expect(clampSlot(999)).toBe(TOTAL_DAY_SLOTS);
    expect(snapSlot(5.49)).toBe(5);
    expect(snapSlot(5.5)).toBe(6);
    expect(clientXToSlot(150, 100, 200)).toBe(24);
  });
});
