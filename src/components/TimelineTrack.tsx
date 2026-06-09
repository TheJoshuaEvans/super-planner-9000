import { formatHourLabel, formatSlotRangeLabel, hourMarks, quarterHourMarks, TOTAL_DAY_SLOTS } from "../lib/timeline";
import type { PlannerCategory, PlannerSegment } from "../store/plannerStore";

type TimelineTrackProps = {
  categories: PlannerCategory[];
  segments: PlannerSegment[];
};

/**
 * Renders the day timeline grid and any scheduled segments placed on it.
 */
function TimelineTrack({ categories, segments }: TimelineTrackProps) {
  const categoriesById = new Map(categories.map((category) => [category.id, category]));

  return (
    <section className="flex min-h-[26rem] flex-col gap-4 rounded-lg border border-app-border bg-app-surface p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Today</h2>
          <p className="text-sm text-app-muted">0-24 timeline at 15-minute resolution</p>
        </div>
        <div className="text-sm text-app-muted">{TOTAL_DAY_SLOTS} slots total</div>
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="min-w-[72rem] space-y-3">
          <div className="relative grid grid-cols-24 gap-0 text-xs text-app-muted">
            {hourMarks.map((hour) => (
              <div key={hour} className="-translate-x-1/2">
                {formatHourLabel(hour)}
              </div>
            ))}
          </div>

          <div className="relative h-48 rounded-lg border border-app-border bg-app-panel">
            <div className="absolute inset-0 grid grid-cols-96 overflow-hidden rounded-lg">
              {quarterHourMarks.map((slot) => {
                const isHourMark = slot % 4 === 0;

                return (
                  <div key={slot} className={isHourMark ? "border-l border-app-border/90" : "border-l border-app-border/35"} />
                );
              })}
            </div>

            <div className="absolute inset-x-0 top-8 h-24 px-3">
              {segments.length === 0 ? (
                <div className="flex h-full items-center justify-center rounded-md border border-dashed border-app-border bg-app-surface/60 text-sm text-app-muted">
                  Empty timeline. Press a category below to create the first 1-hour block.
                </div>
              ) : (
                <div className="relative h-full">
                  {segments.map((segment) => {
                    const category = categoriesById.get(segment.categoryId);
                    const left = `${(segment.startSlot / TOTAL_DAY_SLOTS) * 100}%`;
                    const width = `${((segment.endSlot - segment.startSlot) / TOTAL_DAY_SLOTS) * 100}%`;

                    return (
                      <div
                        key={segment.id}
                        className="absolute inset-y-0 flex min-w-0 flex-col justify-between overflow-hidden rounded-md border border-black/20 px-3 py-2 text-white shadow-sm"
                        style={{
                          left,
                          width,
                          backgroundColor: category?.color ?? "#475569"
                        }}
                      >
                        <span className="truncate text-sm font-semibold">{category?.label ?? segment.categoryId}</span>
                        <span className="truncate text-xs text-white/85">
                          {formatSlotRangeLabel(segment.startSlot, segment.endSlot)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default TimelineTrack;