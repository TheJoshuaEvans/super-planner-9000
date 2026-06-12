import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/** Connection status for the Google Identity Services Calendar integration. */
export type GoogleCalendarConnectionStatus = "signed-out" | "connecting" | "signed-in" | "error";

type SettingsState = {
  /** Whether the user has successfully connected Google Calendar at least once. */
  googleCalendarConnected: boolean;
  /** Current Google Calendar connection status for this session. Not persisted. */
  googleCalendarStatus: GoogleCalendarConnectionStatus;
  /** In-memory Google Calendar OAuth access token. Not persisted (short-lived). */
  googleCalendarAccessToken: string | null;
  /** Epoch ms timestamp when the current access token expires. Not persisted. */
  googleCalendarTokenExpiresAt: number | null;
  /** Latest Google Calendar connection error message, if any. Not persisted. */
  googleCalendarError: string | null;
  /** ISO timestamp of the last successful "Upload to Drive" backup, if any. */
  googleDriveLastUploadedAt: string | null;
  /** ISO timestamp of the last successful "Download from Drive" restore, if any. */
  googleDriveLastDownloadedAt: string | null;
  /** Whether changes to planner/meal data should be automatically backed up to Drive. Off by default. */
  googleDriveAutoUploadEnabled: boolean;
  /** Seconds after which toasts auto-dismiss, or `null` to keep them until manually closed (default). */
  toastAutoDismissSeconds: number | null;

  /** Updates the Google Calendar connection status, recording a successful connection. */
  setGoogleCalendarStatus: (status: GoogleCalendarConnectionStatus) => void;
  /** Stores the current Google Calendar OAuth access token. */
  setGoogleCalendarAccessToken: (accessToken: string | null) => void;
  /** Stores the expiry timestamp (epoch ms) of the current access token. */
  setGoogleCalendarTokenExpiresAt: (expiresAt: number | null) => void;
  /** Stores the latest Google Calendar connection error message. */
  setGoogleCalendarError: (error: string | null) => void;
  /** Fully disconnects Google Calendar, including the persisted "previously connected" flag. */
  disconnectGoogleCalendar: () => void;
  /** Records the timestamp of the most recent successful Drive backup upload. */
  setGoogleDriveLastUploadedAt: (timestamp: string | null) => void;
  /** Records the timestamp of the most recent successful Drive backup download. */
  setGoogleDriveLastDownloadedAt: (timestamp: string | null) => void;
  /** Toggles automatic Drive backups on planner/meal data changes. */
  setGoogleDriveAutoUploadEnabled: (enabled: boolean) => void;
  /** Sets the toast auto-dismiss delay in seconds, or `null` to require manual dismissal. */
  setToastAutoDismissSeconds: (seconds: number | null) => void;
};

/**
 * Global, app-wide settings store, readable and writable from any component or hook.
 *
 * Most settings persist to localStorage under `sp9000-settings`. Fields tied to short-lived
 * session state (the Google Calendar access token, its expiry, live status, and error) are
 * excluded from persistence via `partialize` and reset to their defaults on reload.
 */
export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      googleCalendarConnected: false,
      googleCalendarStatus: "signed-out",
      googleCalendarAccessToken: null,
      googleCalendarTokenExpiresAt: null,
      googleCalendarError: null,
      googleDriveLastUploadedAt: null,
      googleDriveLastDownloadedAt: null,
      googleDriveAutoUploadEnabled: false,
      toastAutoDismissSeconds: null,
      setGoogleCalendarStatus: (status) =>
        set((state) => ({
          googleCalendarStatus: status,
          googleCalendarConnected: status === "signed-in" ? true : state.googleCalendarConnected
        })),
      setGoogleCalendarAccessToken: (accessToken) => set({ googleCalendarAccessToken: accessToken }),
      setGoogleCalendarTokenExpiresAt: (expiresAt) => set({ googleCalendarTokenExpiresAt: expiresAt }),
      setGoogleCalendarError: (error) => set({ googleCalendarError: error }),
      disconnectGoogleCalendar: () =>
        set({
          googleCalendarConnected: false,
          googleCalendarStatus: "signed-out",
          googleCalendarAccessToken: null,
          googleCalendarTokenExpiresAt: null,
          googleCalendarError: null
        }),
      setGoogleDriveLastUploadedAt: (timestamp) => set({ googleDriveLastUploadedAt: timestamp }),
      setGoogleDriveLastDownloadedAt: (timestamp) => set({ googleDriveLastDownloadedAt: timestamp }),
      setGoogleDriveAutoUploadEnabled: (enabled) => set({ googleDriveAutoUploadEnabled: enabled }),
      setToastAutoDismissSeconds: (seconds) => set({ toastAutoDismissSeconds: seconds })
    }),
    {
      name: "sp9000-settings",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        googleCalendarConnected: state.googleCalendarConnected,
        googleDriveLastUploadedAt: state.googleDriveLastUploadedAt,
        googleDriveLastDownloadedAt: state.googleDriveLastDownloadedAt,
        googleDriveAutoUploadEnabled: state.googleDriveAutoUploadEnabled,
        toastAutoDismissSeconds: state.toastAutoDismissSeconds
      })
    }
  )
);
