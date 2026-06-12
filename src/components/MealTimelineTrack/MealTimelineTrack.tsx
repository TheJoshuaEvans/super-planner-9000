import { useMemo, useRef } from "react";
import { resolveAssignedMeals } from "../../lib/mealAssignment";
import {
  formatClockTimeLabel,
  formatSlotDurationLabel,
  formatSlotRangeLabelMeridiem,
  TOTAL_DAY_SLOTS
} from "../../lib/timeline";
import { resolveCurrentTimePercent } from "../../lib/timelineNow";
import { useTimelineMarkerClock } from "../../hooks/useTimelineMarkerClock";
import type { Meal } from "../../store/mealStore";
import type { PlannerCategory, PlannerSegment } from "../../store/plannerStore";
import TimelineHourRuler from "../shared/TimelineHourRuler";
import TimelineQuarterHourGrid from "../shared/TimelineQuarterHourGrid";
import Tooltip from "../Tooltip/Tooltip";

type MealTimelineTrackProps = {
  title: string;
  titleSuffix?: string;
  subtitle?: string;
  categories: PlannerCategory[];
  segments: PlannerSegment[];
  meals: Meal[];
  showCurrentTimeMarker?: boolean;
  onEatSegmentClick?: (segment: PlannerSegment) => void;
};

/**
 * Read-only meal-focused timeline that emphasizes Eat segments.
 */
function MealTimelineTrack({
  title,
  titleSuffix,
  subtitle,
  categories,
  segments,
  meals,
  showCurrentTimeMarker = false,
  onEatSegmentClick
}: MealTimelineTrackProps) {
  const currentTime = useTimelineMarkerClock({ enabled: showCurrentTimeMarker });
  const trackRef = useRef<HTMLDivElement | null>(null);

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

  const eatSegmentsWithMeals = useMemo(
    () =>
      segments
        .filter((segment) => segment.categoryId === "eat")
        .map((segment) => ({ segment, assignedMeals: resolveAssignedMeals(meals, segment.assignedMealIds) }))
        .filter((entry) => entry.assignedMeals.length > 0)
        .sort((a, b) => a.segment.startSlot - b.segment.startSlot),
    [segments, meals]
  );

  const hasUnassignedEatSegment = useMemo(
    () =>
      segments.some(
        (segment) => segment.categoryId === "eat" && resolveAssignedMeals(meals, segment.assignedMealIds).length === 0
      ),
    [segments, meals]
  );

  return (
    <section className="flex flex-col gap-4 rounded-lg border border-app-border bg-app-surface p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="flex flex-wrap items-center gap-x-2 gap-y-1 text-lg font-semibold">
            <span>{title}</span>
            {titleSuffix ? (
              <span
                className={`rounded-full border px-2 py-0.5 text-xs font-semibold uppercase tracking-[0.16em] ${
                  hasUnassignedEatSegment
                    ? "border-amber-300/50 bg-amber-300/15 text-amber-200"
                    : "border-app-accent/50 bg-app-accent/15 text-app-accent"
                }`}
              >
                {titleSuffix}
              </span>
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
          <TimelineHourRuler accentOpacity={0.12} />

          <div className="relative h-[6.5rem] rounded-lg border border-app-border bg-app-panel">
            <TimelineQuarterHourGrid />

            <div className="absolute inset-x-0 inset-y-3 px-3">
              <div ref={trackRef} className="relative h-full">
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
                  const assignedMeals = isEatSegment ? resolveAssignedMeals(meals, segment.assignedMealIds) : [];
                  const hasAssignedMeals = assignedMeals.length > 0;
                  const tooltipContent =
                    assignedMeals.length > 0
                      ? `${segmentLabel} • ${segmentTimeRangeLabel} • ${segmentDurationLabel} • Meals: ${assignedMeals
                          .map((meal) => meal.name)
                          .join(", ")}`
                      : `${segmentLabel} • ${segmentTimeRangeLabel} • ${segmentDurationLabel}`;

                  return (
                    <Tooltip
                      key={segment.id}
                      content={tooltipContent}
                      triggerClassName="!absolute inset-y-0 flex min-w-0 overflow-visible rounded-md"
                      triggerStyle={{
                        left,
                        width,
                        zIndex: isEatSegment ? 2 : 1
                      }}
                      boundaryRef={trackRef}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          if (isEatSegment) {
                            onEatSegmentClick?.(segment);
                          }
                        }}
                        className={`relative flex h-full w-full flex-col justify-start gap-0.5 overflow-hidden rounded-md border px-3 py-2 text-left shadow-sm transition ${
                          isEatSegment
                            ? hasAssignedMeals
                              ? "border-emerald-200/90 bg-emerald-300 text-slate-950 hover:bg-emerald-200"
                              : "border-amber-200/90 bg-amber-300 text-slate-950 hover:bg-amber-200"
                            : "cursor-default border-black/25 bg-slate-900/80 text-white/60"
                        }`}
                        disabled={!isEatSegment}
                      >
                        {hasAssignedMeals ? (
                          <span
                            aria-hidden="true"
                            className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-slate-950/80 px-1 text-[10px] font-bold leading-none text-emerald-200"
                          >
                            {assignedMeals.length}
                          </span>
                        ) : null}
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

      {eatSegmentsWithMeals.length > 0 ? (
        <div className="space-y-2 border-t border-app-border pt-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-app-muted">Assigned Meals</p>
          <ul className="space-y-2">
            {eatSegmentsWithMeals.map(({ segment, assignedMeals }) => (
              <li
                key={segment.id}
                className="flex flex-wrap items-center gap-2 rounded-md border border-app-border bg-app-panel/60 px-3 py-2"
              >
                <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-app-muted">
                  {formatSlotRangeLabelMeridiem(segment.startSlot, segment.endSlot)}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {assignedMeals.map((meal) => (
                    <span
                      key={meal.id}
                      className="rounded-full border border-emerald-300/40 bg-emerald-300/15 px-2 py-0.5 text-xs font-medium text-emerald-200"
                    >
                      {meal.name}
                    </span>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

export default MealTimelineTrack;
