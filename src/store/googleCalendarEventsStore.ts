import { create } from "zustand";
import {
  fetchGoogleCalendarEventColorPalette,
  fetchGoogleCalendarEvents,
  fetchPrimaryGoogleCalendarColor,
  type GoogleCalendarColor
} from "../lib/googleCalendarApi";
import { withGoogleCalendarAuth } from "../lib/googleCalendarRequest";
import {
  getDateKeyTimeRange,
  mapGoogleEventToMiniTimelineEvent,
  resolveMiniTimelineEventColor,
  sortMiniTimelineEventsForLayering,
  type MiniTimelineEvent
} from "../lib/miniTimeline";

/** How long a date's fetched events are considered fresh before refetching. */
export const GOOGLE_CALENDAR_EVENTS_CACHE_TTL_MS = 5 * 60 * 1000;

type DateEventsEntry = {
  events: MiniTimelineEvent[];
  isLoading: boolean;
  error: string | null;
  fetchedAt: number | null;
};

type GoogleCalendarEventsState = {
  eventsByDate: Record<string, DateEventsEntry>;
  /** Map of event `colorId` to color, fetched once per session. */
  eventColorPalette: Record<string, GoogleCalendarColor>;
  /** The primary calendar's color, fetched once per session. `null` if Google has none set. */
  primaryCalendarColor: GoogleCalendarColor | null;
  /** Whether the color palette/primary color have been fetched (successfully or not) this session. */
  colorsLoaded: boolean;
  /** Fetches and caches mini-timeline events for a date, skipping if already loading or fresh. */
  fetchEventsForDate: (dateKey: string) => Promise<void>;
};

const EMPTY_ENTRY: DateEventsEntry = { events: [], isLoading: false, error: null, fetchedAt: null };

/**
 * Session-only cache of Google Calendar events mapped onto the mini-timeline slot grid, keyed
 * by date (YYYY-MM-DD). Shared across every mini-timeline instance so the same date isn't
 * re-fetched for each pinned/docked timeline row that displays it. Also caches the event color
 * palette and the primary calendar's color, fetched once per session, used to color events.
 */
export const useGoogleCalendarEventsStore = create<GoogleCalendarEventsState>()((set, get) => ({
  eventsByDate: {},
  eventColorPalette: {},
  primaryCalendarColor: null,
  colorsLoaded: false,
  fetchEventsForDate: (dateKey) => {
    const existing = get().eventsByDate[dateKey] ?? EMPTY_ENTRY;
    const isFresh = existing.fetchedAt !== null && Date.now() - existing.fetchedAt < GOOGLE_CALENDAR_EVENTS_CACHE_TTL_MS;

    if (existing.isLoading || isFresh) {
      return Promise.resolve();
    }

    set((state) => ({
      eventsByDate: { ...state.eventsByDate, [dateKey]: { ...existing, isLoading: true, error: null } }
    }));

    const { timeMinISO, timeMaxISO } = getDateKeyTimeRange(dateKey);

    const colorsPromise = get().colorsLoaded
      ? Promise.resolve()
      : withGoogleCalendarAuth(async (accessToken) => {
          const [eventColorPalette, primaryCalendarColor] = await Promise.all([
            fetchGoogleCalendarEventColorPalette(accessToken),
            fetchPrimaryGoogleCalendarColor(accessToken)
          ]);
          set({ eventColorPalette, primaryCalendarColor, colorsLoaded: true });
        }).catch(() => {
          set({ colorsLoaded: true });
        });

    return Promise.all([colorsPromise, withGoogleCalendarAuth((accessToken) => fetchGoogleCalendarEvents(accessToken, timeMinISO, timeMaxISO))])
      .then(([, rawEvents]) => {
        const { eventColorPalette, primaryCalendarColor } = get();
        const events = sortMiniTimelineEventsForLayering(
          rawEvents
            .map((event) =>
              mapGoogleEventToMiniTimelineEvent(event, dateKey, resolveMiniTimelineEventColor(event.colorId, eventColorPalette, primaryCalendarColor))
            )
            .filter((event): event is MiniTimelineEvent => event !== null)
        );

        set((state) => ({
          eventsByDate: { ...state.eventsByDate, [dateKey]: { events, isLoading: false, error: null, fetchedAt: Date.now() } }
        }));
      })
      .catch((caughtError: unknown) => {
        set((state) => ({
          eventsByDate: {
            ...state.eventsByDate,
            [dateKey]: {
              ...existing,
              isLoading: false,
              error: caughtError instanceof Error ? caughtError.message : "Failed to load calendar events."
            }
          }
        }));
      });
  }
}));
