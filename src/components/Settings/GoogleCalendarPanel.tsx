import { useGoogleCalendarAuth } from "../../hooks/useGoogleCalendarAuth";
import { useSettingsStore } from "../../store/settingsStore";

const SECONDARY_BUTTON_CLASSES =
  "rounded-md border border-app-border bg-app-panel/85 px-2.5 py-1.5 text-xs font-semibold uppercase tracking-wide text-app-muted transition hover:border-app-accent/70 hover:text-app-text disabled:cursor-not-allowed disabled:opacity-40";

const PRIMARY_BUTTON_CLASSES =
  "rounded-md bg-app-accent px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-app-accentStrong disabled:cursor-not-allowed disabled:opacity-40";

/**
 * Settings panel for connecting Google Calendar via Google Identity Services, with a
 * hello-world button that fetches the signed-in user's calendar list and logs it to console.
 */
function GoogleCalendarPanel() {
  const { status, error, isTestingConnection, signIn, signOut, testConnection } = useGoogleCalendarAuth();
  const googleCalendarConnected = useSettingsStore((state) => state.googleCalendarConnected);
  const isSignedIn = status === "signed-in";
  const isConnecting = status === "connecting";

  return (
    <section className="space-y-3 rounded-lg border border-app-border bg-app-surface/70 p-4">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-app-muted">Google Account</h3>
        <p className="text-sm text-app-text">
          Connect your Google account to give read-only access to Google Calendar, plus limited access to a private
          Google Drive folder for cloud backups.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {isSignedIn ? (
          <>
            <span className="rounded-md border border-emerald-400/50 bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-100">
              Connected
            </span>
            <button type="button" onClick={testConnection} disabled={isTestingConnection} className={PRIMARY_BUTTON_CLASSES}>
              {isTestingConnection ? "Testing…" : "Test Connection"}
            </button>
            <button type="button" onClick={signOut} className={SECONDARY_BUTTON_CLASSES}>
              Disconnect
            </button>
          </>
        ) : (
          <button type="button" onClick={signIn} disabled={isConnecting} className={PRIMARY_BUTTON_CLASSES}>
            {isConnecting ? "Connecting…" : googleCalendarConnected ? "Reconnect to Google" : "Sign in with Google"}
          </button>
        )}
      </div>

      {status === "error" && error ? <p className="text-xs text-red-300">{error}</p> : null}
    </section>
  );
}

export default GoogleCalendarPanel;
