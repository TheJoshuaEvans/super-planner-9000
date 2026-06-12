import { describe, expect, it } from "vitest";
import { computeTokenExpiryCheckDelayMs, MIN_TOKEN_EXPIRY_CHECK_DELAY_MS, TOKEN_EXPIRY_BUFFER_MS } from "./googleTokenExpiry";

describe("computeTokenExpiryCheckDelayMs", () => {
  it("schedules a check shortly before expiry when plenty of time remains", () => {
    const now = 0;
    const expiresAt = 60 * 60 * 1000;

    expect(computeTokenExpiryCheckDelayMs(expiresAt, now)).toBe(expiresAt - TOKEN_EXPIRY_BUFFER_MS);
  });

  it("falls back to the minimum delay when the token is close to expiry", () => {
    const now = 0;
    const expiresAt = 60 * 1000;

    expect(computeTokenExpiryCheckDelayMs(expiresAt, now)).toBe(MIN_TOKEN_EXPIRY_CHECK_DELAY_MS);
  });

  it("never returns a negative delay for an already-expired token", () => {
    const now = 10_000;
    const expiresAt = 0;

    expect(computeTokenExpiryCheckDelayMs(expiresAt, now)).toBe(MIN_TOKEN_EXPIRY_CHECK_DELAY_MS);
  });
});
