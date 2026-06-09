export const HOURS_PER_DAY = 24;
export const SLOTS_PER_HOUR = 4;
export const TOTAL_DAY_SLOTS = HOURS_PER_DAY * SLOTS_PER_HOUR;
export const DEFAULT_SEGMENT_DURATION_SLOTS = 4;

export const hourMarks = Array.from({ length: HOURS_PER_DAY + 1 }, (_, index) => index);
export const quarterHourMarks = Array.from({ length: TOTAL_DAY_SLOTS + 1 }, (_, index) => index);

/**
 * Formats an hour marker label for the timeline header.
 *
 * @param hour - Hour marker index.
 * @returns Lowercase 12-hour marker label like 12am, 1pm.
 */
export function formatHourLabel(hour: number): string {
  const normalized = ((hour % HOURS_PER_DAY) + HOURS_PER_DAY) % HOURS_PER_DAY;
  const meridiem = normalized < 12 ? "am" : "pm";
  const baseHour = normalized % 12;
  const displayHour = baseHour === 0 ? 12 : baseHour;

  return `${displayHour}${meridiem}`;
}

/**
 * Converts a quarter-hour slot index into an hour value.
 *
 * @param slot - Quarter-hour slot index.
 * @returns Fractional hour value.
 */
export function slotToHour(slot: number): number {
  return slot / SLOTS_PER_HOUR;
}

/**
 * Pads a time component to two digits for display.
 *
 * @param value - Numeric time component.
 * @returns Two-digit string representation.
 */
function padTimeValue(value: number): string {
  return value.toString().padStart(2, "0");
}

/**
 * Formats a single slot index as an HH:MM time label.
 *
 * @param slot - Quarter-hour slot index.
 * @returns Zero-padded 24-hour wall-clock label.
 */
export function formatSlotLabel(slot: number): string {
  const hour = Math.floor(slotToHour(slot));
  const minutes = (slot % SLOTS_PER_HOUR) * 15;

  return `${padTimeValue(hour)}:${padTimeValue(minutes)}`;
}

/**
 * Formats a slot range as a readable time span.
 *
 * @param startSlot - Inclusive slot where range starts.
 * @param endSlot - Exclusive slot where range ends.
 * @returns 24-hour range label like 08:00-09:30.
 */
export function formatSlotRangeLabel(startSlot: number, endSlot: number): string {
  return `${formatSlotLabel(startSlot)}-${formatSlotLabel(endSlot)}`;
}

/**
 * Formats a single slot index as a 12-hour h:MM AM/PM label.
 *
 * @param slot - Quarter-hour slot index.
 * @returns 12-hour label like 8:15 AM.
 */
export function formatSlotLabelMeridiem(slot: number): string {
  const hour24 = Math.floor(slotToHour(slot));
  const minutes = (slot % SLOTS_PER_HOUR) * 15;
  const suffix = hour24 < 12 ? "AM" : "PM";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;

  return `${hour12}:${padTimeValue(minutes)} ${suffix}`;
}

/**
 * Formats a slot range as a 12-hour time span.
 *
 * @param startSlot - Inclusive slot where range starts.
 * @param endSlot - Exclusive slot where range ends.
 * @returns 12-hour range label like 8:00 AM-9:30 AM.
 */
export function formatSlotRangeLabelMeridiem(startSlot: number, endSlot: number): string {
  return `${formatSlotLabelMeridiem(startSlot)}-${formatSlotLabelMeridiem(endSlot)}`;
}

/**
 * Formats a slot range duration as a compact hours/minutes label.
 *
 * @param startSlot - Inclusive slot where duration starts.
 * @param endSlot - Exclusive slot where duration ends.
 * @returns Compact duration label like 45m, 1h, or 1h 30m.
 */
export function formatSlotDurationLabel(startSlot: number, endSlot: number): string {
  const totalMinutes = Math.max(0, endSlot - startSlot) * 15;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}m`;
  }

  if (hours > 0) {
    return `${hours}h`;
  }

  return `${minutes}m`;
}

/**
 * Formats a local Date into a 12-hour wall-clock label for UI hints.
 *
 * @param date - Local Date to format.
 * @returns 12-hour clock label like 3:05 PM.
 */
export function formatClockTimeLabel(date: Date): string {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const suffix = hours < 12 ? "AM" : "PM";
  const displayHour = hours % 12 === 0 ? 12 : hours % 12;

  return `${displayHour}:${padTimeValue(minutes)} ${suffix}`;
}

/**
 * Clamps a slot index to the valid day range.
 *
 * @param slot - Raw slot index.
 * @returns Slot clamped to [0, TOTAL_DAY_SLOTS].
 */
export function clampSlot(slot: number): number {
  return Math.max(0, Math.min(TOTAL_DAY_SLOTS, slot));
}

/**
 * Rounds a slot value to the nearest 15-minute boundary.
 *
 * @param slot - Raw slot value.
 * @returns Nearest integer slot index.
 */
export function snapSlot(slot: number): number {
  return Math.round(slot);
}

/**
 * Converts a pointer x-coordinate into a slot position within a track.
 *
 * @param clientX - Pointer x-coordinate in viewport pixels.
 * @param trackLeft - Track left edge in viewport pixels.
 * @param trackWidth - Track width in pixels.
 * @returns Slot position clamped to valid day bounds.
 */
export function clientXToSlot(clientX: number, trackLeft: number, trackWidth: number): number {
  if (trackWidth <= 0) {
    return 0;
  }

  const relative = (clientX - trackLeft) / trackWidth;
  return clampSlot(relative * TOTAL_DAY_SLOTS);
}
