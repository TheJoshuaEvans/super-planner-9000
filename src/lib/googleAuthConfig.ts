/**
 * Configuration for the Google Identity Services / Calendar integration.
 *
 * The OAuth client ID below is intentionally public: the browser-based Google Identity
 * Services token flow used here has no client secret, and access is restricted by the
 * "Authorized JavaScript origins" configured for this client in the Google Cloud Console.
 */

/** OAuth 2.0 client ID for the Super Planner 9000 Google Identity Services integration. */
export const GOOGLE_OAUTH_CLIENT_ID = "869932734546-vcspvcj5imfmkjoqadns90puvdk0r9kq.apps.googleusercontent.com";

/** OAuth scope requested for read-only access to the signed-in user's Google Calendar data. */
export const GOOGLE_CALENDAR_READONLY_SCOPE = "https://www.googleapis.com/auth/calendar.readonly";

/**
 * OAuth scope requested for access to a hidden, app-only "app data folder" in the signed-in
 * user's Google Drive, used to store a manual cloud backup of planner data. Invisible in the
 * user's normal Drive UI and only accessible to this app.
 */
export const GOOGLE_DRIVE_APPDATA_SCOPE = "https://www.googleapis.com/auth/drive.appdata";

/** Combined OAuth scopes requested by the single shared Google Identity Services token client. */
export const GOOGLE_OAUTH_SCOPES = `${GOOGLE_CALENDAR_READONLY_SCOPE} ${GOOGLE_DRIVE_APPDATA_SCOPE}`;

/** URL of the Google Identity Services client library script. */
export const GOOGLE_IDENTITY_SERVICES_SCRIPT_URL = "https://accounts.google.com/gsi/client";
