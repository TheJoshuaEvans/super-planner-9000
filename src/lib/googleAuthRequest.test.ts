import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./googleAuthClient", () => ({
  requestGoogleAccessToken: vi.fn()
}));

import { requestGoogleAccessToken } from "./googleAuthClient";
import { GOOGLE_AUTH_REQUEST_TIMEOUT_MS, requestGoogleAccessTokenWithTimeout } from "./googleAuthRequest";

describe("requestGoogleAccessTokenWithTimeout", () => {
  beforeEach(() => {
    vi.mocked(requestGoogleAccessToken).mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("resolves with the token response when the callback fires", async () => {
    vi.mocked(requestGoogleAccessToken).mockImplementation(async (onResponse) => {
      onResponse({ access_token: "token-1", expires_in: 3600, scope: "", token_type: "Bearer" });
    });

    const result = await requestGoogleAccessTokenWithTimeout();

    expect(result).toEqual({ access_token: "token-1", expires_in: 3600, scope: "", token_type: "Bearer" });
  });

  it("resolves with a timeout error if no callback ever fires", async () => {
    vi.useFakeTimers();
    vi.mocked(requestGoogleAccessToken).mockResolvedValue(undefined);

    const resultPromise = requestGoogleAccessTokenWithTimeout();
    await vi.advanceTimersByTimeAsync(GOOGLE_AUTH_REQUEST_TIMEOUT_MS);
    const result = await resultPromise;

    expect(result.error).toBe("timeout");
  });

  it("resolves with a script_error if the request promise rejects", async () => {
    vi.mocked(requestGoogleAccessToken).mockRejectedValue(new Error("script failed to load"));

    const result = await requestGoogleAccessTokenWithTimeout();

    expect(result.error).toBe("script_error");
    expect(result.error_description).toBe("script failed to load");
  });
});
