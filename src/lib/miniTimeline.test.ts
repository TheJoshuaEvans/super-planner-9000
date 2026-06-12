import { describe, expect, it } from "vitest";
import type { GoogleCalendarColor, GoogleCalendarEvent } from "./googleCalendarApi";
import { TOTAL_DAY_SLOTS } from "./timeline";
import {
  DEFAULT_MINI_TIMELINE_EVENT_COLOR,
  formatMiniTimelineEventTooltip,
  getDateKeyTimeRange,
  mapGoogleEventToMiniTimelineEvent,
  resolveMiniTimelineEventColor,
  sortMiniTimelineEventsForLayering
} from "./miniTimeline";

const TEST_COLOR: GoogleCalendarColor = { background: "#7986cb", foreground: "#1d1d1d" };

/** Builds a local Date for a date key + HH:MM time, then renders it as an RFC3339 string. */
function localDateTime(dateKey: string, time: string): string {
  return new Date(`${dateKey}T${time}:00`).toISOString();
}

function timedEvent(id: string, dateKey: string, startTime: string, endTime: string, summary?: string): GoogleCalendarEvent {
  return {
    id,
    summary,
    start: { dateTime: localDateTime(dateKey, startTime) },
    end: { dateTime: localDateTime(dateKey, endTime) }
  };
}

describe("getDateKeyTimeRange", () => {
  it("returns local midnight bounds for the date", () => {
    const { timeMinISO, timeMaxISO } = getDateKeyTimeRange("2026-06-11");

    expect(new Date(timeMinISO)).toEqual(new Date("2026-06-11T00:00:00"));
    expect(new Date(timeMaxISO)).toEqual(new Date("2026-06-12T00:00:00"));
  });
});

describe("mapGoogleEventToMiniTimelineEvent", () => {
  it("maps a timed event to slots within the day", () => {
    const event = timedEvent("evt-1", "2026-06-11", "09:00", "10:30", "Standup");

    expect(mapGoogleEventToMiniTimelineEvent(event, "2026-06-11", TEST_COLOR)).toEqual({
      id: "evt-1",
      title: "Standup",
      startSlot: 36,
      endSlot: 42,
      isAllDay: false,
      color: TEST_COLOR,
      htmlLink: null
    });
  });

  it("passes through the event's htmlLink when present", () => {
    const event = { ...timedEvent("evt-1", "2026-06-11", "09:00", "10:30", "Standup"), htmlLink: "https://calendar.google.com/event?eid=evt-1" };

    expect(mapGoogleEventToMiniTimelineEvent(event, "2026-06-11", TEST_COLOR)?.htmlLink).toBe("https://calendar.google.com/event?eid=evt-1");
  });

  it("falls back to a placeholder title when summary is missing", () => {
    const event = timedEvent("evt-1", "2026-06-11", "09:00", "10:00");

    expect(mapGoogleEventToMiniTimelineEvent(event, "2026-06-11", TEST_COLOR)?.title).toBe("(No title)");
  });

  it("clamps an event that starts the previous day to the start of this day", () => {
    const event: GoogleCalendarEvent = {
      id: "evt-2",
      summary: "Overnight",
      start: { dateTime: localDateTime("2026-06-10", "22:00") },
      end: { dateTime: localDateTime("2026-06-11", "02:00") }
    };

    expect(mapGoogleEventToMiniTimelineEvent(event, "2026-06-11", TEST_COLOR)).toEqual({
      id: "evt-2",
      title: "Overnight",
      startSlot: 0,
      endSlot: 8,
      isAllDay: false,
      color: TEST_COLOR,
      htmlLink: null
    });
  });

  it("clamps an event that ends the next day to the end of this day", () => {
    const event: GoogleCalendarEvent = {
      id: "evt-3",
      summary: "Late night",
      start: { dateTime: localDateTime("2026-06-11", "23:00") },
      end: { dateTime: localDateTime("2026-06-12", "01:00") }
    };

    expect(mapGoogleEventToMiniTimelineEvent(event, "2026-06-11", TEST_COLOR)).toEqual({
      id: "evt-3",
      title: "Late night",
      startSlot: 92,
      endSlot: TOTAL_DAY_SLOTS,
      isAllDay: false,
      color: TEST_COLOR,
      htmlLink: null
    });
  });

  it("returns null for a timed event that does not occur on this date", () => {
    const event = timedEvent("evt-4", "2026-06-10", "09:00", "10:00");

    expect(mapGoogleEventToMiniTimelineEvent(event, "2026-06-11", TEST_COLOR)).toBeNull();
  });

  it("maps an all-day event covering this date to a full-width slot range", () => {
    const event: GoogleCalendarEvent = {
      id: "evt-5",
      summary: "Vacation",
      start: { date: "2026-06-11" },
      end: { date: "2026-06-12" }
    };

    expect(mapGoogleEventToMiniTimelineEvent(event, "2026-06-11", TEST_COLOR)).toEqual({
      id: "evt-5",
      title: "Vacation",
      startSlot: 0,
      endSlot: TOTAL_DAY_SLOTS,
      isAllDay: true,
      color: TEST_COLOR,
      htmlLink: null
    });
  });

  it("maps a multi-day all-day event to every date it spans", () => {
    const event: GoogleCalendarEvent = {
      id: "evt-6",
      summary: "Conference",
      start: { date: "2026-06-10" },
      end: { date: "2026-06-13" }
    };

    expect(mapGoogleEventToMiniTimelineEvent(event, "2026-06-12", TEST_COLOR)?.isAllDay).toBe(true);
    expect(mapGoogleEventToMiniTimelineEvent(event, "2026-06-13", TEST_COLOR)).toBeNull();
  });
});

