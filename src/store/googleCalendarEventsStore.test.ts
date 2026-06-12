import { beforeEach, describe, expect, it, vi } from "vitest";
import { useSettingsStore } from "./settingsStore";
import * as googleCalendarApi from "../lib/googleCalendarApi";
import { GOOGLE_CALENDAR_EVENTS_CACHE_TTL_MS, useGoogleCalendarEventsStore } from "./googleCalendarEventsStore";

const initialSettingsState = useSettingsStore.getState();
const initialEventsState = useGoogleCalendarEventsStore.getState();

describe("googleCalendarEventsStore", () => {
  beforeEach(() => {
    useSettingsStore.setState(initialSettingsState, true);
    useGoogleCalendarEventsStore.setState(initialEventsState, true);
    useSettingsStore.getState().setGoogleCalendarAccessToken("test-token");
    vi.restoreAllMocks();
    vi.spyOn(googleCalendarApi, "fetchGoogleCalendarEventColorPalette").mockResolvedValue({});
    vi.spyOn(googleCalendarApi, "fetchPrimaryGoogleCalendarColor").mockResolvedValue(null);
  });

  it("fetches, maps, and layer-sorts events for a date", async () => {
    vi.spyOn(googleCalendarApi, "fetchGoogleCalendarEvents").mockResolvedValue([
      { id: "short", summary: "Short", start: { dateTime: "2026-06-11T09:00:00" }, end: { dateTime: "2026-06-11T09:30:00" } },
      { id: "long", summary: "Long", start: { dateTime: "2026-06-11T08:00:00" }, end: { dateTime: "2026-06-11T12:00:00" } }
    ]);

    await useGoogleCalendarEventsStore.getState().fetchEventsForDate("2026-06-11");

    const entry = useGoogleCalendarEventsStore.getState().eventsByDate["2026-06-11"];
    expect(entry.isLoading).toBe(false);
    expect(entry.error).toBeNull();
    expect(entry.events.map((event) => event.id)).toEqual(["long", "short"]);
  });

  it("does not refetch while a fetch for the date is already loading", async () => {
    let resolveFetch: (value: googleCalendarApi.GoogleCalendarEvent[]) => void = () => {};
    const fetchMock = vi.spyOn(googleCalendarApi, "fetchGoogleCalendarEvents").mockReturnValue(
      new Promise((resolve) => {
        resolveFetch = resolve;
      })
    );

    const firstCall = useGoogleCalendarEventsStore.getState().fetchEventsForDate("2026-06-11");
    await useGoogleCalendarEventsStore.getState().fetchEventsForDate("2026-06-11");

    expect(fetchMock).toHaveBeenCalledTimes(1);

    resolveFetch([]);
    await firstCall;
  });

  it("does not refetch fresh cached data", async () => {
    const fetchMock = vi.spyOn(googleCalendarApi, "fetchGoogleCalendarEvents").mockResolvedValue([]);

    await useGoogleCalendarEventsStore.getState().fetchEventsForDate("2026-06-11");
    await useGoogleCalendarEventsStore.getState().fetchEventsForDate("2026-06-11");

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("refetches once cached data goes stale", async () => {
    const fetchMock = vi.spyOn(googleCalendarApi, "fetchGoogleCalendarEvents").mockResolvedValue([]);

    await useGoogleCalendarEventsStore.getState().fetchEventsForDate("2026-06-11");

    const staleEntry = useGoogleCalendarEventsStore.getState().eventsByDate["2026-06-11"];
    useGoogleCalendarEventsStore.setState({
      eventsByDate: {
        "2026-06-11": { ...staleEntry, fetchedAt: Date.now() - (GOOGLE_CALENDAR_EVENTS_CACHE_TTL_MS + 1) }
      }
    });

    await useGoogleCalendarEventsStore.getState().fetchEventsForDate("2026-06-11");

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("records an error and clears the loading flag when the request fails", async () => {
    vi.spyOn(googleCalendarApi, "fetchGoogleCalendarEvents").mockRejectedValue(new Error("boom"));

    await useGoogleCalendarEventsStore.getState().fetchEventsForDate("2026-06-11");

    const entry = useGoogleCalendarEventsStore.getState().eventsByDate["2026-06-11"];
    expect(entry.isLoading).toBe(false);
    expect(entry.error).toBe("boom");
    expect(entry.events).toEqual([]);
  });

  describe("colors", () => {
    it("colors events using the event color palette, falling back to the primary calendar color", async () => {
      vi.spyOn(googleCalendarApi, "fetchGoogleCalendarEventColorPalette").mockResolvedValue({
        "5": { background: "#ffd966", foreground: "#1d1d1d" }
      });
      vi.spyOn(googleCalendarApi, "fetchPrimaryGoogleCalendarColor").mockResolvedValue({ background: "#33b679", foreground: "#ffffff" });
      vi.spyOn(googleCalendarApi, "fetchGoogleCalendarEvents").mockResolvedValue([
        { id: "colored", summary: "Colored", colorId: "5", start: { dateTime: "2026-06-11T09:00:00" }, end: { dateTime: "2026-06-11T09:30:00" } },
        { id: "default", summary: "Default", start: { dateTime: "2026-06-11T10:00:00" }, end: { dateTime: "2026-06-11T10:30:00" } }
      ]);

      await useGoogleCalendarEventsStore.getState().fetchEventsForDate("2026-06-11");

      const events = useGoogleCalendarEventsStore.getState().eventsByDate["2026-06-11"].events;
      expect(events.find((event) => event.id === "colored")?.color).toEqual({ background: "#ffd966", foreground: "#1d1d1d" });
      expect(events.find((event) => event.id === "default")?.color).toEqual({ background: "#33b679", foreground: "#ffffff" });
    });

    it("fetches the color palette and primary color only once across multiple dates", async () => {
      const paletteMock = vi.spyOn(googleCalendarApi, "fetchGoogleCalendarEventColorPalette").mockResolvedValue({});
      const primaryColorMock = vi.spyOn(googleCalendarApi, "fetchPrimaryGoogleCalendarColor").mockResolvedValue(null);
      vi.spyOn(googleCalendarApi, "fetchGoogleCalendarEvents").mockResolvedValue([]);

      await useGoogleCalendarEventsStore.getState().fetchEventsForDate("2026-06-11");
      await useGoogleCalendarEventsStore.getState().fetchEventsForDate("2026-06-12");

      expect(paletteMock).toHaveBeenCalledTimes(1);
      expect(primaryColorMock).toHaveBeenCalledTimes(1);
    });

    it("marks colors as loaded even if fetching them fails, without failing the events fetch", async () => {
      vi.spyOn(googleCalendarApi, "fetchGoogleCalendarEventColorPalette").mockRejectedValue(new Error("colors down"));
      vi.spyOn(googleCalendarApi, "fetchPrimaryGoogleCalendarColor").mockResolvedValue(null);
      vi.spyOn(googleCalendarApi, "fetchGoogleCalendarEvents").mockResolvedValue([]);

      await useGoogleCalendarEventsStore.getState().fetchEventsForDate("2026-06-11");

      expect(useGoogleCalendarEventsStore.getState().colorsLoaded).toBe(true);
      expect(useGoogleCalendarEventsStore.getState().eventsByDate["2026-06-11"].error).toBeNull();
    });
  });
});
