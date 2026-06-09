import { useEffect, useMemo, useState } from "react";
import {
  formatClockTimeLabel,
  formatHourLabel,
  formatSlotDurationLabel,
  formatSlotRangeLabelMeridiem,
  hourMarks,
  quarterHourMarks,
  TOTAL_DAY_SLOTS
} from "../lib/timeline";
import type { PlannerCategory, PlannerSegment } from "../store/plannerStore";
import Tooltip from "./Tooltip";

type MealTimelineTrackProps = {
  weekdayLabel: string;
  relativeLabel?: string;
  subtitle?: string;
  categories: PlannerCategory[];
  segments: PlannerSegment[];
  showCurrentTimeMarker?: boolean;
  onEatSegmentClick?: (segment: PlannerSegment) => void;
};

function resolveCurrentTimePercent(currentTime: Date): number {
  const dayFraction = currentTime.getHours() + currentTime.getMinutes() / 60 + currentTime.getSeconds() / 3600;
  return Math.max(0, Math.min(100, (dayFraction / 24) * 100));
}

/**
 * Read-only meal-focused timeline that emphasizes Eat segments.
 */
function MealTimelineTrack({
  weekdayLabel,
  relativeLabel,
  subtitle,
  categories,
  segments,
  showCurrentTimeMarker = false,
  onEatSegmentClick
}: MealTimelineTrackProps) {
  const [currentTime, setCurrentTime] = useState<Date>(() => new Date());

  useEffect(() => {
    if (!showCurrentTimeMarker) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setCurrentTime(new Date());
    }, 30_000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [showCurrentTimeMarker]);

  const categoriesById = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories]
  );
  const currentTimePercent = useMemo(
    () => resolveCurrentTimePercent(currentTime),
    [currentTime]
  );
  const currentTimeLabel = useMemo(
    () => formatClockTimeLabel(currentTime),
    [currentTime]
  );

  return (
    <section className="flex flex-col gap-4 rounded-lg border border-app-border bg-app-surface p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="flex flex-wrap items-center gap-x-2 gap-y-1 text-lg font-semibold">
            <span className="rounded-full border border-app-accent/50 bg-app-accent/15 px-2 py-0.5 text-xs font-semibold uppercase tracking-[0.16em] text-app-accent">
              {weekdayLabel}
            </span>
            {relativeLabel ? (
              <span className="text-sm font-medium tracking-wide text-app-muted/90">{relativeLabel}</span>
            ) : null}
          </h2>
          <p className="text-sm text-app-muted">{subtitle ?? "Meal-focused read-only view"}</p>
        </div>

        <div className="rounded-md border border-app-border bg-app-panel/85 px-2.5 py-1.5 text-xs font-semibold uppercase tracking-wide text-app-muted">
          Read only
        </div>
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="min-w-[72rem] space-y-2">
          <div className="h-4 px-3 text-[11px] leading-none text-app-muted">
            <div className="relative h-full">
              {hourMarks.map((hour) => {
                const isFirst = hour === 0;
                const isLast = hour === TOTAL_DAY_SLOTS / 4;
                const left = `${(hour / (TOTAL_DAY_SLOTS / 4)) * 100}%`;

                return (
                  <span
                    key={hour}
                    className={`absolute top-0 ${isFirst ? "left-0 translate-x-0" : isLast ? "-translate-x-full" : "-translate-x-1/2"}`}
                    style={{ left: isLast ? "100%" : left }}
                  >
                    {formatHourLabel(hour)}
                  </span>
                );
              })}
            </div>
          </div>

          <div className="px-3">
            <div
              className="h-2 rounded-full border-[0.5px] border-app-border/65"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(to right, rgba(154,176,197,0.25) 0, rgba(154,176,197,0.25) 1.5px, transparent 1.5px, transparent calc(100% / 96)), repeating-linear-gradient(to right, rgba(237,246,255,0.55) 0, rgba(237,246,255,0.55) 2px, transparent 2px, transparent calc(100% / 24)), linear-gradient(to right, rgba(20,184,166,0.12), rgba(59,130,246,0.12))"
              }}
            />
          </div>

          <div className="relative h-[6.5rem] rounded-lg border border-app-border bg-app-panel">
            <div className="absolute inset-x-0 inset-y-3 grid grid-cols-96 overflow-hidden rounded-lg">
              {quarterHourMarks.map((slot) => {
                const isHourMark = slot % 4 === 0;

                return (
                  <div key={slot} className={isHourMark ? "border-l border-app-border/90" : "border-l border-app-border/35"} />
                );
              })}
            </div>

            <div className="absolute inset-x-0 inset-y-3 px-3">
              <div className="relative h-full">
                {showCurrentTimeMarker ? (
                  <div
                    className="pointer-events-none absolute inset-y-0 z-30"
                    style={{ left: `${currentTimePercent}%`, transform: "translateX(-50%)" }}
                  >
                    <div aria-hidden="true" className="h-full w-[2px] bg-app-accent/45 shadow-[0_0_0_1px_rgba(255,255,255,0.22)]" />
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <Tooltip content={currentTimeLabel}>
                        <span className="block h-2.5 w-2.5 rounded-full border border-white/50 bg-app-accent/80 shadow-[0_0_0_2px_rgba(13,18,31,0.35)]" />
                      </Tooltip>
                    </div>
                  </div>
                ) : null}

                {segments.length === 0 ? (
                  <div className="flex h-full items-center justify-center rounded-md border border-dashed border-app-border bg-app-surface/40 text-sm text-app-muted">
                    No meal blocks scheduled for this day.
                  </div>
                ) : null}

                {segments.map((segment) => {
                  const category = categoriesById.get(segment.categoryId);
                  const isEatSegment = segment.categoryId === "eat";
                  const left = `${(segment.startSlot / TOTAL_DAY_SLOTS) * 100}%`;
                  const width = `${((segment.endSlot - segment.startSlot) / TOTAL_DAY_SLOTS) * 100}%`;
                  const segmentLabel = category?.label ?? segment.categoryId;
                  const segmentTimeRangeLabel = formatSlotRangeLabelMeridiem(segment.startSlot, segment.endSlot);
                  const segmentDurationLabel = formatSlotDurationLabel(segment.startSlot, segment.endSlot);

                  return (
                    <Tooltip
                      key={segment.id}
                      content={`${segmentLabel} • ${segmentTimeRangeLabel} • ${segmentDurationLabel}`}
                      triggerClassName="!absolute inset-y-0 flex min-w-0 overflow-visible rounded-md"
                      triggerStyle={{
                        left,
                        width,
                        zIndex: isEatSegment ? 2 : 1
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          if (isEatSegment) {
                            onEatSegmentClick?.(segment);
                          }
                        }}
                        className={`flex h-full w-full flex-col justify-start gap-0.5 overflow-hidden rounded-md border px-3 py-2 text-left shadow-sm transition ${
                          isEatSegment
                            ? "border-amber-200/90 bg-amber-300 text-slate-950 hover:bg-amber-200"
                            : "cursor-default border-black/25 bg-slate-900/80 text-white/60"
                        }`}
                        disabled={!isEatSegment}
                      >
                        <span className="truncate text-sm font-semibold">{segmentLabel}</span>
                        <span className={`truncate text-xs ${isEatSegment ? "text-slate-900/80" : "text-white/50"}`}>
                          {segmentTimeRangeLabel}
                        </span>
                        <span className={`truncate text-[11px] ${isEatSegment ? "text-slate-900/70" : "text-white/40"}`}>
                          {segmentDurationLabel}
                        </span>
                      </button>
                    </Tooltip>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default MealTimelineTrack;
