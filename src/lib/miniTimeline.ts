import type { GoogleCalendarColor, GoogleCalendarEvent } from "./googleCalendarApi";
import { clampSlot, formatSlotDurationLabel, formatSlotRangeLabelMeridiem, TOTAL_DAY_SLOTS } from "./timeline";

/** Milliseconds in a single quarter-hour timeline slot. */
const MS_PER_SLOT = 15 * 60 * 1000;

/** Fallback color used when Google hasn't returned a calendar/event color yet. */
export const DEFAULT_MINI_TIMELINE_EVENT_COLOR: GoogleCalendarColor = { background: "#14b8a6", foreground: "#ffffff" };

/** A Google Calendar event positioned onto the mini-timeline's quarter-hour slot grid for one date. */
export type MiniTimelineEvent = {
  id: string;
  title: string;
  startSlot: number;
  endSlot: number;
  isAllDay: boolean;
  color: GoogleCalendarColor;
  /** Link to view this event in the Google Calendar web UI, or `null` if Google didn't provide one. */
  htmlLink: string | null;
};

/**
 * Computes the RFC3339 local-midnight bounds for a YYYY-MM-DD date key, for use as the Calendar
 * API's `timeMin`/`timeMax` query parameters.
 *
 * @param dateKey - Date in YYYY-MM-DD form.
 * @returns Inclusive start-of-day and exclusive end-of-day timestamps.
 */
export function getDateKeyTimeRange(dateKey: string): { timeMinISO: string; timeMaxISO: string } {
  const startOfDay = new Date(`${dateKey}T00:00:00`);
  const endOfDay = new Date(`${dateKey}T00:00:00`);
  endOfDay.setDate(endOfDay.getDate() + 1);

  return { timeMinISO: startOfDay.toISOString(), timeMaxISO: endOfDay.toISOString() };
}

/**
 * Resolves the display color for an event: its own `colorId` looked up in the event color
 * palette, falling back to the primary calendar's color, then to a built-in default.
 *
 * @param colorId - The event's `colorId`, if set.
 * @param eventColorPalette - Map of `colorId` to color, from `fetchGoogleCalendarEventColorPalette`.
 * @param calendarColor - The primary calendar's color, from `fetchPrimaryGoogleCalendarColor`.
 * @returns The color to render the event with.
 */
export function resolveMiniTimelineEventColor(
  colorId: string | undefined,
  eventColorPalette: Record<string, GoogleCalendarColor>,
  calendarColor: GoogleCalendarColor | null
): GoogleCalendarColor {
  if (colorId && eventColorPalette[colorId]) {
    return eventColorPalette[colorId];
  }

  return calendarColor ?? DEFAULT_MINI_TIMELINE_EVENT_COLOR;
}

/**
 * Maps a raw Google Calendar event onto the mini-timeline's quarter-hour slot grid for a date.
 *
 * @param event - Raw event from the Calendar API.
 * @param dateKey - Date (YYYY-MM-DD) the mini-timeline is rendering.
 * @param color - The resolved display color for this event (see `resolveMiniTimelineEventColor`).
 * @returns The event positioned in slots, clamped to the day's bounds, or `null` if the event
 *   does not occur on `dateKey` or has no usable time range.
 */
export function mapGoogleEventToMiniTimelineEvent(event: GoogleCalendarEvent, dateKey: string, color: GoogleCalendarColor): MiniTimelineEvent | null {
  const title = event.summary?.trim() || "(No title)";
  const htmlLink = event.htmlLink ?? null;

  if (event.start.date && event.end.date) {
    if (dateKey < event.start.date || dateKey >= event.end.date) {
      return null;
    }

    return { id: event.id, title, startSlot: 0, endSlot: TOTAL_DAY_SLOTS, isAllDay: true, color, htmlLink };
  }

  if (!event.start.dateTime || !event.end.dateTime) {
    return null;
  }

  const dayStart = new Date(`${dateKey}T00:00:00`);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const eventStart = new Date(event.start.dateTime);
  const eventEnd = new Date(event.end.dateTime);

  if (eventEnd <= dayStart || eventStart >= dayEnd) {
    return null;
  }

  const startSlot = clampSlot((eventStart.getTime() - dayStart.getTime()) / MS_PER_SLOT);
  const endSlot = clampSlot((eventEnd.getTime() - dayStart.getTime()) / MS_PER_SLOT);

  if (endSlot <= startSlot) {
    return null;
  }

  return { id: event.id, title, startSlot, endSlot, isAllDay: false, color, htmlLink };
}

/**
 * Orders mini-timeline events for rendering so that shorter events are drawn on top of (after)
 * longer, overlapping events, rather than growing the timeline taller to fit both.
 *
 * @param events - Events to order.
 * @returns A new array ordered longest-duration-first, with earlier-starting events first
 *   among ties.
 */
export function sortMiniTimelineEventsForLayering(events: MiniTimelineEvent[]): MiniTimelineEvent[] {
  return [...events].sort((a, b) => {
    const durationDiff = (b.endSlot - b.startSlot) - (a.endSlot - a.startSlot);

    if (durationDiff !== 0) {
      return durationDiff;
    }

    return a.startSlot - b.startSlot;
  });
}

/**
 * Builds the tooltip text for a mini-timeline event, matching the main timeline's segment
 * tooltip format of title, time range, and duration.
 *
 * @param event - The mini-timeline event to describe.
 * @returns Tooltip text like "Standup • 9:00 AM-9:30 AM • 30m", or "Vacation • All day" for
 *   all-day events.
 */
export function formatMiniTimelineEventTooltip(event: MiniTimelineEvent): string {
  if (event.isAllDay) {
    return `${event.title} • All day`;
  }

  return `${event.title} • ${formatSlotRangeLabelMeridiem(event.startSlot, event.endSlot)} • ${formatSlotDurationLabel(event.startSlot, event.endSlot)}`;
}
