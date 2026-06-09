import CategoryPalette from "./components/CategoryPalette";
import TimelineTrack from "./components/TimelineTrack";
import { usePlannerStore } from "./store/plannerStore";
import { useState } from "react";
import type { PlannerDayKey, PlannerSegment } from "./store/plannerStore";

/**
 * Composes the planner page shell from the timeline track and category palette.
 */
function App() {
  const categories = usePlannerStore((state) => state.categories);
  const segmentsByDay = usePlannerStore((state) => state.segmentsByDay);
  const addCategory = usePlannerStore((state) => state.addCategory);
  const moveSegment = usePlannerStore((state) => state.moveSegment);
  const resizeSegment = usePlannerStore((state) => state.resizeSegment);
  const deleteSegment = usePlannerStore((state) => state.deleteSegment);
  const pasteSegments = usePlannerStore((state) => state.pasteSegments);
  const totalScheduledBlocks = segmentsByDay.today.length + segmentsByDay.tomorrow.length;

  const [draggingCategoryId, setDraggingCategoryId] = useState<string | null>(null);
  const [copiedTimelineSegments, setCopiedTimelineSegments] = useState<PlannerSegment[] | null>(null);
  const canPasteTimeline = copiedTimelineSegments !== null;

  /**
   * Commits a dragged category onto the timeline at the given slot range.
   */
  function handleDropCategory(
    dayKey: "today" | "tomorrow",
    categoryId: string,
    startSlot: number,
    endSlot: number
  ): void {
    addCategory(dayKey, categoryId, startSlot, endSlot);
    setDraggingCategoryId(null);
  }

  /**
   * Copies a timeline's current segment configuration into session clipboard state.
   */
  function handleCopyTimeline(dayKey: PlannerDayKey): void {
    setCopiedTimelineSegments(segmentsByDay[dayKey].map((segment) => ({ ...segment })));
  }

  /**
   * Pastes copied segments into a target timeline using merge-overwrite semantics.
   */
  function handlePasteTimeline(dayKey: PlannerDayKey): void {
    if (!copiedTimelineSegments) {
      return;
    }

    pasteSegments(dayKey, copiedTimelineSegments);
  }

  return (
    <main
      className={`min-h-screen bg-app-bg px-4 py-5 pb-32 text-app-text lg:px-6 lg:py-6 lg:pb-36 ${draggingCategoryId ? "cursor-grabbing" : ""}`}
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
            segments={segmentsByDay.today}
            canPasteTimeline={canPasteTimeline}
            onMoveSegment={(segmentId, nextStartSlot) => moveSegment("today", segmentId, nextStartSlot)}
            onResizeSegment={(segmentId, nextStartSlot, nextEndSlot) =>
              resizeSegment("today", segmentId, nextStartSlot, nextEndSlot)
            }
            draggingCategoryId={draggingCategoryId}
            onCopyTimeline={() => handleCopyTimeline("today")}
            onPasteTimeline={() => handlePasteTimeline("today")}
            onDropCategory={(categoryId, startSlot, endSlot) =>
              handleDropCategory("today", categoryId, startSlot, endSlot)
            }
            onDeleteSegment={(segmentId) => deleteSegment("today", segmentId)}
            showCurrentTimeMarker
          />

          <TimelineTrack
            title="Tomorrow"
            categories={categories}
            segments={segmentsByDay.tomorrow}
            canPasteTimeline={canPasteTimeline}
            onMoveSegment={(segmentId, nextStartSlot) => moveSegment("tomorrow", segmentId, nextStartSlot)}
            onResizeSegment={(segmentId, nextStartSlot, nextEndSlot) =>
              resizeSegment("tomorrow", segmentId, nextStartSlot, nextEndSlot)
            }
            draggingCategoryId={draggingCategoryId}
            onCopyTimeline={() => handleCopyTimeline("tomorrow")}
            onPasteTimeline={() => handlePasteTimeline("tomorrow")}
            onDropCategory={(categoryId, startSlot, endSlot) =>
              handleDropCategory("tomorrow", categoryId, startSlot, endSlot)
            }
            onDeleteSegment={(segmentId) => deleteSegment("tomorrow", segmentId)}
          />
        </section>
      </section>

      <section className="fixed inset-x-0 bottom-0 z-50 px-4 pb-4 lg:px-6 lg:pb-5">
        <div className="mx-auto w-full max-w-[96rem] rounded-lg border border-app-border bg-app-surface/95 p-4 shadow-card backdrop-blur">
          <CategoryPalette
            categories={categories}
            draggingCategoryId={draggingCategoryId}
            onCategoryDragStart={setDraggingCategoryId}
          />
        </div>
      </section>
    </main>
  );
}

export default App;
