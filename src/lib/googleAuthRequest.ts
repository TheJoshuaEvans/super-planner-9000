import { requestGoogleAccessToken } from "./googleAuthClient";

/** Max time to wait for a Google token response before treating the request as failed. */
export const GOOGLE_AUTH_REQUEST_TIMEOUT_MS = 15 * 1000;

/**
 * Requests a Google Calendar access token and resolves with the response — or with a
 * synthetic error response if no callback arrives within `GOOGLE_AUTH_REQUEST_TIMEOUT_MS`.
 *
 * Intended for user-gesture sign-in/reconnect clicks, where Google's token client opens a
 * popup that may be blocked or closed without a response; this guarantees the caller doesn't
 * wait forever in either case.
 *
 * @param options - Pass `{ prompt: "" }` to skip the account chooser when possible.
 */
export function requestGoogleAccessTokenWithTimeout(options?: { prompt?: string }): Promise<GoogleOAuth2TokenResponse> {
  return new Promise((resolve) => {
    let settled = false;

    const timeoutId = setTimeout(() => {
      settle({
        access_token: "",
        expires_in: 0,
        scope: "",
        token_type: "Bearer",
        error: "timeout",
        error_description: "Google sign-in timed out. Please try again."
      });
    }, GOOGLE_AUTH_REQUEST_TIMEOUT_MS);

    function settle(response: GoogleOAuth2TokenResponse): void {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timeoutId);
      resolve(response);
    }

    requestGoogleAccessToken(settle, options).catch((caughtError: unknown) => {
      settle({
        access_token: "",
        expires_in: 0,
        scope: "",
        token_type: "Bearer",
        error: "script_error",
        error_description: caughtError instanceof Error ? caughtError.message : "Failed to load Google sign-in."
      });
    });
  });
}
