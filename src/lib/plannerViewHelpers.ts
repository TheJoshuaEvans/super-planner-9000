import { formatCalendarDateLabel, parseCalendarDateKey } from "./calendar";
import type { PlannerDateKey } from "../store/plannerStore";

/**
 * Formats a YYYY-MM-DD date key as a month-day-year subtitle for dashboard timeline headers.
 *
 * @param dateKey - A YYYY-MM-DD calendar date key.
 * @returns A human-readable date string such as "June 10, 2026", or the raw key on parse failure.
 */
export function formatDashboardDateSubtitle(dateKey: PlannerDateKey): string {
  const parsedDate = parseCalendarDateKey(dateKey);

  if (!parsedDate) {
    return dateKey;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric"
  }).format(parsedDate);
}

/**
 * Formats a YYYY-MM-DD date key as a long weekday name for dashboard timeline title badges.
 *
 * @param dateKey - A YYYY-MM-DD calendar date key.
 * @returns A long weekday name such as "Monday", or an empty string on parse failure.
 */
export function formatDashboardWeekdayLabel(dateKey: PlannerDateKey): string {
  const parsedDate = parseCalendarDateKey(dateKey);

  if (!parsedDate) {
    return "";
  }

  return new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(parsedDate);
}

/**
 * Formats a list of date keys as a comma-separated string of full date labels.
 *
 * @param dateKeys - Array of YYYY-MM-DD calendar date keys.
 * @returns Comma-separated human-readable date labels.
 */
export function formatDateKeyList(dateKeys: PlannerDateKey[]): string {
  return dateKeys.map((dateKey) => formatCalendarDateLabel(dateKey)).join(", ");
}

/**
 * Formats a paste target label for one or more destination dates.
 *
 * For a single date, returns the formatted full date label.
 * For multiple dates sharing the same weekday, month, and year, returns a compact summary
 * such as "4 Thursdays in June 2026". Otherwise falls back to a comma-separated list.
 *
 * @param dateKeys - Array of YYYY-MM-DD destination date keys.
 * @returns A compact, human-readable label describing the paste target.
 */
export function formatPasteTargetLabel(dateKeys: PlannerDateKey[]): string {
  if (dateKeys.length === 1) {
    return formatCalendarDateLabel(dateKeys[0]);
  }

  const parsedDates = dateKeys
    .map((dateKey) => parseCalendarDateKey(dateKey))
    .filter((date): date is Date => date !== null);

  if (parsedDates.length === dateKeys.length) {
    const weekdayFormatter = new Intl.DateTimeFormat("en-US", { weekday: "long" });
    const monthFormatter = new Intl.DateTimeFormat("en-US", { month: "long" });
    const yearFormatter = new Intl.DateTimeFormat("en-US", { year: "numeric" });

    const firstDate = parsedDates[0];
    const weekdayName = weekdayFormatter.format(firstDate);
    const monthName = monthFormatter.format(firstDate);
    const yearLabel = yearFormatter.format(firstDate);
    const allSameWeekday = parsedDates.every((date) => weekdayFormatter.format(date) === weekdayName);
    const allSameMonth = parsedDates.every((date) => monthFormatter.format(date) === monthName);
    const allSameYear = parsedDates.every((date) => yearFormatter.format(date) === yearLabel);

    if (allSameWeekday && allSameMonth && allSameYear) {
      return `${dateKeys.length} ${weekdayName}s in ${monthName} ${yearLabel}`;
    }
  }

  return formatDateKeyList(dateKeys);
}

/**
 * Returns the relative human-readable label for a meal planner week row at the given day offset.
 * Only the first three rows receive a label; offsets 3 and above return undefined.
 *
 * @param dayOffset - Zero-based offset from today (0 = today, 1 = tomorrow, ...).
 * @returns "Today", "Tomorrow", "Day after Tomorrow", or undefined.
 */
export function getMealPlannerRelativeLabel(dayOffset: number): string | undefined {
  if (dayOffset === 0) return "Today";
  if (dayOffset === 1) return "Tomorrow";
  if (dayOffset === 2) return "Day after Tomorrow";
  return undefined;
}
