import { useMemo } from "react";
import { buildCalendarMonthView, parseCalendarDateKey, shiftMonth } from "../../lib/calendar";
import { buildWorkDayPreviewBands, CALENDAR_PREVIEW_WORKDAY_MARKER_PERCENT } from "../../lib/workTrackerCalendarPreview";
import type { WorkEntriesByDate, WorkProject } from "../../store/workTrackerStore";

type WorkTrackerCalendarProps = {
  visibleMonth: Date;
  onVisibleMonthChange: (nextMonth: Date) => void;
  selectedDateKey: string | null;
  onSelectDate: (dateKey: string) => void;
  entriesByDate: WorkEntriesByDate;
  projects: WorkProject[];
  /** Today's date key (YYYY-MM-DD), used to keep the "today" highlight in sync across midnight. */
  todayDateKey?: string;
};

/**
 * Controlled monthly calendar for the Work Tracker: the visible month and selected date are
 * owned by the parent so the chart above can stay in sync with calendar navigation. Each day
 * cell shows a small proportional bar of hours logged that day, broken down by project color.
 */
function WorkTrackerCalendar({
  visibleMonth,
  onVisibleMonthChange,
  selectedDateKey,
  onSelectDate,
  entriesByDate,
  projects,
  todayDateKey
}: WorkTrackerCalendarProps) {
  const monthView = useMemo(
    () => buildCalendarMonthView(visibleMonth, todayDateKey ? (parseCalendarDateKey(todayDateKey) ?? undefined) : undefined),
    [visibleMonth, todayDateKey]
  );

  return (
    <section className="rounded-lg border border-app-border bg-app-surface p-4">
      <header className="mb-3 flex items-center justify-between gap-3 rounded-md border border-app-border bg-app-panel px-3 py-2">
        <h3 className="text-base font-semibold tracking-tight sm:text-lg">{monthView.monthLabel}</h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-md border border-app-border bg-app-surface px-2.5 py-1.5 text-xs font-semibold uppercase tracking-wide text-app-muted transition hover:border-app-accent/70 hover:text-app-text"
            onClick={() => onVisibleMonthChange(shiftMonth(visibleMonth, -1))}
            aria-label="Show previous month"
          >
            Prev
          </button>
          <button
            type="button"
            className="rounded-md border border-app-border bg-app-surface px-2.5 py-1.5 text-xs font-semibold uppercase tracking-wide text-app-muted transition hover:border-app-accent/70 hover:text-app-text"
            onClick={() => onVisibleMonthChange(shiftMonth(visibleMonth, 1))}
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
                className="border-r border-app-border px-2 py-2 text-xs text-app-muted last:border-r-0"
              >
                <span className="font-semibold uppercase tracking-wide">{label}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 border-b border-l border-r border-app-border bg-app-surfaceStrong">
            {monthView.weeks.flat().map((cell) => {
              const dayEntries = cell.isCurrentMonth ? entriesByDate[cell.isoDate] ?? [] : [];
              const previewBands = buildWorkDayPreviewBands(dayEntries, projects);

              return (
                <div
                  key={cell.isoDate}
                  className={`relative h-20 border-r border-t border-app-border px-2 py-2 text-left align-top transition last:border-r-0 ${
                    cell.isCurrentMonth
                      ? "bg-app-surface text-app-text"
                      : "cursor-default bg-app-panel/70 text-app-muted/45"
                  } ${cell.isToday ? "ring-2 ring-inset ring-app-accent" : ""} ${
                    cell.isCurrentMonth && selectedDateKey === cell.isoDate ? "ring-2 ring-inset ring-app-accent" : ""
                  }`}
                >
                  {cell.isCurrentMonth ? (
                    <button
                      type="button"
                      className="absolute inset-0 z-0 cursor-pointer transition hover:bg-app-panel"
                      onClick={() => onSelectDate(cell.isoDate)}
                      aria-label={`${cell.isoDate}, ${dayEntries.length > 0 ? "hours logged" : "no hours logged"}`}
                    />
                  ) : null}

                  <span className="relative z-10 text-sm font-semibold">{cell.dayNumber}</span>

                  {previewBands.length > 0 ? (
                    <span className="absolute inset-x-2 bottom-2 z-10 h-4 overflow-hidden rounded-sm border border-app-border bg-app-panel/45">
                      {previewBands.map((band) => (
                        <span
                          key={band.projectId}
                          className="absolute inset-y-0"
                          style={{
                            left: `${band.leftPercent}%`,
                            width: `${band.widthPercent}%`,
                            backgroundColor: band.color
                          }}
                        />
                      ))}
                      <span
                        className="absolute inset-y-0 w-px bg-app-text opacity-70"
                        style={{ left: `${CALENDAR_PREVIEW_WORKDAY_MARKER_PERCENT}%` }}
                        aria-hidden="true"
                      />
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

export default WorkTrackerCalendar;
