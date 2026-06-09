import CategoryPalette from "./components/CategoryPalette";
import MealTimelineTrack from "./components/MealTimelineTrack";
import MonthlyWallCalendar from "./components/MonthlyWallCalendar";
import PortraitWarningOverlay from "./components/PortraitWarningOverlay";
import ToastViewport from "./components/ToastViewport";
import TimelineTrack from "./components/TimelineTrack";
import { formatCalendarDateLabel, getRelativeCalendarDateKey, parseCalendarDateKey } from "./lib/calendar";
import {
  buildPlannerExportFilename,
  parsePlannerDataImport,
  serializePlannerDataExport
} from "./lib/plannerDataIO";
import { formatSlotRangeLabelMeridiem } from "./lib/timeline";
import { usePlannerStore } from "./store/plannerStore";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useToastStore } from "./store/toastStore";
import type { PlannerDateKey, PlannerSegment } from "./store/plannerStore";

const PORTRAIT_WARNING_SESSION_KEY = "sp9000-portrait-warning-dismissed";
const ACTIVE_TAB_LOCAL_STORAGE_KEY = "sp9000-active-tab";

const APP_TABS = [
  {
    id: "day-planner",
    label: "Day Planner",
    kicker: "Daily Timeline Planner",
    description:
      "Plan your day with draggable timeline blocks, copy and paste patterns across dates, and preview how each calendar day is filling up at a glance. Today and tomorrow stay pinned up top, while any date you select from the calendar opens in the docked editor below.",
    contentKind: "day-planner"
  },
  {
    id: "meal-planner",
    label: "Meal Planner",
    kicker: "Meal Planner",
    description: "Review your day through a meal-planning lens, with food blocks emphasized and everything else subdued.",
    contentKind: "meal-planner"
  }
] as const;

type AppTab = (typeof APP_TABS)[number]["id"];
type AppTabDefinition = (typeof APP_TABS)[number];

function isAppTab(value: string | null): value is AppTab {
  return APP_TABS.some((tab) => tab.id === value);
}

function getAppTabDefinition(tabId: AppTab): AppTabDefinition {
  return APP_TABS.find((tab) => tab.id === tabId) ?? APP_TABS[0];
}

/**
 * Composes the planner page shell from the timeline track and category palette.
 */
