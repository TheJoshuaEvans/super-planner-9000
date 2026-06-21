import { clampSlot, formatSlotLabel, snapSlot, TOTAL_DAY_SLOTS } from "./timeline";
import { parseTimeStringToMinutes } from "./workHours";

/**
 * Converts a start-of-range "HH:MM" string into its quarter-hour slot index.
 *
 * @param value - "HH:MM" 24-hour string.
 * @returns Slot index (0 = midnight), or 0 if malformed.
 */
export function startTimeToSlot(value: string): number {
  const minutes = parseTimeStringToMinutes(value);
  return minutes === null ? 0 : Math.round(minutes / 15);
}

/**
 * Converts an end-of-range "HH:MM" string into its quarter-hour slot index, treating "00:00" as
 * the end of the day (slot 96) rather than its start, mirroring `parseTimeRangeToHours`.
 *
 * @param value - "HH:MM" 24-hour string.
 * @returns Slot index (96 = midnight at the end of the day), or 96 if malformed.
 */
export function endTimeToSlot(value: string): number {
  if (value === "00:00") return TOTAL_DAY_SLOTS;
  const minutes = parseTimeStringToMinutes(value);
  return minutes === null ? TOTAL_DAY_SLOTS : Math.round(minutes / 15);
}

/**
 * Converts a quarter-hour slot index back into an "HH:MM" 24-hour string, wrapping a full day
 * (slot 96) back to "00:00" so it round-trips through `endTimeToSlot`.
 *
 * @param slot - Quarter-hour slot index.
 * @returns Zero-padded "HH:MM" 24-hour string.
 */
export function slotToTimeString(slot: number): string {
  return formatSlotLabel(slot % TOTAL_DAY_SLOTS);
}

/**
 * Resolves the snapped slot position for whichever handle is actively being dragged, nudging it
 * away from the other (stationary) handle's slot by one quarter-hour if they would otherwise land
 * on the exact same slot, which would collapse the range to zero duration.
 *
 * @param rawSlot - Unsnapped slot position under the pointer.
 * @param stationarySlot - The other handle's slot position, frozen for the current drag gesture.
 * @returns The dragged handle's new slot position, guaranteed not to equal `stationarySlot`.
 */
export function resolveDraggedSlot(rawSlot: number, stationarySlot: number): number {
  let slot = snapSlot(rawSlot);

  if (slot === stationarySlot) {
    if (stationarySlot <= 0) {
      slot = stationarySlot + 1;
    } else if (stationarySlot >= TOTAL_DAY_SLOTS) {
      slot = stationarySlot - 1;
    } else {
      slot = rawSlot < stationarySlot ? stationarySlot - 1 : stationarySlot + 1;
    }
  }

  return clampSlot(slot);
}
