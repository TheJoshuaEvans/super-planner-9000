import type { CalendarMonthView } from "./calendar";
import { TOTAL_DAY_SLOTS } from "./timeline";

/**
 * Builds an in-month date-key list for each weekday column in the month grid.
 *
 * @param monthView - Month grid data from buildCalendarMonthView.
 * @returns A seven-item array of date-key arrays, Monday through Sunday.
 */
export function buildDateKeysByWeekday(monthView: CalendarMonthView): string[][] {
  return monthView.weekdayLabels.map((_, weekdayIndex) =>
    monthView.weeks
      .map((week) => week[weekdayIndex])
      .filter((cell) => cell.isCurrentMonth)
      .map((cell) => cell.isoDate)
  );
}

/**
 * Returns a readable schedule-status label for calendar cell accessibility text.
 *
 * @param segmentCount - Number of segments scheduled on the date.
 * @returns Status label used in aria-label text.
 */
export function buildCalendarStatusLabel(segmentCount: number): string {
  return segmentCount > 0
    ? "scheduled timeline data present"
    : "no scheduled timeline data";
}

/**
 * Converts hex colors to semi-transparent preview fills for dense mini-timeline strips.
 *
 * @param color - Segment category color.
 * @returns Semi-transparent hex color when possible, otherwise original color.
 */
export function toPreviewFill(color: string): string {
  if (/^#[0-9a-fA-F]{6}$/.test(color)) {
    return `${color}66`;
  }

  return color;
}

/**
 * Builds normalized CSS percentages for a segment preview strip.
 *
 * @param startSlot - Segment start slot.
 * @param endSlot - Segment end slot.
 * @returns Left and width percentages clamped to valid timeline bounds.
 */
export function buildSegmentPreviewPercentages(startSlot: number, endSlot: number): {
  leftPercent: number;
  widthPercent: number;
} {
  const startPercent = Math.max(0, Math.min(100, (startSlot / TOTAL_DAY_SLOTS) * 100));
  const endPercent = Math.max(0, Math.min(100, (endSlot / TOTAL_DAY_SLOTS) * 100));

  return {
    leftPercent: startPercent,
    widthPercent: Math.max(0, endPercent - startPercent)
  };
}
