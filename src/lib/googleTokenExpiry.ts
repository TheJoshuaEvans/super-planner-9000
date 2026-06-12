/** How long before a token's actual expiry to mark the connection as needing reconnection. */
export const TOKEN_EXPIRY_BUFFER_MS = 5 * 60 * 1000;

/** Minimum delay before an expiry check, to avoid scheduling near-immediate timers. */
export const MIN_TOKEN_EXPIRY_CHECK_DELAY_MS = 30 * 1000;

/**
 * Computes the delay before the Google Calendar token should be treated as expired (and the
 * connection marked as needing reconnection), a short buffer before its actual expiry.
 *
 * @param expiresAt - Epoch ms timestamp when the current access token expires.
 * @param now - Current epoch ms timestamp.
 * @returns Non-negative delay in milliseconds before the token should be treated as expired.
 */
export function computeTokenExpiryCheckDelayMs(expiresAt: number, now: number): number {
  return Math.max(expiresAt - now - TOKEN_EXPIRY_BUFFER_MS, MIN_TOKEN_EXPIRY_CHECK_DELAY_MS);
}
