import { useEffect, useState } from "react";
import { formatCalendarDateIdentity, getMillisecondsUntilNextMidnight } from "../lib/calendar";

/**
 * Returns today's local date key (YYYY-MM-DD), automatically advancing to the next day at
 * midnight (and immediately re-checking when the tab regains visibility, in case a suspended
 * background tab missed the scheduled rollover) so date-relative views — the dashboard's
 * pinned week, the wall calendar's "today" highlight — roll over without a page reload.
 *
 * @returns Today's local date key, kept in sync across the midnight boundary.
 */
export function useTodayDateKey(): string {
  const [todayDateKey, setTodayDateKey] = useState<string>(() => formatCalendarDateIdentity(new Date()));

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    function syncTodayDateKey(): void {
      const nextDateKey = formatCalendarDateIdentity(new Date());
      setTodayDateKey((current) => (current === nextDateKey ? current : nextDateKey));
    }

    function scheduleNextSync(): void {
      timeoutId = setTimeout(() => {
        syncTodayDateKey();
        scheduleNextSync();
      }, getMillisecondsUntilNextMidnight(new Date()));
    }

    function handleVisibilityChange(): void {
      if (document.visibilityState === "visible") {
        syncTodayDateKey();
      }
    }

    scheduleNextSync();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return todayDateKey;
}
