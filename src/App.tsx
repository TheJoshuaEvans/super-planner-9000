import CategoryPalette from "./components/CategoryPalette";
import type { CalendarDayStatus } from "./components/MonthlyWallCalendar";
import MonthlyWallCalendar from "./components/MonthlyWallCalendar";
import PortraitWarningOverlay from "./components/PortraitWarningOverlay";
import TimelineTrack from "./components/TimelineTrack";
import { formatCalendarDateLabel, getRelativeCalendarDateKey } from "./lib/calendar";
import { getTimelineCompleteness } from "./lib/plannerSegments";
import { TOTAL_DAY_SLOTS } from "./lib/timeline";
import { usePlannerStore } from "./store/plannerStore";
import { useMemo, useState } from "react";
import type { PlannerDateKey, PlannerSegment } from "./store/plannerStore";

const PORTRAIT_WARNING_SESSION_KEY = "sp9000-portrait-warning-dismissed";

/**
 * Composes the planner page shell from the timeline track and category palette.
 */
function App() {
  const categories = usePlannerStore((state) => state.categories);
  const segmentsByDate = usePlannerStore((state) => state.segmentsByDate);
  const addCategoryForDate = usePlannerStore((state) => state.addCategoryForDate);
  const moveSegmentForDate = usePlannerStore((state) => state.moveSegmentForDate);
  const resizeSegmentForDate = usePlannerStore((state) => state.resizeSegmentForDate);
  const deleteSegmentForDate = usePlannerStore((state) => state.deleteSegmentForDate);
  const pasteSegmentsForDate = usePlannerStore((state) => state.pasteSegmentsForDate);

  const todayDateKey = getRelativeCalendarDateKey(0);
  const tomorrowDateKey = getRelativeCalendarDateKey(1);
  const todaySegments = segmentsByDate[todayDateKey] ?? [];
  const tomorrowSegments = segmentsByDate[tomorrowDateKey] ?? [];
  const totalScheduledBlocks = todaySegments.length + tomorrowSegments.length;

  const [draggingCategoryId, setDraggingCategoryId] = useState<string | null>(null);
  const [copiedTimelineSegments, setCopiedTimelineSegments] = useState<PlannerSegment[] | null>(null);
  const [selectedDateKey, setSelectedDateKey] = useState<PlannerDateKey | null>(null);
  const [isPortraitWarningDismissed, setIsPortraitWarningDismissed] = useState<boolean>(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return window.sessionStorage.getItem(PORTRAIT_WARNING_SESSION_KEY) === "true";
  });
  const canPasteTimeline = copiedTimelineSegments !== null;
  const selectedDateSegments = selectedDateKey ? (segmentsByDate[selectedDateKey] ?? []) : [];
  const selectedDateTitle = selectedDateKey ? formatCalendarDateLabel(selectedDateKey) : "";
  const calendarDayStatusByDate = useMemo(() => {
    return Object.entries(segmentsByDate).reduce<Record<PlannerDateKey, CalendarDayStatus>>((statusByDate, [dateKey, segments]) => {
      const completeness = getTimelineCompleteness(segments, TOTAL_DAY_SLOTS);

      if (completeness === "partial" || completeness === "full") {
        statusByDate[dateKey] = completeness;
      }

      return statusByDate;
    }, {});
  }, [segmentsByDate]);

  /**
   * Commits a dragged category onto the timeline at the given slot range.
   */
  function handleDropCategory(
    dateKey: PlannerDateKey,
    categoryId: string,
    startSlot: number,
    endSlot: number
  ): void {
    addCategoryForDate(dateKey, categoryId, startSlot, endSlot);
    setDraggingCategoryId(null);
  }

  /**
   * Copies a timeline's current segment configuration into session clipboard state.
   */
  function handleCopyTimeline(dateKey: PlannerDateKey): void {
    setCopiedTimelineSegments((segmentsByDate[dateKey] ?? []).map((segment) => ({ ...segment })));
  }

  /**
   * Pastes copied segments into a target timeline using merge-overwrite semantics.
   */
  function handlePasteTimeline(dateKey: PlannerDateKey): void {
    if (!copiedTimelineSegments) {
      return;
    }

    pasteSegmentsForDate(dateKey, copiedTimelineSegments);
  }

  /**
   * Pastes copied segments across a list of dates (for weekday-wide calendar actions).
   */
  function handlePasteAcrossDates(dateKeys: PlannerDateKey[]): void {
    if (!copiedTimelineSegments) {
      return;
    }

    dateKeys.forEach((dateKey) => {
      pasteSegmentsForDate(dateKey, copiedTimelineSegments);
    });
  }

  /**
   * Closes the selected-date editor dock while preserving persisted timeline data.
   */
  function handleCloseSelectedTimeline(): void {
    setSelectedDateKey(null);
  }

  /**
   * Hides the portrait warning overlay for the duration of the current browser session.
   */
  function handleDismissPortraitWarning(): void {
    setIsPortraitWarningDismissed(true);
    window.sessionStorage.setItem(PORTRAIT_WARNING_SESSION_KEY, "true");
  }

  return (
    <>
      <main
        className={`min-h-screen bg-app-bg px-4 py-5 text-app-text lg:px-6 lg:py-6 ${selectedDateKey ? "pb-[37rem] lg:pb-[39rem]" : "pb-32 lg:pb-36"} ${draggingCategoryId ? "cursor-grabbing" : ""}`}
        onPointerUp={() => setDraggingCategoryId(null)}
      >
        <section className="mx-auto flex min-h-[calc(100vh-2.5rem)] w-full max-w-[96rem] flex-col gap-5 rounded-lg bg-app-panel p-5 shadow-card lg:min-h-[calc(100vh-3rem)] lg:p-6">
        <header className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-app-muted">
              Daily Timeline Planner
            </p>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Super Planner 9000</h1>
            <p className="max-w-3xl text-sm text-app-muted sm:text-base">
              The day is modeled as a 24-hour number line split into 15-minute slots. This first implementation pass
              establishes the landscape workspace, fixed category palette, and timeline grid that the drag-and-resize
              editor will be built on.
            </p>
          </div>

          <div className="rounded-md border border-app-border bg-app-surface px-4 py-3 text-sm text-app-muted">
            <p>
              <span className="font-semibold text-app-text">Categories:</span> {categories.length}
            </p>
            <p>
              <span className="font-semibold text-app-text">Scheduled blocks:</span> {totalScheduledBlocks}
            </p>
          </div>
        </header>

          <section className="flex flex-1 flex-col gap-5">
            <TimelineTrack
              title="Today"
              categories={categories}
              segments={todaySegments}
              canPasteTimeline={canPasteTimeline}
              onMoveSegment={(segmentId, nextStartSlot) => moveSegmentForDate(todayDateKey, segmentId, nextStartSlot)}
              onResizeSegment={(segmentId, nextStartSlot, nextEndSlot) =>
                resizeSegmentForDate(todayDateKey, segmentId, nextStartSlot, nextEndSlot)
              }
              draggingCategoryId={draggingCategoryId}
              onCopyTimeline={() => handleCopyTimeline(todayDateKey)}
              onPasteTimeline={() => handlePasteTimeline(todayDateKey)}
              onDropCategory={(categoryId, startSlot, endSlot) =>
                handleDropCategory(todayDateKey, categoryId, startSlot, endSlot)
              }
              onDeleteSegment={(segmentId) => deleteSegmentForDate(todayDateKey, segmentId)}
              showCurrentTimeMarker
            />

            <TimelineTrack
              title="Tomorrow"
              categories={categories}
              segments={tomorrowSegments}
              canPasteTimeline={canPasteTimeline}
              onMoveSegment={(segmentId, nextStartSlot) => moveSegmentForDate(tomorrowDateKey, segmentId, nextStartSlot)}
              onResizeSegment={(segmentId, nextStartSlot, nextEndSlot) =>
                resizeSegmentForDate(tomorrowDateKey, segmentId, nextStartSlot, nextEndSlot)
              }
              draggingCategoryId={draggingCategoryId}
              onCopyTimeline={() => handleCopyTimeline(tomorrowDateKey)}
              onPasteTimeline={() => handlePasteTimeline(tomorrowDateKey)}
              onDropCategory={(categoryId, startSlot, endSlot) =>
                handleDropCategory(tomorrowDateKey, categoryId, startSlot, endSlot)
              }
              onDeleteSegment={(segmentId) => deleteSegmentForDate(tomorrowDateKey, segmentId)}
            />

            <MonthlyWallCalendar
              selectedDateKey={selectedDateKey}
              onSelectDate={setSelectedDateKey}
              onPasteDate={handlePasteTimeline}
              onPasteWeekday={handlePasteAcrossDates}
              dayStatusByDate={calendarDayStatusByDate}
              canPasteTimeline={canPasteTimeline}
            />
          </section>
        </section>

        <section className="fixed inset-x-0 bottom-0 z-50 px-4 pb-4 lg:px-6 lg:pb-5">
          <div className="mx-auto flex w-full max-w-[96rem] flex-col gap-4 rounded-lg border border-app-border bg-app-surface/95 p-4 shadow-card backdrop-blur">
            {selectedDateKey ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-app-muted">
                    Editing {selectedDateTitle}
                  </p>
                  <button
                    type="button"
                    onClick={handleCloseSelectedTimeline}
                    className="rounded-md border border-app-border px-2 py-1 text-xs font-medium text-app-muted transition hover:border-app-text hover:text-app-text"
                    aria-label="Close selected date timeline editor"
                  >
                    Close
                  </button>
                </div>

                <TimelineTrack
                  title={selectedDateTitle}
                  categories={categories}
                  segments={selectedDateSegments}
                  canPasteTimeline={canPasteTimeline}
                  onMoveSegment={(segmentId, nextStartSlot) => moveSegmentForDate(selectedDateKey, segmentId, nextStartSlot)}
                  onResizeSegment={(segmentId, nextStartSlot, nextEndSlot) =>
                    resizeSegmentForDate(selectedDateKey, segmentId, nextStartSlot, nextEndSlot)
                  }
                  draggingCategoryId={draggingCategoryId}
                  onCopyTimeline={() => handleCopyTimeline(selectedDateKey)}
                  onPasteTimeline={() => handlePasteTimeline(selectedDateKey)}
                  onDropCategory={(categoryId, startSlot, endSlot) =>
                    handleDropCategory(selectedDateKey, categoryId, startSlot, endSlot)
                  }
                  onDeleteSegment={(segmentId) => deleteSegmentForDate(selectedDateKey, segmentId)}
                />
              </div>
            ) : null}

            <CategoryPalette
              categories={categories}
              draggingCategoryId={draggingCategoryId}
              onCategoryDragStart={setDraggingCategoryId}
            />
          </div>
        </section>
      </main>

      <PortraitWarningOverlay
        isDismissed={isPortraitWarningDismissed}
        onDismiss={handleDismissPortraitWarning}
      />
    </>
  );
}

export default App;
