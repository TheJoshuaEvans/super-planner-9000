import { describe, expect, it } from "vitest";
import {
  DEFAULT_SEGMENT_DURATION_SLOTS,
  HOURS_PER_DAY,
  SLOTS_PER_HOUR,
  TOTAL_DAY_SLOTS,
  formatHourLabel,
  formatSlotLabel,
  formatSlotRangeLabel,
  hourMarks,
  quarterHourMarks,
  slotToHour
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
    expect(formatHourLabel(9)).toBe("9");
    expect(slotToHour(10)).toBe(2.5);
    expect(formatSlotLabel(0)).toBe("00:00");
    expect(formatSlotLabel(5)).toBe("01:15");
    expect(formatSlotRangeLabel(4, 8)).toBe("01:00-02:00");
  });
});