function App() {
  const categories = usePlannerStore((state) => state.categories);
  const segmentsByDate = usePlannerStore((state) => state.segmentsByDate);
  const addCategoryForDate = usePlannerStore((state) => state.addCategoryForDate);
  const replacePlannerData = usePlannerStore((state) => state.replacePlannerData);
  const moveSegmentForDate = usePlannerStore((state) => state.moveSegmentForDate);
  const resizeSegmentForDate = usePlannerStore((state) => state.resizeSegmentForDate);
  const deleteSegmentForDate = usePlannerStore((state) => state.deleteSegmentForDate);
  const pasteSegmentsForDate = usePlannerStore((state) => state.pasteSegmentsForDate);
  const showToast = useToastStore((state) => state.showToast);
  const [activeTab, setActiveTab] = useState<AppTab>(() => {
    if (typeof window === "undefined") {
      return APP_TABS[0].id;
    }

    const storedTab = window.localStorage.getItem(ACTIVE_TAB_LOCAL_STORAGE_KEY);
    return isAppTab(storedTab) ? storedTab : APP_TABS[0].id;
  });

  const todayDateKey = getRelativeCalendarDateKey(0);
  const tomorrowDateKey = getRelativeCalendarDateKey(1);
  const dayAfterTomorrowDateKey = getRelativeCalendarDateKey(2);
  const mealPlannerWeekDateKeys = Array.from({ length: 7 }, (_, offset) => getRelativeCalendarDateKey(offset));
  const todaySegments = segmentsByDate[todayDateKey] ?? [];
  const tomorrowSegments = segmentsByDate[tomorrowDateKey] ?? [];
  const dayAfterTomorrowSegments = segmentsByDate[dayAfterTomorrowDateKey] ?? [];

  const [draggingCategoryId, setDraggingCategoryId] = useState<string | null>(null);
  const [copiedTimelineSegments, setCopiedTimelineSegments] = useState<PlannerSegment[] | null>(null);
  const [copiedTimelineSourceDateKey, setCopiedTimelineSourceDateKey] = useState<PlannerDateKey | null>(null);
  const [selectedDateKey, setSelectedDateKey] = useState<PlannerDateKey | null>(null);
  const [isPortraitWarningDismissed, setIsPortraitWarningDismissed] = useState<boolean>(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return window.sessionStorage.getItem(PORTRAIT_WARNING_SESSION_KEY) === "true";
  });
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const canPasteTimeline = copiedTimelineSegments !== null;
  const selectedDateSegments = selectedDateKey ? (segmentsByDate[selectedDateKey] ?? []) : [];
  const selectedDateTitle = selectedDateKey ? formatCalendarDateLabel(selectedDateKey) : "";
  const activeTabDefinition = getAppTabDefinition(activeTab);
  const isDayPlannerTab = activeTabDefinition.contentKind === "day-planner";

  useEffect(() => {
    window.localStorage.setItem(ACTIVE_TAB_LOCAL_STORAGE_KEY, activeTab);
  }, [activeTab]);

  function formatDateKeyList(dateKeys: PlannerDateKey[]): string {
    return dateKeys.map((dateKey) => formatCalendarDateLabel(dateKey)).join(", ");
  }

  function formatDashboardDateSubtitle(dateKey: PlannerDateKey): string {
    const parsedDate = parseCalendarDateKey(dateKey);

    if (!parsedDate) {
      return dateKey;
    }

    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric"
    }).format(parsedDate);
  }

  function formatDashboardWeekdayLabel(dateKey: PlannerDateKey): string {
    const parsedDate = parseCalendarDateKey(dateKey);

    if (!parsedDate) {
      return "";
    }

    return new Intl.DateTimeFormat("en-US", {
      weekday: "long"
    }).format(parsedDate);
  }

  function formatPasteTargetLabel(dateKeys: PlannerDateKey[]): string {
    if (dateKeys.length === 1) {
      return formatCalendarDateLabel(dateKeys[0]);
    }

    const parsedDates = dateKeys
      .map((dateKey) => parseCalendarDateKey(dateKey))
      .filter((date): date is Date => date !== null);

    if (parsedDates.length === dateKeys.length) {
      const weekdayFormatter = new Intl.DateTimeFormat("en-US", { weekday: "long" });
      const monthFormatter = new Intl.DateTimeFormat("en-US", { month: "long" });
      const yearFormatter = new Intl.DateTimeFormat("en-US", { year: "numeric" });

      const firstDate = parsedDates[0];
      const weekdayName = weekdayFormatter.format(firstDate);
      const monthName = monthFormatter.format(firstDate);
      const yearLabel = yearFormatter.format(firstDate);
      const allSameWeekday = parsedDates.every((date) => weekdayFormatter.format(date) === weekdayName);
      const allSameMonth = parsedDates.every((date) => monthFormatter.format(date) === monthName);
      const allSameYear = parsedDates.every((date) => yearFormatter.format(date) === yearLabel);

      if (allSameWeekday && allSameMonth && allSameYear) {
        return `${dateKeys.length} ${weekdayName}s in ${monthName} ${yearLabel}`;
      }
    }

    return formatDateKeyList(dateKeys);
  }

  function getMealPlannerRelativeLabel(dayOffset: number): string | undefined {
    if (dayOffset === 0) {
      return "Today";
    }

    if (dayOffset === 1) {
      return "Tomorrow";
    }

    if (dayOffset === 2) {
      return "Day after Tomorrow";
    }

    return undefined;
  }

  /**
   * Exports the current planner state to a JSON file.
   */
  function handleExportPlannerData(): void {
    const plannerState = usePlannerStore.getState();
    const exportedJson = serializePlannerDataExport({
      categories: plannerState.categories,
      segmentsByDate: plannerState.segmentsByDate
    });
    const blob = new Blob([exportedJson], { type: "application/json;charset=utf-8" });
    const downloadUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = downloadUrl;
    anchor.download = buildPlannerExportFilename();
    anchor.rel = "noreferrer";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(downloadUrl);

    showToast({
      title: "Export downloaded",
      message: `Saved as ${anchor.download}.`,
      level: "success"
    });
  }

  /**
   * Opens the file picker for a planner import.
   */
  function handleImportButtonClick(): void {
    importInputRef.current?.click();
  }

  /**
   * Replaces the current planner data with the contents of a JSON import file.
   */
  async function handleImportFileChange(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const importText = await file.text();
      const parsed = parsePlannerDataImport(importText);

      if (!parsed.ok) {
        showToast({
          title: "Import failed",
          message: parsed.error,
          level: "error"
        });
        return;
      }

      replacePlannerData(parsed.data);
      setSelectedDateKey(null);
      setCopiedTimelineSegments(null);
      setCopiedTimelineSourceDateKey(null);
      setDraggingCategoryId(null);
      showToast({
        title: "Planner imported",
        message: "The current planner state was replaced with the imported file.",
        level: "success"
      });
    } catch {
      showToast({
        title: "Import failed",
        message: "Could not read the selected file.",
        level: "error"
      });
    } finally {
      event.target.value = "";
    }
  }

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
    setCopiedTimelineSourceDateKey(dateKey);

    showToast({
      title: "Timeline copied",
      message: `Copied ${formatCalendarDateLabel(dateKey)} to the clipboard.`,
      level: "info"
    });
  }

  /**
   * Pastes copied segments into a target timeline using merge-overwrite semantics.
   */
  function handlePasteTimeline(dateKey: PlannerDateKey): void {
    if (!copiedTimelineSegments) {
      return;
    }

    pasteSegmentsForDate(dateKey, copiedTimelineSegments);

    const sourceLabel = copiedTimelineSourceDateKey
      ? formatCalendarDateLabel(copiedTimelineSourceDateKey)
      : "the clipboard";
    const targetLabel = formatPasteTargetLabel([dateKey]);
    const message = copiedTimelineSourceDateKey === dateKey
      ? `Reapplied the timeline for ${targetLabel}.`
      : `Pasted the timeline from ${sourceLabel} into ${targetLabel}.`;

    showToast({
      title: "Timeline pasted",
      message,
      level: "success"
    });
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

    const sourceLabel = copiedTimelineSourceDateKey
      ? formatCalendarDateLabel(copiedTimelineSourceDateKey)
      : "the clipboard";
    const targetLabel = formatPasteTargetLabel(dateKeys);

    showToast({
      title: "Timeline pasted",
      message: `Pasted the timeline from ${sourceLabel} into ${targetLabel}.`,
      level: "success"
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

  function handleMealEatSegmentClick(dateKey: PlannerDateKey, segment: PlannerSegment): void {
    window.alert(
      `debug: Eat section clicked for ${formatCalendarDateLabel(dateKey)} at ${formatSlotRangeLabelMeridiem(segment.startSlot, segment.endSlot)}`
    );
  }

  return (
    <>
      <ToastViewport />
      <main
        className={`min-h-screen bg-app-bg px-4 py-5 text-app-text lg:px-6 lg:py-6 ${selectedDateKey ? "pb-[37rem] lg:pb-[39rem]" : "pb-32 lg:pb-36"} ${draggingCategoryId ? "cursor-grabbing" : ""}`}
        onPointerUp={isDayPlannerTab ? () => setDraggingCategoryId(null) : undefined}
      >
        <section className="mx-auto flex min-h-[calc(100vh-2.5rem)] w-full max-w-[96rem] flex-col gap-5 rounded-lg bg-app-panel p-5 shadow-card lg:min-h-[calc(100vh-3rem)] lg:p-6">
          <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-app-muted">
                {activeTabDefinition.kicker}
              </p>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Super Planner 9000</h1>
              <p className="max-w-3xl text-sm text-app-muted sm:text-base">{activeTabDefinition.description}</p>
            </div>

            <div className="flex flex-col items-start gap-3 lg:items-end">
              <div className="inline-flex rounded-lg border border-app-border bg-app-surface/90 p-1 shadow-sm">
                {APP_TABS.map((tab) => {
                  const isActive = activeTab === tab.id;

                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`rounded-md px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition ${
                        isActive ? "bg-app-accent text-white shadow-sm" : "text-app-muted hover:text-app-text"
                      }`}
                      aria-pressed={isActive}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportPlannerData}
                  className="rounded-md border border-app-border bg-app-panel/85 px-2.5 py-1.5 text-xs font-semibold uppercase tracking-wide text-app-muted transition hover:border-app-accent/70 hover:text-app-text"
                >
                  Export
                </button>
                <button
                  type="button"
                  onClick={handleImportButtonClick}
                  className="rounded-md border border-app-border bg-app-panel/85 px-2.5 py-1.5 text-xs font-semibold uppercase tracking-wide text-app-muted transition hover:border-app-accent/70 hover:text-app-text"
                >
                  Import
                </button>
              </div>

              <input
                ref={importInputRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={handleImportFileChange}
              />
            </div>
          </header>

          {activeTabDefinition.contentKind === "day-planner" ? (
            <section className="flex flex-1 flex-col gap-5">
              <TimelineTrack
                title="Today"
                titleSuffix={formatDashboardWeekdayLabel(todayDateKey)}
                subtitle={formatDashboardDateSubtitle(todayDateKey)}
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
                titleSuffix={formatDashboardWeekdayLabel(tomorrowDateKey)}
                subtitle={formatDashboardDateSubtitle(tomorrowDateKey)}
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

              <TimelineTrack
                title="Day after Tomorrow"
                titleSuffix={formatDashboardWeekdayLabel(dayAfterTomorrowDateKey)}
                subtitle={formatDashboardDateSubtitle(dayAfterTomorrowDateKey)}
                categories={categories}
                segments={dayAfterTomorrowSegments}
                canPasteTimeline={canPasteTimeline}
                onMoveSegment={(segmentId, nextStartSlot) =>
                  moveSegmentForDate(dayAfterTomorrowDateKey, segmentId, nextStartSlot)
                }
                onResizeSegment={(segmentId, nextStartSlot, nextEndSlot) =>
                  resizeSegmentForDate(dayAfterTomorrowDateKey, segmentId, nextStartSlot, nextEndSlot)
                }
                draggingCategoryId={draggingCategoryId}
                onCopyTimeline={() => handleCopyTimeline(dayAfterTomorrowDateKey)}
                onPasteTimeline={() => handlePasteTimeline(dayAfterTomorrowDateKey)}
                onDropCategory={(categoryId, startSlot, endSlot) =>
                  handleDropCategory(dayAfterTomorrowDateKey, categoryId, startSlot, endSlot)
                }
                onDeleteSegment={(segmentId) => deleteSegmentForDate(dayAfterTomorrowDateKey, segmentId)}
              />

              <MonthlyWallCalendar
                selectedDateKey={selectedDateKey}
                onSelectDate={setSelectedDateKey}
                onPasteDate={handlePasteTimeline}
                onPasteWeekday={handlePasteAcrossDates}
                canPasteTimeline={canPasteTimeline}
                categories={categories}
                segmentsByDate={segmentsByDate}
              />
            </section>
          ) : (
            <section className="flex flex-1 flex-col gap-5">
              {mealPlannerWeekDateKeys.map((dateKey, dayOffset) => (
                <MealTimelineTrack
                  key={dateKey}
                  weekdayLabel={formatDashboardWeekdayLabel(dateKey)}
                  relativeLabel={getMealPlannerRelativeLabel(dayOffset)}
                  subtitle={formatDashboardDateSubtitle(dateKey)}
                  categories={categories}
                  segments={segmentsByDate[dateKey] ?? []}
                  showCurrentTimeMarker={dayOffset === 0}
                  onEatSegmentClick={(segment) => handleMealEatSegmentClick(dateKey, segment)}
                />
              ))}
            </section>
          )}
        </section>

        {isDayPlannerTab ? (
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
        ) : null}
      </main>

      <PortraitWarningOverlay
        isDismissed={isPortraitWarningDismissed}
        onDismiss={handleDismissPortraitWarning}
      />
    </>
  );
}

export default App;
