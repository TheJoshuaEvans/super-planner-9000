import { GoogleCalendarApiError } from "./googleCalendarApi";
import { useSettingsStore } from "../store/settingsStore";

/**
 * Runs a Google Calendar API request using the current access token. If the request fails
 * with a 401 — e.g. because the token expired while the tab was asleep — marks the
 * connection as needing reconnection (without clearing `googleCalendarConnected`), so the
 * global "Reconnect Google Calendar" control appears, then rethrows the original error.
 *
 * @param request - Performs the API call given a valid access token.
 * @returns The result of `request`.
 * @throws If not signed in, or if the request fails.
 */
export async function withGoogleCalendarAuth<T>(request: (accessToken: string) => Promise<T>): Promise<T> {
  const accessToken = useSettingsStore.getState().googleCalendarAccessToken;

  if (!accessToken) {
    throw new Error("Not signed in to Google Calendar.");
  }

  try {
    return await request(accessToken);
  } catch (caughtError) {
    if (caughtError instanceof GoogleCalendarApiError && caughtError.status === 401) {
      const { setGoogleCalendarStatus, setGoogleCalendarAccessToken, setGoogleCalendarTokenExpiresAt } =
        useSettingsStore.getState();
      setGoogleCalendarStatus("signed-out");
      setGoogleCalendarAccessToken(null);
      setGoogleCalendarTokenExpiresAt(null);
    }

    throw caughtError;
  }
}
