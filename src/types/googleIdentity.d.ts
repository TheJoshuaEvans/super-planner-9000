export {};

declare global {
  /** Response payload passed to a Google OAuth2 token client's callback. */
  interface GoogleOAuth2TokenResponse {
    access_token: string;
    expires_in: number;
    scope: string;
    token_type: string;
    error?: string;
    error_description?: string;
  }

  /** Configuration accepted by `google.accounts.oauth2.initTokenClient`. */
  interface GoogleOAuth2TokenClientConfig {
    client_id: string;
    scope: string;
    callback: (response: GoogleOAuth2TokenResponse) => void;
  }

  /** Token client returned by `google.accounts.oauth2.initTokenClient`. */
  interface GoogleOAuth2TokenClient {
    requestAccessToken: (overrideConfig?: { prompt?: string }) => void;
  }

  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: GoogleOAuth2TokenClientConfig) => GoogleOAuth2TokenClient;
          revoke: (accessToken: string, callback?: () => void) => void;
        };
      };
    };
  }
}
