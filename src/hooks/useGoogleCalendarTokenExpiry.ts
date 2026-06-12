import { useEffect } from "react";
import { computeTokenExpiryCheckDelayMs, TOKEN_EXPIRY_BUFFER_MS } from "../lib/googleTokenExpiry";
import { useSettingsStore } from "../store/settingsStore";

/**
 * Marks the Google Calendar connection as needing reconnection once the access token expires
 * (or is about to). Google's token client always opens a popup — even for "silent" refresh
 * attempts — so background tabs/timers can't refresh the token automatically; instead, this
 * hook flips the status back to "signed-out" (keeping `googleCalendarConnected` true) so the
 * global "Reconnect Google Account" control appears and a single click restores access.
 *
 * A scheduled timeout handles the common case where the tab stays active. A
 * `visibilitychange` listener catches tokens that expired while the tab was suspended by a
 * tab-sleeping browser/extension (e.g. Wavebox), since suspended timers don't fire.
 */
export function useGoogleCalendarTokenExpiry(): void {
  const status = useSettingsStore((state) => state.googleCalendarStatus);
  const tokenExpiresAt = useSettingsStore((state) => state.googleCalendarTokenExpiresAt);

  useEffect(() => {
    if (status !== "signed-in" || tokenExpiresAt === null) {
      return;
    }

    const timeoutId = window.setTimeout(markTokenExpired, computeTokenExpiryCheckDelayMs(tokenExpiresAt, Date.now()));
    return () => window.clearTimeout(timeoutId);
  }, [status, tokenExpiresAt]);

  useEffect(() => {
    function handleVisibilityChange(): void {
      if (document.visibilityState !== "visible") {
        return;
      }

      const state = useSettingsStore.getState();

      if (state.googleCalendarStatus !== "signed-in" || state.googleCalendarTokenExpiresAt === null) {
        return;
      }

      if (Date.now() >= state.googleCalendarTokenExpiresAt - TOKEN_EXPIRY_BUFFER_MS) {
        markTokenExpired();
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);
}

/**
 * Flips the Google Calendar connection to "needs reconnection" without clearing the
 * `googleCalendarConnected` flag, so the user can restore it with a single click.
 */
function markTokenExpired(): void {
  const { setGoogleCalendarStatus, setGoogleCalendarAccessToken, setGoogleCalendarTokenExpiresAt } =
    useSettingsStore.getState();

  setGoogleCalendarStatus("signed-out");
  setGoogleCalendarAccessToken(null);
  setGoogleCalendarTokenExpiresAt(null);
}
