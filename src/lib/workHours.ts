/**
 * Rounds an hours value to the nearest quarter hour, for consistency with the rest of the
 * app's quarter-hour granularity (see lib/timeline.ts's slot model).
 *
 * @param hours - Raw decimal hours.
 * @returns Hours rounded to the nearest 0.25.
 */
export function roundToQuarterHour(hours: number): number {
  return Math.round(hours * 4) / 4;
}

/**
 * Parses a raw numeric hours input string into a normalized, quarter-hour-rounded value.
 *
 * @param raw - Raw text from a numeric hours input.
 * @returns A positive number rounded to the nearest 0.25, or null if not a valid positive number.
 */
export function parseHoursInput(raw: string): number | null {
  const trimmed = raw.trim();

  if (trimmed === "") {
    return null;
  }

  const value = Number(trimmed);

  if (!Number.isFinite(value) || value <= 0) {
    return null;
  }

  return roundToQuarterHour(value);
}

/**
 * Parses an "HH:MM" 24-hour string into total minutes since midnight.
 *
 * @param time - Candidate time string, as produced by an `<input type="time">`.
 * @returns Total minutes since midnight, or null if malformed.
 */
function parseTimeStringToMinutes(time: string): number | null {
  const match = /^(\d{2}):(\d{2})$/.exec(time);

  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (hours > 23 || minutes > 59) {
    return null;
  }

  return hours * 60 + minutes;
}

/**
 * Converts an HH:MM start/end time-range pair into a decimal hour count.
 *
 * @param startTime - 24-hour "HH:MM" string, e.g. from `<input type="time">`.
 * @param endTime - 24-hour "HH:MM" string; must be strictly later than startTime (same day only).
 * @returns Quarter-hour-rounded decimal hours, or null if either string is malformed or end <= start.
 */
export function parseTimeRangeToHours(startTime: string, endTime: string): number | null {
  const startMinutes = parseTimeStringToMinutes(startTime);
  const endMinutes = parseTimeStringToMinutes(endTime);

  if (startMinutes === null || endMinutes === null || endMinutes <= startMinutes) {
    return null;
  }

  return roundToQuarterHour((endMinutes - startMinutes) / 60);
}

/**
 * Returns true if the given date falls on a Monday-Friday workday.
 *
 * @param date - Local Date to check.
 * @returns Whether the date is a workday.
 */
export function isWorkday(date: Date): boolean {
  const day = date.getDay();
  return day >= 1 && day <= 5;
}
