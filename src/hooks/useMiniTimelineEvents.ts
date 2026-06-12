import { useEffect } from "react";
import type { MiniTimelineEvent } from "../lib/miniTimeline";
import { useGoogleCalendarEventsStore } from "../store/googleCalendarEventsStore";
import { useSettingsStore } from "../store/settingsStore";

export type UseMiniTimelineEventsResult = {
  events: MiniTimelineEvent[];
  isLoading: boolean;
};

/**
 * Returns Google Calendar events positioned on the mini-timeline slot grid for a date,
 * triggering a fetch (via the shared cache) whenever Google Calendar is signed in.
 *
 * @param dateKey - Date (YYYY-MM-DD) to load events for.
 */
export function useMiniTimelineEvents(dateKey: string): UseMiniTimelineEventsResult {
  const status = useSettingsStore((state) => state.googleCalendarStatus);
  const entry = useGoogleCalendarEventsStore((state) => state.eventsByDate[dateKey]);
  const fetchEventsForDate = useGoogleCalendarEventsStore((state) => state.fetchEventsForDate);

  useEffect(() => {
    if (status === "signed-in") {
      void fetchEventsForDate(dateKey);
    }
  }, [status, dateKey, fetchEventsForDate]);

  if (status !== "signed-in") {
    return { events: [], isLoading: false };
  }

  return { events: entry?.events ?? [], isLoading: entry?.isLoading ?? true };
}