describe("resolveMiniTimelineEventColor", () => {
  const palette: Record<string, GoogleCalendarColor> = {
    "1": { background: "#a4bdfc", foreground: "#1d1d1d" }
  };
  const calendarColor: GoogleCalendarColor = { background: "#33b679", foreground: "#ffffff" };

  it("uses the palette color for the event's colorId when present", () => {
    expect(resolveMiniTimelineEventColor("1", palette, calendarColor)).toEqual(palette["1"]);
  });

  it("falls back to the calendar color when colorId is unset", () => {
    expect(resolveMiniTimelineEventColor(undefined, palette, calendarColor)).toEqual(calendarColor);
  });

  it("falls back to the calendar color when colorId is not in the palette", () => {
    expect(resolveMiniTimelineEventColor("99", palette, calendarColor)).toEqual(calendarColor);
  });

  it("falls back to the default color when neither colorId nor calendar color is available", () => {
    expect(resolveMiniTimelineEventColor(undefined, {}, null)).toEqual(DEFAULT_MINI_TIMELINE_EVENT_COLOR);
  });
});

describe("sortMiniTimelineEventsForLayering", () => {
  it("orders longer events first so shorter events render on top", () => {
    const long = { id: "long", title: "Long", startSlot: 0, endSlot: 40, isAllDay: false, color: TEST_COLOR, htmlLink: null };
    const short = { id: "short", title: "Short", startSlot: 10, endSlot: 14, isAllDay: false, color: TEST_COLOR, htmlLink: null };

    expect(sortMiniTimelineEventsForLayering([short, long])).toEqual([long, short]);
  });

  it("breaks duration ties by start slot", () => {
    const later = { id: "later", title: "Later", startSlot: 20, endSlot: 24, isAllDay: false, color: TEST_COLOR, htmlLink: null };
    const earlier = { id: "earlier", title: "Earlier", startSlot: 4, endSlot: 8, isAllDay: false, color: TEST_COLOR, htmlLink: null };

    expect(sortMiniTimelineEventsForLayering([later, earlier])).toEqual([earlier, later]);
  });

  it("does not mutate the input array", () => {
    const events = [
      { id: "a", title: "A", startSlot: 0, endSlot: 4, isAllDay: false, color: TEST_COLOR, htmlLink: null },
      { id: "b", title: "B", startSlot: 4, endSlot: 8, isAllDay: false, color: TEST_COLOR, htmlLink: null }
    ];
    const original = [...events];

    sortMiniTimelineEventsForLayering(events);

    expect(events).toEqual(original);
  });
});

describe("formatMiniTimelineEventTooltip", () => {
  it("includes the title, time range, and duration for a timed event", () => {
    const event = { id: "evt-1", title: "Standup", startSlot: 36, endSlot: 38, isAllDay: false, color: TEST_COLOR, htmlLink: null };

    expect(formatMiniTimelineEventTooltip(event)).toBe("Standup • 9:00 AM-9:30 AM • 30m");
  });

  it("shows 'All day' instead of a time range/duration for all-day events", () => {
    const event = { id: "evt-2", title: "Vacation", startSlot: 0, endSlot: TOTAL_DAY_SLOTS, isAllDay: true, color: TEST_COLOR, htmlLink: null };

    expect(formatMiniTimelineEventTooltip(event)).toBe("Vacation • All day");
  });
});
