import { useEffect, useState } from "react";

const DEFAULT_MARKER_INTERVAL_MS = 30_000;

const defaultNowFactory = (): Date => new Date();

type IntervalHandle = ReturnType<typeof setInterval>;

type TimelineMarkerIntervalOptions = {
  enabled: boolean;
  onTick: (currentTime: Date) => void;
  intervalMs?: number;
  nowFactory?: () => Date;
  setIntervalFn?: (handler: () => void, timeout: number) => IntervalHandle;
  clearIntervalFn?: (handle: IntervalHandle) => void;
};

/**
 * Starts or skips the timeline marker clock interval based on enabled state.
 *
 * @param options.enabled - Whether periodic marker updates should run.
 * @param options.onTick - Callback invoked on each interval with the latest Date.
 * @param options.intervalMs - Interval cadence in milliseconds. Defaults to 30 seconds.
 * @param options.nowFactory - Date factory used for tick values. Defaults to new Date.
 * @param options.setIntervalFn - Injectable interval scheduler for tests.
 * @param options.clearIntervalFn - Injectable interval cleanup function for tests.
 * @returns Cleanup function when enabled, otherwise undefined.
 */
export function startTimelineMarkerInterval({
  enabled,
  onTick,
  intervalMs = DEFAULT_MARKER_INTERVAL_MS,
  nowFactory = defaultNowFactory,
  setIntervalFn = globalThis.setInterval,
  clearIntervalFn = globalThis.clearInterval
}: TimelineMarkerIntervalOptions): (() => void) | undefined {
  if (!enabled) {
    return undefined;
  }

  const intervalHandle = setIntervalFn(() => {
    onTick(nowFactory());
  }, intervalMs);

  return () => {
    clearIntervalFn(intervalHandle);
  };
}

type UseTimelineMarkerClockOptions = {
  enabled: boolean;
  intervalMs?: number;
  nowFactory?: () => Date;
};

/**
 * Returns current wall-clock time for timeline marker rendering and updates it on an interval.
 *
 * @param options.enabled - Whether the marker clock should auto-refresh.
 * @param options.intervalMs - Interval cadence in milliseconds. Defaults to 30 seconds.
 * @param options.nowFactory - Date factory override used for initialization and ticks.
 * @returns Current Date value for marker position and labels.
 */
export function useTimelineMarkerClock({
  enabled,
  intervalMs = DEFAULT_MARKER_INTERVAL_MS,
  nowFactory = defaultNowFactory
}: UseTimelineMarkerClockOptions): Date {
  const [currentTime, setCurrentTime] = useState<Date>(() => nowFactory());

  useEffect(() => {
    return startTimelineMarkerInterval({
      enabled,
      onTick: setCurrentTime,
      intervalMs,
      nowFactory
    });
  }, [enabled, intervalMs, nowFactory]);

  return currentTime;
}
