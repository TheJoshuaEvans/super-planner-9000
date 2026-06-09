import { useMemo, useState } from "react";
import { buildCalendarMonthView, getMonthStart, shiftMonth } from "../lib/calendar";
import { TOTAL_DAY_SLOTS } from "../lib/timeline";
import type { PlannerCategory, PlannerSegmentsByDate } from "../store/plannerStore";

type MonthlyWallCalendarProps = {
  onSelectDate?: (dateKey: string) => void;
  onPasteDate?: (dateKey: string) => void;
  onPasteWeekday?: (dateKeys: string[]) => void;
  selectedDateKey?: string | null;
  canPasteTimeline?: boolean;
  categories?: PlannerCategory[];
  segmentsByDate?: PlannerSegmentsByDate;
};

/**
 * Renders a monthly wall-calendar card and emits selected in-month day keys.
 */
function MonthlyWallCalendar({
  onSelectDate,
  onPasteDate,
  onPasteWeekday,
  selectedDateKey = null,
  canPasteTimeline = false,
  categories = [],
  segmentsByDate = {}
}: MonthlyWallCalendarProps) {
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

  const dateKeysByWeekday = useMemo(
    () => monthView.weekdayLabels.map((_, weekdayIndex) =>
      monthView.weeks
        .map((week) => week[weekdayIndex])
        .filter((cell) => cell.isCurrentMonth)
        .map((cell) => cell.isoDate)
    ),
    [monthView]
  );

  const categoryColorById = useMemo(
    () => new Map(categories.map((category) => [category.id, category.color])),
    [categories]
  );

  function toPreviewFill(color: string): string {
    if (/^#[0-9a-fA-F]{6}$/.test(color)) {
      return `${color}66`;
    }

    return color;
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
            {monthView.weekdayLabels.map((label, weekdayIndex) => (
              <div
                key={label}
                className="border-r border-app-border px-2 py-2 text-xs text-app-muted last:border-r-0"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold uppercase tracking-wide">{label}</span>
                  <button
                    type="button"
                    className="rounded border border-app-border bg-app-surface/80 px-1.5 py-0.5 text-[0.58rem] font-semibold uppercase tracking-wide text-app-muted transition hover:border-app-accent/70 hover:text-app-text disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={() => onPasteWeekday?.(dateKeysByWeekday[weekdayIndex])}
                    disabled={!canPasteTimeline || !onPasteWeekday || dateKeysByWeekday[weekdayIndex].length === 0}
                    aria-label={`Paste timeline into all ${label} dates in this month`}
                  >
                    Paste
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 border-b border-l border-r border-app-border bg-app-surfaceStrong">
            {monthView.weeks.flat().map((cell) => {
              const showPasteButton = cell.isCurrentMonth && onPasteDate !== undefined;
              const previewSegments = cell.isCurrentMonth ? (segmentsByDate[cell.isoDate] ?? []) : [];
              const statusLabel = previewSegments.length > 0
                ? "scheduled timeline data present"
                : "no scheduled timeline data";

              return (
                <div
                  key={cell.isoDate}
                  className={`relative h-20 border-r border-t border-app-border px-2 py-2 text-left align-top transition last:border-r-0 ${
                    cell.isCurrentMonth
                      ? "bg-app-surface text-app-text"
                      : "cursor-default bg-app-panel/70 text-app-muted/45"
                  } ${cell.isToday ? "ring-1 ring-inset ring-app-accent/60" : ""} ${
                    cell.isCurrentMonth && selectedDateKey === cell.isoDate ? "ring-2 ring-inset ring-app-accent" : ""
                  }`}
                >
                  {cell.isCurrentMonth ? (
                    <button
                      type="button"
                      className="absolute inset-0 z-0 cursor-pointer transition hover:bg-app-panel"
                      onClick={() => handleSelectDay(cell.isoDate)}
                      aria-label={`${cell.isoDate}, ${statusLabel}`}
                    />
                  ) : null}

                  {showPasteButton ? (
                    <button
                      type="button"
                      className="absolute right-2 top-2 z-20 rounded border border-app-border bg-app-panel/85 px-1.5 py-0.5 text-[0.62rem] font-semibold uppercase tracking-wide text-app-muted transition hover:border-app-accent/70 hover:text-app-text disabled:cursor-not-allowed disabled:opacity-50"
                      onClick={() => onPasteDate(cell.isoDate)}
                      disabled={!canPasteTimeline}
                      aria-label={`Paste timeline into ${cell.isoDate}`}
                    >
                      Paste
                    </button>
                  ) : null}

                  <span className="relative z-10 text-sm font-semibold">{cell.dayNumber}</span>

                  {previewSegments.length > 0 ? (
                    <span className="absolute inset-x-2 bottom-2 z-10 h-4 overflow-hidden rounded-sm border border-app-border bg-app-panel/45">
                      {previewSegments.map((segment) => {
                        const color = categoryColorById.get(segment.categoryId) ?? "#94a3b8";
                        const startPercent = Math.max(0, Math.min(100, (segment.startSlot / TOTAL_DAY_SLOTS) * 100));
                        const endPercent = Math.max(0, Math.min(100, (segment.endSlot / TOTAL_DAY_SLOTS) * 100));
                        const widthPercent = Math.max(0, endPercent - startPercent);

                        return (
                          <span
                            key={segment.id}
                            className="absolute inset-y-0"
                            style={{
                              left: `${startPercent}%`,
                              width: `${widthPercent}%`,
                              backgroundColor: toPreviewFill(color)
                            }}
                          />
                        );
                      })}
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

export default MonthlyWallCalendar;
