export const HOURS_PER_DAY = 24;
export const SLOTS_PER_HOUR = 4;
export const TOTAL_DAY_SLOTS = HOURS_PER_DAY * SLOTS_PER_HOUR;
export const DEFAULT_SEGMENT_DURATION_SLOTS = 4;

export const hourMarks = Array.from({ length: HOURS_PER_DAY + 1 }, (_, index) => index);
export const quarterHourMarks = Array.from({ length: TOTAL_DAY_SLOTS + 1 }, (_, index) => index);

/**
 * Formats an hour marker label for the timeline header.
 */
export function formatHourLabel(hour: number): string {
  return `${hour}`;
}

/**
 * Converts a quarter-hour slot index into an hour value.
 */
export function slotToHour(slot: number): number {
  return slot / SLOTS_PER_HOUR;
}

/**
 * Pads a time component to two digits for display.
 */
function padTimeValue(value: number): string {
  return value.toString().padStart(2, "0");
}

/**
 * Formats a single slot index as an HH:MM time label.
 */
export function formatSlotLabel(slot: number): string {
  const hour = Math.floor(slotToHour(slot));
  const minutes = (slot % SLOTS_PER_HOUR) * 15;

  return `${padTimeValue(hour)}:${padTimeValue(minutes)}`;
}

/**
 * Formats a slot range as a readable time span.
 */
export function formatSlotRangeLabel(startSlot: number, endSlot: number): string {
  return `${formatSlotLabel(startSlot)}-${formatSlotLabel(endSlot)}`;
}