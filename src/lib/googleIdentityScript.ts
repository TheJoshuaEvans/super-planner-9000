import { GOOGLE_IDENTITY_SERVICES_SCRIPT_URL } from "./googleAuthConfig";

let scriptLoadPromise: Promise<void> | null = null;

/**
 * Loads the Google Identity Services script if it has not already been loaded.
 *
 * @returns A promise that resolves once `window.google.accounts.oauth2` is available, or
 * rejects if the script fails to load or no browser environment is present.
 */
export function loadGoogleIdentityScript(): Promise<void> {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return Promise.reject(new Error("Google Identity Services requires a browser environment."));
  }

  if (window.google?.accounts?.oauth2) {
    return Promise.resolve();
  }

  if (!scriptLoadPromise) {
    scriptLoadPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = GOOGLE_IDENTITY_SERVICES_SCRIPT_URL;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => {
        scriptLoadPromise = null;
        reject(new Error("Failed to load the Google Identity Services script."));
      };
      document.head.appendChild(script);
    });
  }

  return scriptLoadPromise;
}
