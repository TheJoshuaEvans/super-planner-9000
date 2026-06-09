/**
 * Converts a Date into its fractional position within the local day.
 *
 * @param currentTime - Local wall-clock time.
 * @returns Day progress in the inclusive range [0, 1].
 */
function resolveCurrentDayFraction(currentTime: Date): number {
  const secondsSinceMidnight =
    currentTime.getHours() * 3600 +
    currentTime.getMinutes() * 60 +
    currentTime.getSeconds();

  return Math.max(0, Math.min(1, secondsSinceMidnight / 86_400));
}

/**
 * Maps current wall-clock time to a timeline marker percentage.
 *
 * @param currentTime - Local wall-clock time.
 * @returns Marker percentage in the inclusive range [0, 100].
 */
export function resolveCurrentTimePercent(currentTime: Date): number {
  return resolveCurrentDayFraction(currentTime) * 100;
}
