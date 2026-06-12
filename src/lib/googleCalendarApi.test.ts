import { afterEach, describe, expect, it, vi } from "vitest";
import {
  fetchGoogleCalendarEventColorPalette,
  fetchGoogleCalendarEvents,
  fetchGoogleCalendarList,
  fetchPrimaryGoogleCalendarColor,
  GOOGLE_CALENDAR_COLORS_ENDPOINT,
  GOOGLE_CALENDAR_EVENTS_ENDPOINT,
  GOOGLE_CALENDAR_LIST_ENDPOINT,
  GOOGLE_CALENDAR_PRIMARY_ENDPOINT,
  GoogleCalendarApiError
} from "./googleCalendarApi";

describe("fetchGoogleCalendarList", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sends the access token as a bearer header and returns the parsed JSON body", async () => {
    const responseBody = { items: [{ summary: "Primary" }] };
    const json = vi.fn().mockResolvedValue(responseBody);
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, json });
    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchGoogleCalendarList("test-token");

    expect(fetchMock).toHaveBeenCalledWith(GOOGLE_CALENDAR_LIST_ENDPOINT, {
      headers: { Authorization: "Bearer test-token" }
    });
    expect(result).toEqual(responseBody);
  });

  it("throws a GoogleCalendarApiError with the status code when the response is not ok", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 401, json: vi.fn() });
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchGoogleCalendarList("bad-token")).rejects.toThrow(GoogleCalendarApiError);
    await expect(fetchGoogleCalendarList("bad-token")).rejects.toMatchObject({ status: 401 });
  });
});

describe("fetchGoogleCalendarEvents", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("requests events for the given range and returns the items array", async () => {
    const items = [{ id: "evt-1", summary: "Standup", start: { dateTime: "2026-06-11T09:00:00-04:00" }, end: { dateTime: "2026-06-11T09:30:00-04:00" } }];
    const json = vi.fn().mockResolvedValue({ items });
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, json });
    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchGoogleCalendarEvents("test-token", "2026-06-11T00:00:00.000Z", "2026-06-12T00:00:00.000Z");

    const requestedUrl = new URL(fetchMock.mock.calls[0][0] as string);
    expect(requestedUrl.origin + requestedUrl.pathname).toBe(GOOGLE_CALENDAR_EVENTS_ENDPOINT);
    expect(requestedUrl.searchParams.get("timeMin")).toBe("2026-06-11T00:00:00.000Z");
    expect(requestedUrl.searchParams.get("timeMax")).toBe("2026-06-12T00:00:00.000Z");
    expect(requestedUrl.searchParams.get("singleEvents")).toBe("true");
    expect(requestedUrl.searchParams.get("orderBy")).toBe("startTime");
    expect(fetchMock.mock.calls[0][1]).toEqual({ headers: { Authorization: "Bearer test-token" } });
    expect(result).toEqual(items);
  });

  it("returns an empty array when the response has no items", async () => {
    const json = vi.fn().mockResolvedValue({});
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, json });
    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchGoogleCalendarEvents("test-token", "2026-06-11T00:00:00.000Z", "2026-06-12T00:00:00.000Z");

    expect(result).toEqual([]);
  });

  it("throws a GoogleCalendarApiError with the status code when the response is not ok", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 401, json: vi.fn() });
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchGoogleCalendarEvents("bad-token", "2026-06-11T00:00:00.000Z", "2026-06-12T00:00:00.000Z")).rejects.toThrow(
      GoogleCalendarApiError
    );
  });
});

describe("fetchPrimaryGoogleCalendarColor", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns the primary calendar's background/foreground color", async () => {
    const json = vi.fn().mockResolvedValue({ backgroundColor: "#7986cb", foregroundColor: "#1d1d1d", colorId: "8" });
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, json });
    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchPrimaryGoogleCalendarColor("test-token");

    expect(fetchMock).toHaveBeenCalledWith(GOOGLE_CALENDAR_PRIMARY_ENDPOINT, {
      headers: { Authorization: "Bearer test-token" }
    });
    expect(result).toEqual({ background: "#7986cb", foreground: "#1d1d1d" });
  });

  it("returns null when no color is set", async () => {
    const json = vi.fn().mockResolvedValue({});
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, json });
    vi.stubGlobal("fetch", fetchMock);

    expect(await fetchPrimaryGoogleCalendarColor("test-token")).toBeNull();
  });

  it("throws a GoogleCalendarApiError with the status code when the response is not ok", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 401, json: vi.fn() });
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchPrimaryGoogleCalendarColor("bad-token")).rejects.toThrow(GoogleCalendarApiError);
  });
});

describe("fetchGoogleCalendarEventColorPalette", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns the event color palette", async () => {
    const eventColors = { "1": { background: "#a4bdfc", foreground: "#1d1d1d" } };
    const json = vi.fn().mockResolvedValue({ event: eventColors, calendar: {} });
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, json });
    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchGoogleCalendarEventColorPalette("test-token");

    expect(fetchMock).toHaveBeenCalledWith(GOOGLE_CALENDAR_COLORS_ENDPOINT, {
      headers: { Authorization: "Bearer test-token" }
    });
    expect(result).toEqual(eventColors);
  });

  it("returns an empty object when no event colors are present", async () => {
    const json = vi.fn().mockResolvedValue({});
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, json });
    vi.stubGlobal("fetch", fetchMock);

    expect(await fetchGoogleCalendarEventColorPalette("test-token")).toEqual({});
  });

  it("throws a GoogleCalendarApiError with the status code when the response is not ok", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 401, json: vi.fn() });
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchGoogleCalendarEventColorPalette("bad-token")).rejects.toThrow(GoogleCalendarApiError);
  });
});
