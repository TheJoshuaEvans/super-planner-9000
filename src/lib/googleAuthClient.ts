import { GOOGLE_CALENDAR_READONLY_SCOPE, GOOGLE_OAUTH_CLIENT_ID } from "./googleAuthConfig";
import { loadGoogleIdentityScript } from "./googleIdentityScript";

let tokenClient: GoogleOAuth2TokenClient | null = null;
let activeCallback: ((response: GoogleOAuth2TokenResponse) => void) | null = null;

/**
 * Lazily creates the single shared Google OAuth2 token client used for Calendar access.
 * Reused across the app so background refreshes and user-initiated sign-ins share one client.
 */
async function getTokenClient(): Promise<GoogleOAuth2TokenClient> {
  await loadGoogleIdentityScript();

  if (!window.google) {
    throw new Error("Google Identity Services failed to initialize.");
  }

  if (!tokenClient) {
    tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_OAUTH_CLIENT_ID,
      scope: GOOGLE_CALENDAR_READONLY_SCOPE,
      callback: (response) => activeCallback?.(response)
    });
  }

  return tokenClient;
}

/**
 * Requests a Google Calendar access token via the shared token client.
 *
 * @param onResponse - Called once with the token response, or a response with `error` set.
 * @param options - Pass `{ prompt: "" }` to attempt a silent refresh with no visible UI.
 */
export async function requestGoogleAccessToken(
  onResponse: (response: GoogleOAuth2TokenResponse) => void,
  options?: { prompt?: string }
): Promise<void> {
  const client = await getTokenClient();
  activeCallback = onResponse;
  client.requestAccessToken(options);
}

/**
 * Revokes a Google Calendar access token, if Identity Services has been loaded.
 *
 * @param accessToken - The access token to revoke.
 */
export function revokeGoogleAccessToken(accessToken: string): void {
  window.google?.accounts.oauth2.revoke(accessToken, () => {});
}
