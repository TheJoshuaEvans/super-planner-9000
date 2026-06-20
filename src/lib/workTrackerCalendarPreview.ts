import { toPreviewFill } from "./monthlyCalendarPreview";
import type { WorkEntry, WorkProject } from "../store/workTrackerStore.types";

/** Fixed scale (hours) that a single day's preview bar is proportioned against. */
export const CALENDAR_PREVIEW_MAX_HOURS = 24;

/** Standard workday length, marked as a reference line on each day's preview bar. */
export const CALENDAR_PREVIEW_WORKDAY_HOURS = 8;

/** Left-offset percentage of the standard-workday reference line within the preview bar. */
export const CALENDAR_PREVIEW_WORKDAY_MARKER_PERCENT =
  (CALENDAR_PREVIEW_WORKDAY_HOURS / CALENDAR_PREVIEW_MAX_HOURS) * 100;

/** One proportional colored band within a day's calendar preview bar. */
export type WorkDayPreviewBand = {
  projectId: string;
  leftPercent: number;
  widthPercent: number;
  color: string;
};

/**
 * Builds proportional preview bands for one day's logged hours, grouped by project and ordered
 * left-to-right in project order, scaled against a fixed CALENDAR_PREVIEW_MAX_HOURS ceiling
 * (overflow is clamped at 100%, not allowed to overflow the bar).
 *
 * @param entries - That day's WorkEntry list.
 * @param projects - Known projects, used to resolve color and a stable left-to-right order.
 * @returns Ordered preview bands with left/width percentages summing to at most 100.
 */
export function buildWorkDayPreviewBands(entries: WorkEntry[], projects: WorkProject[]): WorkDayPreviewBand[] {
  const hoursByProjectId = new Map<string, number>();

  for (const entry of entries) {
    hoursByProjectId.set(entry.projectId, (hoursByProjectId.get(entry.projectId) ?? 0) + entry.hours);
  }

  let cursorPercent = 0;
  const bands: WorkDayPreviewBand[] = [];

  for (const project of projects) {
    const hours = hoursByProjectId.get(project.id);

    if (!hours) {
      continue;
    }

    const widthPercent = Math.min(100 - cursorPercent, (hours / CALENDAR_PREVIEW_MAX_HOURS) * 100);
    bands.push({ projectId: project.id, leftPercent: cursorPercent, widthPercent, color: toPreviewFill(project.color) });
    cursorPercent += widthPercent;
  }

  return bands;
}
