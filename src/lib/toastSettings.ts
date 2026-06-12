/** Minimum number of seconds a user can configure for automatic toast dismissal. */
export const TOAST_AUTO_DISMISS_MIN_SECONDS = 1;

/** Maximum number of seconds a user can configure for automatic toast dismissal. */
export const TOAST_AUTO_DISMISS_MAX_SECONDS = 120;

/** Default delay (seconds) applied when automatic toast dismissal is first enabled. */
export const DEFAULT_TOAST_AUTO_DISMISS_SECONDS = 5;

/**
 * Clamps a user-entered auto-dismiss delay to the supported range, rounding to a whole number
 * of seconds.
 *
 * @param seconds - Raw seconds value from a number input.
 * @returns The value clamped to [TOAST_AUTO_DISMISS_MIN_SECONDS, TOAST_AUTO_DISMISS_MAX_SECONDS].
 */
export function clampToastAutoDismissSeconds(seconds: number): number {
  if (Number.isNaN(seconds)) {
    return TOAST_AUTO_DISMISS_MIN_SECONDS;
  }

  return Math.max(TOAST_AUTO_DISMISS_MIN_SECONDS, Math.min(TOAST_AUTO_DISMISS_MAX_SECONDS, Math.round(seconds)));
}
