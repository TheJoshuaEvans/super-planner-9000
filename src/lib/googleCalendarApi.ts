/** Google Calendar API endpoint listing the signed-in user's calendars. */
export const GOOGLE_CALENDAR_LIST_ENDPOINT = "https://www.googleapis.com/calendar/v3/users/me/calendarList";

/** Google Calendar API endpoint listing events on the signed-in user's primary calendar. */
export const GOOGLE_CALENDAR_EVENTS_ENDPOINT = "https://www.googleapis.com/calendar/v3/calendars/primary/events";

/** Google Calendar API endpoint returning the user's primary calendar list entry (incl. its color). */
export const GOOGLE_CALENDAR_PRIMARY_ENDPOINT = "https://www.googleapis.com/calendar/v3/users/me/calendarList/primary";

/** Google Calendar API endpoint returning the fixed event/calendar color palette. */
export const GOOGLE_CALENDAR_COLORS_ENDPOINT = "https://www.googleapis.com/calendar/v3/colors";

/** A start or end boundary of a Google Calendar event, as returned by the Calendar API. */
export type GoogleCalendarEventTime = {
  /** Set for all-day events, as a YYYY-MM-DD date (end dates are exclusive). */
  date?: string;
  /** Set for timed events, as an RFC3339 timestamp. */
  dateTime?: string;
};

/** A single event entry from the Calendar API's `events.list` response. */
export type GoogleCalendarEvent = {
  id: string;
  summary?: string;
  start: GoogleCalendarEventTime;
  end: GoogleCalendarEventTime;
  /** Index into the event color palette (see `fetchGoogleCalendarEventColorPalette`), if set. */
  colorId?: string;
  /** Link to view this event in the Google Calendar web UI. */
  htmlLink?: string;
};

/** A background/foreground color pair for rendering a calendar or event. */
export type GoogleCalendarColor = {
  background: string;
  foreground: string;
};

/** Thrown when a Google Calendar API request returns a non-OK response. */
export class GoogleCalendarApiError extends Error {
  status: number;

  constructor(status: number) {
    super(`Google Calendar API request failed with status ${status}`);
    this.name = "GoogleCalendarApiError";
    this.status = status;
  }
}

/**
 * Fetches the signed-in user's Google Calendar list as a basic connectivity check.
 *
 * @param accessToken - OAuth access token granted with at least the calendar.readonly scope.
 * @returns The parsed JSON response body from the Calendar API.
 * @throws {GoogleCalendarApiError} If the response status is not OK.
 */
export async function fetchGoogleCalendarList(accessToken: string): Promise<unknown> {
  const response = await fetch(GOOGLE_CALENDAR_LIST_ENDPOINT, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    throw new GoogleCalendarApiError(response.status);
  }

  return response.json();
}

/**
 * Fetches events on the signed-in user's primary calendar within a time range.
 *
 * @param accessToken - OAuth access token granted with at least the calendar.readonly scope.
 * @param timeMinISO - Inclusive lower bound (RFC3339 timestamp).
 * @param timeMaxISO - Exclusive upper bound (RFC3339 timestamp).
 * @returns The events overlapping the given range, expanding recurring events into instances.
 * @throws {GoogleCalendarApiError} If the response status is not OK.
 */
export async function fetchGoogleCalendarEvents(
  accessToken: string,
  timeMinISO: string,
  timeMaxISO: string
): Promise<GoogleCalendarEvent[]> {
  const url = new URL(GOOGLE_CALENDAR_EVENTS_ENDPOINT);
  url.searchParams.set("timeMin", timeMinISO);
  url.searchParams.set("timeMax", timeMaxISO);
  url.searchParams.set("singleEvents", "true");
  url.searchParams.set("orderBy", "startTime");

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    throw new GoogleCalendarApiError(response.status);
  }

  const body = (await response.json()) as { items?: GoogleCalendarEvent[] };
  return body.items ?? [];
}

/**
 * Fetches the background/foreground color of the signed-in user's primary calendar.
 *
 * @param accessToken - OAuth access token granted with at least the calendar.readonly scope.
 * @returns The primary calendar's color, or `null` if none is set.
 * @throws {GoogleCalendarApiError} If the response status is not OK.
 */
export async function fetchPrimaryGoogleCalendarColor(accessToken: string): Promise<GoogleCalendarColor | null> {
  const response = await fetch(GOOGLE_CALENDAR_PRIMARY_ENDPOINT, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    throw new GoogleCalendarApiError(response.status);
  }

  const body = (await response.json()) as { backgroundColor?: string; foregroundColor?: string };

  if (!body.backgroundColor || !body.foregroundColor) {
    return null;
  }

  return { background: body.backgroundColor, foreground: body.foregroundColor };
}

/**
 * Fetches the fixed palette mapping event `colorId`s to background/foreground colors.
 *
 * @param accessToken - OAuth access token granted with at least the calendar.readonly scope.
 * @returns A map of `colorId` to its color pair.
 * @throws {GoogleCalendarApiError} If the response status is not OK.
 */
export async function fetchGoogleCalendarEventColorPalette(accessToken: string): Promise<Record<string, GoogleCalendarColor>> {
  const response = await fetch(GOOGLE_CALENDAR_COLORS_ENDPOINT, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    throw new GoogleCalendarApiError(response.status);
  }

  const body = (await response.json()) as { event?: Record<string, GoogleCalendarColor> };
  return body.event ?? {};
}
