import { useGoogleCalendarAuth } from "../../hooks/useGoogleCalendarAuth";
import { useSettingsStore } from "../../store/settingsStore";

/**
 * Tab-row button shown whenever Google Calendar was previously connected but the access
 * token has lapsed (expired, or rejected by a request) and needs to be refreshed. Clicking
 * it re-requests a token via a direct user gesture, which Google's popup-based sign-in flow
 * requires — automatic background refreshes are blocked by the browser's popup blocker.
 */
function GoogleCalendarReconnectButton() {
  const googleCalendarConnected = useSettingsStore((state) => state.googleCalendarConnected);
  const status = useSettingsStore((state) => state.googleCalendarStatus);
  const { signIn } = useGoogleCalendarAuth();

  if (!googleCalendarConnected || status === "signed-in") {
    return null;
  }

  const isConnecting = status === "connecting";

  return (
    <button
      type="button"
      onClick={signIn}
      disabled={isConnecting}
      className="rounded-md border border-amber-400/60 bg-amber-500/15 px-2.5 py-1.5 text-xs font-semibold uppercase tracking-wide text-amber-100 transition hover:border-amber-300 hover:bg-amber-500/25 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isConnecting ? "Reconnecting…" : "Reconnect Google Account"}
    </button>
  );
}

export default GoogleCalendarReconnectButton;
