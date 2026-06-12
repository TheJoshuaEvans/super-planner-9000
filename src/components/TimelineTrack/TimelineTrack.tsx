import { useMemo, useRef, useState, type PointerEvent, type ReactNode } from "react";
import {
  clientXToSlot,
  DEFAULT_SEGMENT_DURATION_SLOTS,
  formatClockTimeLabel,
  formatSlotDurationLabel,
  formatSlotRangeLabelMeridiem,
  snapSlot,
  TOTAL_DAY_SLOTS
} from "../../lib/timeline";
import { resolveCurrentTimePercent } from "../../lib/timelineNow";
import { useTimelineMarkerClock } from "../../hooks/useTimelineMarkerClock";
import type { PlannerCategory, PlannerSegment } from "../../store/plannerStore";
import {
  isPointerInRect,
  resolveDropPreviewSlot,
  resolveMoveStart,
  resolveResizeRange,
  type InteractionState,
  type MoveInteraction,
  type ResizeInteraction
} from "./timelineTrackInteractions";
import { getTimelineControlButtonClassName } from "../shared/timelineControlButton";
import MiniTimeline from "../shared/MiniTimeline";
import TimelineHourRuler from "../shared/TimelineHourRuler";
import TimelineQuarterHourGrid from "../shared/TimelineQuarterHourGrid";
import Tooltip from "../Tooltip/Tooltip";

type TimelineTrackProps = {
  dateKey: string;
  title: string;
  titleSuffix?: string;
  subtitle?: string;
  categories: PlannerCategory[];
  segments: PlannerSegment[];
  canPasteTimeline: boolean;
  draggingCategoryId: string | null;
  onMoveSegment: (segmentId: string, nextStartSlot: number) => void;
  onResizeSegment: (segmentId: string, nextStartSlot: number, nextEndSlot: number) => void;
  onDropCategory: (categoryId: string, startSlot: number, endSlot: number) => void;
  onCopyTimeline: () => void;
  onPasteTimeline: () => void;
  onClearTimeline: () => void;
  onDeleteSegment: (segmentId: string) => void;
  footer?: ReactNode;
  showCurrentTimeMarker?: boolean;
};

/**
 * Renders the day timeline grid and any scheduled segments placed on it.
 */
