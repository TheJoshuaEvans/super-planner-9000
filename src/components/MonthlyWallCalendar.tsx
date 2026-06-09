import { useMemo, useState } from "react";
import { buildCalendarMonthView, getMonthStart, shiftMonth } from "../lib/calendar";

type MonthlyWallCalendarProps = {
  onSelectDate?: (dateKey: string) => void;
  selectedDateKey?: string | null;
};

/**
 * Renders a monthly wall-calendar card and emits selected in-month day keys.
 */
function MonthlyWallCalendar({ onSelectDate, selectedDateKey = null }: MonthlyWallCalendarProps) {
  const [visibleMonth, setVisibleMonth] = useState<Date>(() => getMonthStart(new Date()));

  const monthView = useMemo(
    () => buildCalendarMonthView(visibleMonth),
    [visibleMonth]
  );

  /**
   * Emits selected calendar day identity to the parent view.
   */
  function handleSelectDay(dateKey: string): void {
    onSelectDate?.(dateKey);
  }

  return (
    <section className="rounded-lg border border-app-border bg-app-surface p-4">
      <header className="mb-3 flex items-center justify-between gap-3 rounded-md border border-app-border bg-app-panel px-3 py-2">
        <h3 className="text-base font-semibold tracking-tight sm:text-lg">{monthView.monthLabel}</h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-md border border-app-border bg-app-surface px-2.5 py-1.5 text-xs font-semibold uppercase tracking-wide text-app-muted transition hover:border-app-accent/70 hover:text-app-text"
            onClick={() => setVisibleMonth((current) => shiftMonth(current, -1))}
            aria-label="Show previous month"
          >
            Prev
          </button>
          <button
            type="button"
            className="rounded-md border border-app-border bg-app-surface px-2.5 py-1.5 text-xs font-semibold uppercase tracking-wide text-app-muted transition hover:border-app-accent/70 hover:text-app-text"
            onClick={() => setVisibleMonth((current) => shiftMonth(current, 1))}
            aria-label="Show next month"
          >
            Next
          </button>
        </div>
      </header>

      <div className="overflow-x-auto">
        <div className="min-w-[46rem]">
          <div className="grid grid-cols-7 border border-app-border bg-app-panel">
            {monthView.weekdayLabels.map((label) => (
              <div
                key={label}
                className="border-r border-app-border px-2 py-2 text-center text-xs font-semibold uppercase tracking-wide text-app-muted last:border-r-0"
              >
                {label}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 border-b border-l border-r border-app-border bg-app-surfaceStrong">
            {monthView.weeks.flat().map((cell) => (
              <button
                key={cell.isoDate}
                type="button"
                className={`h-20 border-r border-t border-app-border px-2 py-2 text-left align-top transition last:border-r-0 ${
                  cell.isCurrentMonth
                    ? "cursor-pointer bg-app-surface text-app-text hover:bg-app-panel"
                    : "cursor-default bg-app-panel/70 text-app-muted/45"
                } ${cell.isToday ? "ring-1 ring-inset ring-app-accent/60" : ""} ${
                  cell.isCurrentMonth && selectedDateKey === cell.isoDate ? "ring-2 ring-inset ring-app-accent" : ""
                }`}
                onClick={() => cell.isCurrentMonth && handleSelectDay(cell.isoDate)}
                disabled={!cell.isCurrentMonth}
                aria-label={`Select ${cell.isoDate}`}
              >
                <span className="text-sm font-semibold">{cell.dayNumber}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default MonthlyWallCalendar;
