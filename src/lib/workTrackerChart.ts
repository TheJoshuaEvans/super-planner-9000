import { formatCalendarDateIdentity } from "./calendar";
import { isWorkday } from "./workHours";
import type { WorkEntriesByDate, WorkProject } from "../store/workTrackerStore.types";

/**
 * One point on the cumulative work-hours chart for a single day of the visible month. Project
 * keys are flattened (one numeric key per projectId) so Recharts Area dataKeys can address them
 * directly.
 */
export type WorkChartDataPoint = {
  day: number;
  dateKey: string;
  expectedCumulative: number;
  [projectId: string]: number | string;
};

/**
 * Builds one cumulative chart data point per day in the given month, for every day from the 1st
 * through the last day of the month (including future days, which simply hold their running
 * total flat since no entries exist yet).
 *
 * @param monthPivot - Any Date within the target month (year/month are read off it).
 * @param entriesByDate - All persisted work entries, keyed by YYYY-MM-DD.
 * @param projects - Known projects, used to seed every day's per-project keys at 0.
 * @returns One WorkChartDataPoint per calendar day of the month, in day order.
 */
export function buildMonthlyWorkChartData(
  monthPivot: Date,
  entriesByDate: WorkEntriesByDate,
  projects: WorkProject[]
): WorkChartDataPoint[] {
  const year = monthPivot.getFullYear();
  const month = monthPivot.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  let expectedRunningTotal = 0;
  const actualRunningTotals: Record<string, number> = Object.fromEntries(
    projects.map((project) => [project.id, 0])
  );

  const points: WorkChartDataPoint[] = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);

    if (isWorkday(date)) {
      expectedRunningTotal += 8;
    }

    const dateKey = formatCalendarDateIdentity(date);

    for (const entry of entriesByDate[dateKey] ?? []) {
      actualRunningTotals[entry.projectId] = (actualRunningTotals[entry.projectId] ?? 0) + entry.hours;
    }

    points.push({
      day,
      dateKey,
      expectedCumulative: expectedRunningTotal,
      ...actualRunningTotals
    });
  }

  return points;
}
