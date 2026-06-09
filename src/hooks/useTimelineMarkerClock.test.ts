import { describe, expect, it, vi } from "vitest";
import { startTimelineMarkerInterval } from "./useTimelineMarkerClock";

describe("startTimelineMarkerInterval", () => {
  it("does not schedule an interval when disabled", () => {
    const setIntervalFn = vi.fn();
    const clearIntervalFn = vi.fn();

    const cleanup = startTimelineMarkerInterval({
      enabled: false,
      onTick: vi.fn(),
      setIntervalFn,
      clearIntervalFn
    });

    expect(cleanup).toBeUndefined();
    expect(setIntervalFn).not.toHaveBeenCalled();
    expect(clearIntervalFn).not.toHaveBeenCalled();
  });

  it("schedules interval ticks and forwards Date values", () => {
    let capturedHandler: (() => void) | undefined;
    let setIntervalCallCount = 0;
    const intervalHandle = 123 as unknown as ReturnType<typeof setInterval>;
    const setIntervalFn = (handler: () => void, timeout: number): ReturnType<typeof setInterval> => {
      setIntervalCallCount += 1;
      expect(timeout).toBe(45_000);
      capturedHandler = handler;
      return intervalHandle;
    };
    const onTick = vi.fn();
    const nowValue = new Date(2026, 5, 9, 8, 15, 0);

    startTimelineMarkerInterval({
      enabled: true,
      onTick,
      intervalMs: 45_000,
      nowFactory: () => nowValue,
      setIntervalFn,
      clearIntervalFn: vi.fn()
    });

    expect(setIntervalCallCount).toBe(1);

    expect(capturedHandler).toBeDefined();
    if (!capturedHandler) {
      throw new Error("Expected interval handler to be captured");
    }

    capturedHandler();

    expect(onTick).toHaveBeenCalledTimes(1);
    expect(onTick).toHaveBeenCalledWith(nowValue);
  });

  it("cleans up the scheduled interval", () => {
    const intervalHandle = 987 as unknown as ReturnType<typeof setInterval>;
    const clearIntervalFn = vi.fn();

    const cleanup = startTimelineMarkerInterval({
      enabled: true,
      onTick: vi.fn(),
      setIntervalFn: () => intervalHandle,
      clearIntervalFn
    });

    cleanup?.();

    expect(clearIntervalFn).toHaveBeenCalledTimes(1);
    expect(clearIntervalFn).toHaveBeenCalledWith(intervalHandle);
  });
});