function TimelineTrack({
  dateKey,
  title,
  titleSuffix,
  subtitle,
  categories,
  segments,
  canPasteTimeline,
  draggingCategoryId,
  onMoveSegment,
  onResizeSegment,
  onDropCategory,
  onCopyTimeline,
  onPasteTimeline,
  onClearTimeline,
  onDeleteSegment,
  footer,
  showCurrentTimeMarker = false
}: TimelineTrackProps) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const trashRef = useRef<HTMLDivElement | null>(null);
  const [interaction, setInteraction] = useState<InteractionState | null>(null);
  const [dropPreviewSlot, setDropPreviewSlot] = useState<number | null>(null);
  const [isTrashHot, setIsTrashHot] = useState(false);
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

  const visibleSegments = useMemo(() => {
    if (!interaction) {
      return segments;
    }

    return segments.map((segment) => {
      if (segment.id !== interaction.segmentId) {
        return segment;
      }

      if (interaction.mode === "move") {
        return { ...segment, startSlot: interaction.previewStartSlot, endSlot: interaction.previewStartSlot + interaction.duration };
      }

      return { ...segment, startSlot: interaction.previewStartSlot, endSlot: interaction.previewEndSlot };
    });
  }, [interaction, segments]);

  /**
   * Starts a body-move interaction, recording the grab offset inside the block.
   */
  function handleBodyPointerDown(event: PointerEvent<HTMLDivElement>, segment: PlannerSegment): void {
    if (!trackRef.current) return;
    event.stopPropagation();
    const rect = trackRef.current.getBoundingClientRect();
    const grabSlot = snapSlot(clientXToSlot(event.clientX, rect.left, rect.width));
    setInteraction({
      mode: "move",
      segmentId: segment.id,
      duration: segment.endSlot - segment.startSlot,
      grabOffsetSlots: grabSlot - segment.startSlot,
      previewStartSlot: segment.startSlot
    });
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  /**
   * Starts a left-edge resize interaction.
   */
  function handleLeftHandlePointerDown(event: PointerEvent<HTMLDivElement>, segment: PlannerSegment): void {
    event.stopPropagation();
    setInteraction({
      mode: "resize-left",
      segmentId: segment.id,
      fixedStartSlot: segment.startSlot,
      fixedEndSlot: segment.endSlot,
      previewStartSlot: segment.startSlot,
      previewEndSlot: segment.endSlot
    });
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  /**
   * Starts a right-edge resize interaction.
   */
  function handleRightHandlePointerDown(event: PointerEvent<HTMLDivElement>, segment: PlannerSegment): void {
    event.stopPropagation();
    setInteraction({
      mode: "resize-right",
      segmentId: segment.id,
      fixedStartSlot: segment.startSlot,
      fixedEndSlot: segment.endSlot,
      previewStartSlot: segment.startSlot,
      previewEndSlot: segment.endSlot
    });
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  /**
   * Updates the preview position for whichever interaction is currently active.
   * Also tracks drop preview position when a category is being dragged in from the palette.
   */
  function handleTrackPointerMove(event: PointerEvent<HTMLDivElement>): void {
    if (!trackRef.current) return;

    if (draggingCategoryId) {
      const trackRect = trackRef.current.getBoundingClientRect();
      setDropPreviewSlot(resolveDropPreviewSlot(event.clientX, trackRect.left, trackRect.width));
      return;
    }

    if (!interaction) return;

    if (interaction.mode === "move") {
      const trackRect = trackRef.current.getBoundingClientRect();
      const nextStart = resolveMoveStart(event.clientX, interaction, trackRect.left, trackRect.width);
      const trashRect = trashRef.current?.getBoundingClientRect();
      setIsTrashHot(trashRect ? isPointerInRect(event.clientX, event.clientY, trashRect) : false);
      setInteraction((prev) => prev ? { ...prev, previewStartSlot: nextStart } as MoveInteraction : prev);
    } else {
      const trackRect = trackRef.current.getBoundingClientRect();
      const { startSlot, endSlot } = resolveResizeRange(event.clientX, interaction, trackRect.left, trackRect.width);
      setIsTrashHot(false);
      setInteraction((prev) => prev ? { ...prev, previewStartSlot: startSlot, previewEndSlot: endSlot } as ResizeInteraction : prev);
    }
  }

  /**
   * Commits the current interaction to the store and clears local state.
   * If a category is being dragged in, commits it as a new block at the drop position.
   */
  function handleTrackPointerUp(event: PointerEvent<HTMLDivElement>): void {
    if (draggingCategoryId && dropPreviewSlot !== null) {
      onDropCategory(draggingCategoryId, dropPreviewSlot, dropPreviewSlot + DEFAULT_SEGMENT_DURATION_SLOTS);
      setDropPreviewSlot(null);
      return;
    }

    if (!interaction) return;

    const trashRect = trashRef.current?.getBoundingClientRect();

    if (interaction.mode === "move" && trashRect && isPointerInRect(event.clientX, event.clientY, trashRect)) {
      onDeleteSegment(interaction.segmentId);
      setInteraction(null);
      setIsTrashHot(false);
      return;
    }

    if (interaction.mode === "move") {
      onMoveSegment(interaction.segmentId, interaction.previewStartSlot);
    } else {
      onResizeSegment(interaction.segmentId, interaction.previewStartSlot, interaction.previewEndSlot);
    }

    setInteraction(null);
    setIsTrashHot(false);
  }

  /**
   * Cancels the current interaction without committing changes.
   */
  function handleTrackPointerCancel(): void {
    setInteraction(null);
    setDropPreviewSlot(null);
    setIsTrashHot(false);
  }

  return (
    <section className="flex flex-col gap-4 rounded-lg border border-app-border bg-app-surface p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="flex flex-wrap items-center gap-x-2 gap-y-1 text-lg font-semibold">
            <span>{title}</span>
            {titleSuffix ? (
              <span className="rounded-full border border-app-accent/50 bg-app-accent/15 px-2 py-0.5 text-xs font-semibold uppercase tracking-[0.16em] text-app-accent">
                {titleSuffix}
              </span>
            ) : null}
          </h2>
          <p className="text-sm text-app-muted">{subtitle ?? "0-24 timeline at 15-minute resolution"}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className={getTimelineControlButtonClassName(true)}
            onClick={onCopyTimeline}
          >
            Copy
          </button>

          <button
            type="button"
            className={getTimelineControlButtonClassName(canPasteTimeline)}
            onClick={onPasteTimeline}
            disabled={!canPasteTimeline}
            aria-disabled={!canPasteTimeline}
          >
            Paste
          </button>

          <button
            type="button"
            className={getTimelineControlButtonClassName(segments.length > 0)}
            onClick={onClearTimeline}
            disabled={segments.length === 0}
            aria-disabled={segments.length === 0}
          >
            Clear
          </button>

          <div
            ref={trashRef}
            className={`pointer-events-none flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs font-semibold uppercase tracking-wide transition ${
              isTrashHot
                ? "border-red-400/80 bg-red-500/20 text-red-200"
                : "border-app-border bg-app-panel/85 text-app-muted"
            }`}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.9">
              <path d="M4 7h16" strokeLinecap="round" />
              <path d="M9 7V5.5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 5.5V7" strokeLinecap="round" />
              <path d="M7.5 7l.7 11a2 2 0 0 0 2 1.9h3.6a2 2 0 0 0 2-1.9l.7-11" strokeLinecap="round" />
              <path d="M10 11v5M14 11v5" strokeLinecap="round" />
            </svg>
            <span className="relative inline-block w-[7.75rem] text-left">
              <span className={`transition-opacity ${isTrashHot ? "opacity-0" : "opacity-100"}`}>Delete Block</span>
              <span className={`absolute inset-0 transition-opacity ${isTrashHot ? "opacity-100" : "opacity-0"}`}>Release to delete</span>
            </span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="min-w-[72rem] space-y-2">
          <TimelineHourRuler />

          <div className="relative rounded-lg border border-app-border bg-app-panel">
            <div className="relative h-[6.5rem]">
              <TimelineQuarterHourGrid />

              <div className="absolute inset-x-0 top-3 bottom-1.5 px-3">
              <div
                ref={trackRef}
                className={`relative h-full ${draggingCategoryId ? "cursor-grabbing" : ""}`}
                onPointerMove={handleTrackPointerMove}
                onPointerUp={handleTrackPointerUp}
                onPointerCancel={handleTrackPointerCancel}
                onPointerLeave={() => {
                  setDropPreviewSlot(null);
                  setIsTrashHot(false);
                }}
              >
                {showCurrentTimeMarker ? (
                  <div
                    className="pointer-events-none absolute inset-y-0 z-40"
                    style={{ left: `${currentTimePercent}%`, transform: "translateX(-50%)" }}
                  >
                    <div aria-hidden="true" className="h-full w-[2px] bg-app-accent/55 shadow-[0_0_0_1px_rgba(255,255,255,0.28)]" />
                    <div className="pointer-events-auto absolute -top-4 left-1/2 -translate-x-1/2">
                      <Tooltip content={currentTimeLabel}>
                        <button
                          type="button"
                          className="h-2.5 w-2.5 rounded-full border border-white/60 bg-app-accent/90 shadow-[0_0_0_2px_rgba(13,18,31,0.45)] outline-none transition-transform duration-150 hover:scale-110 focus-visible:scale-110 focus-visible:ring-2 focus-visible:ring-app-accent/60"
                          aria-label={`Current time: ${currentTimeLabel}`}
                        />
                      </Tooltip>
                    </div>
                  </div>
                ) : null}

                {visibleSegments.length === 0 && dropPreviewSlot === null ? (
                  <div className="flex h-full items-center justify-center rounded-md border border-dashed border-app-border bg-app-surface/60 text-sm text-app-muted">
                    Empty timeline. Drag a category below to create the first block.
                  </div>
                ) : (
                  <>
                    {visibleSegments.map((segment) => {
                    const category = categoriesById.get(segment.categoryId);
                    const left = `${(segment.startSlot / TOTAL_DAY_SLOTS) * 100}%`;
                    const width = `${((segment.endSlot - segment.startSlot) / TOTAL_DAY_SLOTS) * 100}%`;
                    const isActive = interaction?.segmentId === segment.id;
                    const segmentLabel = category?.label ?? segment.categoryId;
                    const segmentTimeRangeLabel = formatSlotRangeLabelMeridiem(segment.startSlot, segment.endSlot);
                    const segmentDurationLabel = formatSlotDurationLabel(segment.startSlot, segment.endSlot);
                    const isMinimumSizeSegment = segment.endSlot - segment.startSlot <= 1;
                    const resizeHandleWidthClass = isMinimumSizeSegment ? "w-2" : "w-3";

                    return (
                      <Tooltip
                        key={segment.id}
                        content={`${segmentLabel} • ${segmentTimeRangeLabel} • ${segmentDurationLabel}`}
                        triggerClassName={`!absolute inset-y-0 flex min-w-0 select-none flex-col justify-between overflow-visible rounded-md border border-black/20 text-white shadow-sm ${isActive ? "ring-2 ring-app-accent/60" : ""}`}
                        triggerStyle={{
                          left,
                          width,
                          backgroundColor: category?.color ?? "#475569",
                          zIndex: isActive ? 10 : 1
                        }}
                        boundaryRef={trackRef}
                      >
                        {/* Left resize handle */}
                        <div
                          className={`absolute inset-y-0 left-0 z-10 cursor-ew-resize rounded-l-md hover:bg-black/20 ${resizeHandleWidthClass}`}
                          onPointerDown={(event) => handleLeftHandlePointerDown(event, segment)}
                        />

                        {/* Block body (move handle) */}
                        <div
                          className={`flex h-full w-full flex-col justify-start gap-0.5 overflow-hidden pl-1 pr-3 py-2 ${isActive && interaction?.mode === "move" ? "cursor-grabbing" : "cursor-grab"}`}
                          onPointerDown={(event) => handleBodyPointerDown(event, segment)}
                        >
                          <span className="truncate text-sm font-semibold">{segmentLabel}</span>
                          <span className="truncate text-xs text-white/85">{segmentTimeRangeLabel}</span>
                          <span className="truncate text-[11px] text-white/70">{segmentDurationLabel}</span>
                        </div>

                        {/* Right resize handle */}
                        <div
                          className={`absolute inset-y-0 right-0 z-10 cursor-ew-resize rounded-r-md hover:bg-black/20 ${resizeHandleWidthClass}`}
                          onPointerDown={(event) => handleRightHandlePointerDown(event, segment)}
                        />

                        {segment.categoryId === "eat" && (segment.assignedMealIds?.length ?? 0) > 0 ? (
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
                  })}

                    {draggingCategoryId !== null && dropPreviewSlot !== null && (() => {
                      const dropCategory = categoriesById.get(draggingCategoryId);
                      const previewEnd = dropPreviewSlot + DEFAULT_SEGMENT_DURATION_SLOTS;
                      return (
                        <div
                          className="pointer-events-none absolute inset-y-0 rounded-md border-2 border-white/60 opacity-70 shadow-md"
                          style={{
                            left: `${(dropPreviewSlot / TOTAL_DAY_SLOTS) * 100}%`,
                            width: `${(DEFAULT_SEGMENT_DURATION_SLOTS / TOTAL_DAY_SLOTS) * 100}%`,
                            backgroundColor: dropCategory?.color ?? "#475569",
                            zIndex: 20
                          }}
                        >
                          <div className="flex h-full flex-col justify-between overflow-hidden px-3 py-2 text-white">
                            <span className="truncate text-sm font-semibold">{dropCategory?.label}</span>
                            <span className="truncate text-xs text-white/85">
                              {formatSlotRangeLabelMeridiem(dropPreviewSlot, previewEnd)}
                            </span>
                          </div>
                        </div>
                      );
                    })()}
                  </>
                )}
              </div>
            </div>
            </div>

            <MiniTimeline dateKey={dateKey} />
          </div>
        </div>
      </div>

      {footer ? <div>{footer}</div> : null}
    </section>
  );
}

export default TimelineTrack;
