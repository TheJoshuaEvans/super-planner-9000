import { useMemo } from "react";
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

type DashboardTimelineTrackProps = {
  weekdayLabel: string;
  relativeLabel?: string;
  subtitle?: string;
  categories: PlannerCategory[];
  segments: PlannerSegment[];
  meals: Meal[];
  showCurrentTimeMarker?: boolean;
};

/**
 * Read-only dashboard timeline combining the Day Planner's full category detail
 * with the Meal Planner's assigned-meal callouts for a single day.
 */
function DashboardTimelineTrack({
  weekdayLabel,
  relativeLabel,
  subtitle,
  categories,
  segments,
  meals,
  showCurrentTimeMarker = false
}: DashboardTimelineTrackProps) {
  const currentTime = useTimelineMarkerClock({ enabled: showCurrentTimeMarker });

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
          <p className="text-sm text-app-muted">{subtitle ?? "0-24 timeline at 15-minute resolution"}</p>
        </div>

        <div className="rounded-md border border-app-border bg-app-panel/85 px-2.5 py-1.5 text-xs font-semibold uppercase tracking-wide text-app-muted">
          Read only
        </div>
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="min-w-[72rem] space-y-2">
          <TimelineHourRuler />

          <div className="relative h-[6.5rem] rounded-lg border border-app-border bg-app-panel">
            <TimelineQuarterHourGrid />

            <div className="absolute inset-x-0 inset-y-3 px-3">
              <div className="relative h-full">
                {showCurrentTimeMarker ? (
                  <div
                    className="pointer-events-none absolute inset-y-0 z-30"
                    style={{ left: `${currentTimePercent}%`, transform: "translateX(-50%)" }}
                  >
                    <div aria-hidden="true" className="h-full w-[2px] bg-app-accent/55 shadow-[0_0_0_1px_rgba(255,255,255,0.28)]" />
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <Tooltip content={currentTimeLabel}>
                        <span className="block h-2.5 w-2.5 rounded-full border border-white/60 bg-app-accent/90 shadow-[0_0_0_2px_rgba(13,18,31,0.45)]" />
                      </Tooltip>
                    </div>
                  </div>
                ) : null}

                {segments.length === 0 ? (
                  <div className="flex h-full items-center justify-center rounded-md border border-dashed border-app-border bg-app-surface/60 text-sm text-app-muted">
                    Nothing scheduled for this day.
                  </div>
                ) : (
                  segments.map((segment) => {
                    const category = categoriesById.get(segment.categoryId);
                    const left = `${(segment.startSlot / TOTAL_DAY_SLOTS) * 100}%`;
                    const width = `${((segment.endSlot - segment.startSlot) / TOTAL_DAY_SLOTS) * 100}%`;
                    const segmentLabel = category?.label ?? segment.categoryId;
                    const segmentTimeRangeLabel = formatSlotRangeLabelMeridiem(segment.startSlot, segment.endSlot);
                    const segmentDurationLabel = formatSlotDurationLabel(segment.startSlot, segment.endSlot);
                    const assignedMeals =
                      segment.categoryId === "eat" ? resolveAssignedMeals(meals, segment.assignedMealIds) : [];
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
                        triggerClassName="!absolute inset-y-0 flex min-w-0 select-none flex-col justify-between overflow-visible rounded-md border border-black/20 text-white shadow-sm"
                        triggerStyle={{
                          left,
                          width,
                          backgroundColor: category?.color ?? "#475569",
                          zIndex: 1
                        }}
                      >
                        <div className="flex h-full w-full flex-col justify-start gap-0.5 overflow-hidden px-3 py-2">
                          <span className="truncate text-sm font-semibold">{segmentLabel}</span>
                          <span className="truncate text-xs text-white/85">{segmentTimeRangeLabel}</span>
                          <span className="truncate text-[11px] text-white/70">{segmentDurationLabel}</span>
                        </div>

                        {assignedMeals.length > 0 ? (
                          <span
                            aria-hidden="true"
                            className="pointer-events-none absolute right-1 top-1 z-20 flex h-4 w-4 items-center justify-center rounded-full bg-slate-950/70 text-emerald-300"
                          >
                            <svg viewBox="0 0 24 24" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
                              <path d="M7 2v20" />
                              <path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
                            </svg>
                          </span>
                        ) : null}
                      </Tooltip>
                    );
                  })
                )}
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

export default DashboardTimelineTrack;
