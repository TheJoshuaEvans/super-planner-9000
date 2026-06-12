export const MONDAY_FIRST_WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export type CalendarDayCell = {
  date: Date;
  isoDate: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
};

export type CalendarMonthView = {
  monthLabel: string;
  weekdayLabels: readonly string[];
  weeks: CalendarDayCell[][];
};

/**
 * Normalizes a Date to a local midnight date-only value.
 *
 * @param year - Local calendar year.
 * @param month - Zero-based month index.
 * @param day - One-based day of month.
 * @returns Local Date at midnight for the provided calendar parts.
 */
function toLocalDate(year: number, month: number, day: number): Date {
  return new Date(year, month, day);
}

/**
 * Formats a date identity string used for debug output and stable comparisons.
 *
 * @param date - Local Date to format.
 * @returns Date key in YYYY-MM-DD format.
 */
export function formatCalendarDateIdentity(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Parses a YYYY-MM-DD date key into a local Date, returning null for invalid keys.
 *
 * @param dateKey - Candidate calendar date key.
 * @returns Parsed local Date, or null when invalid.
 */
export function parseCalendarDateKey(dateKey: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
    return null;
  }

  const [yearRaw, monthRaw, dayRaw] = dateKey.split("-");
  const year = Number(yearRaw);
  const monthIndex = Number(monthRaw) - 1;
  const day = Number(dayRaw);

  if (!Number.isFinite(year) || !Number.isFinite(monthIndex) || !Number.isFinite(day)) {
    return null;
  }

  const parsed = toLocalDate(year, monthIndex, day);
  return formatCalendarDateIdentity(parsed) === dateKey ? parsed : null;
}

/**
 * Formats a date key as a human-readable header label.
 *
 * @param dateKey - Calendar date key in YYYY-MM-DD format.
 * @returns Long-form date label, or the original key when parsing fails.
 */
export function formatCalendarDateLabel(dateKey: string): string {
  const parsed = parseCalendarDateKey(dateKey);

  if (!parsed) {
    return dateKey;
  }

  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  }).format(parsed);
}

/**
 * Returns a date key for a local date offset by N days from the provided base date.
 *
 * @param offsetDays - Signed day offset from base date.
 * @param baseDate - Base local Date used as the offset origin.
 * @returns Offset date key in YYYY-MM-DD format.
 */
export function getRelativeCalendarDateKey(offsetDays: number, baseDate: Date = new Date()): string {
  const relative = toLocalDate(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() + offsetDays);
  return formatCalendarDateIdentity(relative);
}

/**
 * Computes how many milliseconds remain until the next local midnight after the given time.
 *
 * @param now - Current local Date.
 * @returns Milliseconds until the start of the following local day.
 */
export function getMillisecondsUntilNextMidnight(now: Date): number {
  const nextMidnight = toLocalDate(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return nextMidnight.getTime() - now.getTime();
}

/**
 * Returns the first day of the provided month in local time.
 *
 * @param date - Any local Date within the target month.
 * @returns Local Date at the first day of the month.
 */
export function getMonthStart(date: Date): Date {
  return toLocalDate(date.getFullYear(), date.getMonth(), 1);
}

/**
 * Moves a month date pivot forward or backward by the provided month delta.
 *
 * @param date - Month pivot Date.
 * @param deltaMonths - Signed month offset to apply.
 * @returns Local Date at day 1 of the shifted month.
 */
export function shiftMonth(date: Date, deltaMonths: number): Date {
  return toLocalDate(date.getFullYear(), date.getMonth() + deltaMonths, 1);
}

/**
 * Converts JS weekday index (Sun=0) to Monday-first index (Mon=0).
 *
 * @param jsWeekday - Native Date.getDay weekday index.
 * @returns Monday-first weekday index.
 */
function getMondayFirstWeekdayIndex(jsWeekday: number): number {
  return (jsWeekday + 6) % 7;
}

/**
 * Builds Monday-first wall-calendar data for a month including filler cells.
 *
 * @param visibleMonth - Any date within the visible month.
 * @param now - Current local date used to flag the today cell.
 * @returns Month view model with weekday labels and week rows.
 */
export function buildCalendarMonthView(visibleMonth: Date, now: Date = new Date()): CalendarMonthView {
  const monthStart = getMonthStart(visibleMonth);
  const year = monthStart.getFullYear();
  const month = monthStart.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadingCells = getMondayFirstWeekdayIndex(monthStart.getDay());
  const totalCells = Math.ceil((leadingCells + daysInMonth) / 7) * 7;
  const firstCellDate = toLocalDate(year, month, 1 - leadingCells);
  const todayIdentity = formatCalendarDateIdentity(now);

  const cells = Array.from({ length: totalCells }, (_, index) => {
    const date = toLocalDate(firstCellDate.getFullYear(), firstCellDate.getMonth(), firstCellDate.getDate() + index);
    const isoDate = formatCalendarDateIdentity(date);
    return {
      date,
      isoDate,
      dayNumber: date.getDate(),
      isCurrentMonth: date.getMonth() === month,
      isToday: isoDate === todayIdentity
    } satisfies CalendarDayCell;
  });

  const weeks = Array.from({ length: cells.length / 7 }, (_, weekIndex) =>
    cells.slice(weekIndex * 7, weekIndex * 7 + 7)
  );

  const monthLabel = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric"
  }).format(monthStart);

  return {
    monthLabel,
    weekdayLabels: MONDAY_FIRST_WEEKDAY_LABELS,
    weeks
  };
}
