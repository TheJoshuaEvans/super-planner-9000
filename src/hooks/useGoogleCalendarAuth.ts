import { useCallback, useState } from "react";
import { revokeGoogleAccessToken } from "../lib/googleAuthClient";
import { requestGoogleAccessTokenWithTimeout } from "../lib/googleAuthRequest";
import { fetchGoogleCalendarList } from "../lib/googleCalendarApi";
import { withGoogleCalendarAuth } from "../lib/googleCalendarRequest";
import { useSettingsStore, type GoogleCalendarConnectionStatus } from "../store/settingsStore";
import { useToastStore } from "../store/toastStore";

export type UseGoogleCalendarAuthResult = {
  status: GoogleCalendarConnectionStatus;
  error: string | null;
  isTestingConnection: boolean;
  signIn: () => void;
  signOut: () => void;
  testConnection: () => void;
};

/**
 * Manages a Google Identity Services sign-in for read-only Calendar access, and exposes a
 * hello-world connection test that logs the signed-in user's calendar list to the console.
 *
 * Connection status, the access token, its expiry, and any error are stored in the global
 * `settingsStore` so other parts of the app (e.g. timeline views) can read them, and so the
 * global "Reconnect Google Account" control can prompt for `signIn` again once the token
 * expires.
 *
 * @returns The current auth status/error plus sign-in, sign-out, and test-connection actions.
 */
export function useGoogleCalendarAuth(): UseGoogleCalendarAuthResult {
  const status = useSettingsStore((state) => state.googleCalendarStatus);
  const error = useSettingsStore((state) => state.googleCalendarError);
  const setStatus = useSettingsStore((state) => state.setGoogleCalendarStatus);
  const setAccessToken = useSettingsStore((state) => state.setGoogleCalendarAccessToken);
  const setTokenExpiresAt = useSettingsStore((state) => state.setGoogleCalendarTokenExpiresAt);
  const setError = useSettingsStore((state) => state.setGoogleCalendarError);
  const disconnectGoogleCalendar = useSettingsStore((state) => state.disconnectGoogleCalendar);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const showToast = useToastStore((state) => state.showToast);

  const signIn = useCallback(() => {
    setStatus("connecting");
    setError(null);

    requestGoogleAccessTokenWithTimeout().then((response) => {
      if (response.error) {
        setStatus("error");
        setError(response.error_description ?? response.error ?? "Google sign-in failed.");
        return;
      }

      setAccessToken(response.access_token);
      setTokenExpiresAt(Date.now() + response.expires_in * 1000);
      setStatus("signed-in");
      showToast({
        title: "Connected to Google",
        message: "Signed in with access to Google Calendar (read-only) and Google Drive app data.",
        level: "success"
      });
    });
  }, [setStatus, setError, setAccessToken, setTokenExpiresAt, showToast]);

  const signOut = useCallback(() => {
    const token = useSettingsStore.getState().googleCalendarAccessToken;

    if (token) {
      revokeGoogleAccessToken(token);
    }

    disconnectGoogleCalendar();
  }, [disconnectGoogleCalendar]);

  const testConnection = useCallback(() => {
    const token = useSettingsStore.getState().googleCalendarAccessToken;

    if (!token) {
      return;
    }

    setIsTestingConnection(true);

    withGoogleCalendarAuth((accessToken) => fetchGoogleCalendarList(accessToken))
      .then((calendarList) => {
        console.log("Google Calendar hello-world response:", calendarList);
        showToast({
          title: "Google Calendar test succeeded",
          message: "Your calendar list was logged to the browser console.",
          level: "success"
        });
      })
      .catch((caughtError: unknown) => {
        console.error("Google Calendar hello-world request failed:", caughtError);
        showToast({
          title: "Google Calendar test failed",
          message: caughtError instanceof Error ? caughtError.message : "Unknown error.",
          level: "error"
        });
      })
      .finally(() => {
        setIsTestingConnection(false);
      });
  }, [showToast]);

  return { status, error, isTestingConnection, signIn, signOut, testConnection };
}
