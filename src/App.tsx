import CategoryPalette from "./components/CategoryPalette/CategoryPalette";
import ConfirmDialog from "./components/ConfirmDialog/ConfirmDialog";
import DashboardTimelineTrack from "./components/DashboardTimelineTrack/DashboardTimelineTrack";
import GoogleCalendarReconnectButton from "./components/Settings/GoogleCalendarReconnectButton";
import MealAssignmentPanel from "./components/MealAssignmentPanel/MealAssignmentPanel";
import MealCreator from "./components/MealCreator/MealCreator";
import MealTimelineTrack from "./components/MealTimelineTrack/MealTimelineTrack";
import MonthlyWallCalendar from "./components/MonthlyWallCalendar/MonthlyWallCalendar";
import PlannerHistoryControls from "./components/PlannerHistoryControls/PlannerHistoryControls";
import PortraitWarningOverlay from "./components/PortraitWarningOverlay/PortraitWarningOverlay";
import Settings from "./components/Settings/Settings";
import ShoppingListPanel from "./components/ShoppingListPanel/ShoppingListPanel";
import ToastViewport from "./components/ToastViewport/ToastViewport";
import TimelineTrack from "./components/TimelineTrack/TimelineTrack";
import { useGoogleCalendarTokenExpiry } from "./hooks/useGoogleCalendarTokenExpiry";
import { usePlannerUndoRedoHotkeys } from "./hooks/usePlannerUndoRedoHotkeys";
import {
  ACTIVE_TAB_LOCAL_STORAGE_KEY,
  APP_TABS,
  getAppTabDefinition,
  isAppTab
} from "./lib/appTabs";
import type { AppTab, AppTabDefinition } from "./lib/appTabs";
import { formatCalendarDateLabel, getRelativeCalendarDateKey } from "./lib/calendar";
import { toggleMealSelection } from "./lib/mealAssignment";
import {
  buildPlannerExportFilename,
  parsePlannerDataImport,
  serializePlannerDataExport
} from "./lib/plannerDataIO";
import {
  formatDashboardDateSubtitle,
  formatDashboardWeekdayLabel,
  formatPasteTargetLabel,
  getRelativeWeekDayLabel
} from "./lib/plannerViewHelpers";
import { formatSlotRangeLabelMeridiem } from "./lib/timeline";
import { useConfirmDialogStore } from "./store/confirmDialogStore";
import { usePlannerStore } from "./store/plannerStore";
import { useMealStore } from "./store/mealStore";
import { useEffect, useRef, useState, type ChangeEvent, type ReactElement } from "react";
import { useToastStore } from "./store/toastStore";
import type { PlannerDateKey, PlannerSegment } from "./store/plannerStore";

/** Identifies the "Eat" segment currently selected for meal assignment. */
type SelectedEatSegment = {
  dateKey: PlannerDateKey;
  segmentId: string;
};

const PORTRAIT_WARNING_SESSION_KEY = "sp9000-portrait-warning-dismissed";

/**
 * Day Planner dashboard timeline configuration.
 * Each entry describes one pinned timeline row shown at the top of the Day Planner.
 * Offset 0 = today; subsequent offsets extend into future days.
 */
const DASHBOARD_TIMELINE_ROWS = [
  { title: "Today", offset: 0, showCurrentTimeMarker: true },
  { title: "Tomorrow", offset: 1, showCurrentTimeMarker: false },
  { title: "Day after Tomorrow", offset: 2, showCurrentTimeMarker: false }
] as const;

/** The Dashboard tab, rendered as its own floating pill set apart from the other tabs. */
const DASHBOARD_TAB = APP_TABS[0];

/** All tabs other than Dashboard, rendered together in the main tab pill. */
const OTHER_TABS = APP_TABS.slice(1);

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
  const clearSegmentsForDate = usePlannerStore((state) => state.clearSegmentsForDate);
  const setSegmentAssignedMealsForDate = usePlannerStore((state) => state.setSegmentAssignedMealsForDate);
  const pasteSegmentsForDate = usePlannerStore((state) => state.pasteSegmentsForDate);
  const meals = useMealStore((state) => state.meals);
  const canUndoPlannerEdit = usePlannerStore((state) => state.canUndo);
  const canRedoPlannerEdit = usePlannerStore((state) => state.canRedo);
  const undoPlannerEdit = usePlannerStore((state) => state.undoPlannerEdit);
  const redoPlannerEdit = usePlannerStore((state) => state.redoPlannerEdit);
  const showToast = useToastStore((state) => state.showToast);
  const requestConfirm = useConfirmDialogStore((state) => state.requestConfirm);
  const [activeTab, setActiveTab] = useState<AppTab>(() => {
    if (typeof window === "undefined") {
      return APP_TABS[0].id;
    }

    const storedTab = window.localStorage.getItem(ACTIVE_TAB_LOCAL_STORAGE_KEY);
    return isAppTab(storedTab) ? storedTab : APP_TABS[0].id;
  });

  const dashboardDateKeys = DASHBOARD_TIMELINE_ROWS.map((row) => getRelativeCalendarDateKey(row.offset));
  const currentWeekDateKeys = Array.from({ length: 7 }, (_, offset) => getRelativeCalendarDateKey(offset));

  const [draggingCategoryId, setDraggingCategoryId] = useState<string | null>(null);
  const [copiedTimelineSegments, setCopiedTimelineSegments] = useState<PlannerSegment[] | null>(null);
  const [copiedTimelineSourceDateKey, setCopiedTimelineSourceDateKey] = useState<PlannerDateKey | null>(null);
  const [selectedDateKey, setSelectedDateKey] = useState<PlannerDateKey | null>(null);
  const [selectedMealDateKey, setSelectedMealDateKey] = useState<PlannerDateKey | null>(null);
  const [selectedEatSegment, setSelectedEatSegment] = useState<SelectedEatSegment | null>(null);
  const [pendingMealIds, setPendingMealIds] = useState<string[]>([]);
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
  const selectedMealDateSegments = selectedMealDateKey ? (segmentsByDate[selectedMealDateKey] ?? []) : [];
  const selectedMealDateTitle = selectedMealDateKey ? formatCalendarDateLabel(selectedMealDateKey) : "";
  const activeTabDefinition = getAppTabDefinition(activeTab);
  const isDayPlannerTab = activeTabDefinition.contentKind === "day-planner";
  const isMealPlannerTab = activeTabDefinition.contentKind === "meal-planner";
  const selectedEatSegmentData = selectedEatSegment
    ? (segmentsByDate[selectedEatSegment.dateKey] ?? []).find((segment) => segment.id === selectedEatSegment.segmentId)
    : undefined;
  const selectedEatSegmentLabel = selectedEatSegment && selectedEatSegmentData
    ? `${formatCalendarDateLabel(selectedEatSegment.dateKey)} • ${formatSlotRangeLabelMeridiem(selectedEatSegmentData.startSlot, selectedEatSegmentData.endSlot)}`
    : "";

  useEffect(() => {
    window.localStorage.setItem(ACTIVE_TAB_LOCAL_STORAGE_KEY, activeTab);
  }, [activeTab]);

  usePlannerUndoRedoHotkeys({
    enabled: isDayPlannerTab,
    canUndo: canUndoPlannerEdit,
    canRedo: canRedoPlannerEdit,
    onUndo: undoPlannerEdit,
    onRedo: redoPlannerEdit
  });

  useGoogleCalendarTokenExpiry();

  /**
   * Exports the current planner state to a JSON file.
   */
  function handleExportPlannerData(): void {
    const plannerState = usePlannerStore.getState();
    const mealState = useMealStore.getState();
    const exportedJson = serializePlannerDataExport(
      { categories: plannerState.categories, segmentsByDate: plannerState.segmentsByDate },
      { components: mealState.components, meals: mealState.meals }
    );
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
      useMealStore.getState().replaceMealData(parsed.meals);
      setSelectedDateKey(null);
      setCopiedTimelineSegments(null);
      setCopiedTimelineSourceDateKey(null);
      setDraggingCategoryId(null);
      setSelectedEatSegment(null);
      setPendingMealIds([]);
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
   * Prompts for confirmation, then removes all blocks from a date's timeline.
   */
  function handleClearTimeline(dateKey: PlannerDateKey, dateLabel: string): void {
    requestConfirm({
      title: "Clear timeline?",
      message: `This will remove all blocks from ${dateLabel}. You can undo this afterwards.`,
      confirmLabel: "Clear",
      tone: "danger",
      onConfirm: () => {
        clearSegmentsForDate(dateKey);
        showToast({
          title: "Timeline cleared",
          message: `Removed all blocks from ${dateLabel}.`,
          level: "info"
        });
      }
    });
  }

  /**
   * Switches the active tab, closing the meal assignment dock if it is open.
   */
  function handleSelectTab(tab: AppTab): void {
    setActiveTab(tab);
    setSelectedEatSegment(null);
    setPendingMealIds([]);
  }

  /**
   * Renders a single tab pill button, highlighted when it is the active tab.
   */
  function renderTabButton(tab: AppTabDefinition): ReactElement {
    const isActive = activeTab === tab.id;

    return (
      <button
        key={tab.id}
        type="button"
        onClick={() => handleSelectTab(tab.id)}
        className={`rounded-md px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition ${
          isActive ? "bg-app-accent text-white shadow-sm" : "text-app-muted hover:text-app-text"
        }`}
        aria-pressed={isActive}
      >
        {tab.label}
      </button>
    );
  }

  /**
   * Hides the portrait warning overlay for the duration of the current browser session.
   */
  function handleDismissPortraitWarning(): void {
    setIsPortraitWarningDismissed(true);
    window.sessionStorage.setItem(PORTRAIT_WARNING_SESSION_KEY, "true");
  }

  /**
   * Opens the meal assignment dock for the clicked Eat segment, seeded with its current assignments.
   */
  function handleMealEatSegmentClick(dateKey: PlannerDateKey, segment: PlannerSegment): void {
    setSelectedEatSegment({ dateKey, segmentId: segment.id });
    setPendingMealIds(segment.assignedMealIds ?? []);
  }

  /**
   * Toggles a meal in or out of the pending assignment selection.
   */
  function handleToggleAssignedMeal(mealId: string): void {
    setPendingMealIds((current) => toggleMealSelection(current, mealId));
  }

  /**
   * Closes the meal assignment dock without saving changes.
   */
  function handleCloseMealAssignment(): void {
    setSelectedEatSegment(null);
    setPendingMealIds([]);
  }

  /**
   * Saves the pending meal selection to the selected Eat segment and closes the dock.
   */
  function handleSubmitMealAssignment(): void {
    if (!selectedEatSegment) {
      return;
    }

    setSegmentAssignedMealsForDate(selectedEatSegment.dateKey, selectedEatSegment.segmentId, pendingMealIds);

    showToast({
      title: "Meals assigned",
      message:
        pendingMealIds.length > 0
          ? `Assigned ${pendingMealIds.length} meal${pendingMealIds.length === 1 ? "" : "s"} to the selected Eat block.`
          : "Cleared meal assignments for the selected Eat block.",
      level: "success"
    });

    setSelectedEatSegment(null);
    setPendingMealIds([]);
  }

  return (
    <>
      <ToastViewport />
      <ConfirmDialog />
      <main
        className={`min-h-screen bg-app-bg px-4 py-5 text-app-text lg:px-6 lg:py-6 ${selectedDateKey || selectedMealDateKey || selectedEatSegment ? "pb-[37rem] lg:pb-[39rem]" : "pb-32 lg:pb-36"} ${draggingCategoryId ? "cursor-grabbing" : ""}`}
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
              <div className="flex items-center gap-2" role="group" aria-label="App tabs">
                <GoogleCalendarReconnectButton />

                <div className="inline-flex rounded-lg border border-app-border bg-app-surface/90 p-1 shadow-sm">
                  {renderTabButton(DASHBOARD_TAB)}
                </div>

                <div className="inline-flex rounded-lg border border-app-border bg-app-surface/90 p-1 shadow-sm">
                  {OTHER_TABS.map(renderTabButton)}
                </div>
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

          {activeTabDefinition.contentKind === "dashboard" ? (
            <section className="flex flex-1 flex-col gap-5">
              {currentWeekDateKeys.slice(0, 3).map((dateKey, dayOffset) => (
                <DashboardTimelineTrack
                  key={dateKey}
                  dateKey={dateKey}
                  weekdayLabel={formatDashboardWeekdayLabel(dateKey)}
                  relativeLabel={getRelativeWeekDayLabel(dayOffset)}
                  subtitle={formatDashboardDateSubtitle(dateKey)}
                  categories={categories}
                  segments={segmentsByDate[dateKey] ?? []}
                  meals={meals}
                  showCurrentTimeMarker={dayOffset === 0}
                />
              ))}

              <ShoppingListPanel defaultEndDateOffsetDays={2} />
            </section>
          ) : activeTabDefinition.contentKind === "day-planner" ? (
            <section className="flex flex-1 flex-col gap-5">
              {DASHBOARD_TIMELINE_ROWS.map((row, index) => {
                const dateKey = dashboardDateKeys[index];
                return (
                  <TimelineTrack
                    key={dateKey}
                    dateKey={dateKey}
                    title={row.title}
                    titleSuffix={formatDashboardWeekdayLabel(dateKey)}
                    subtitle={formatDashboardDateSubtitle(dateKey)}
                    categories={categories}
                    segments={segmentsByDate[dateKey] ?? []}
                    canPasteTimeline={canPasteTimeline}
                    onMoveSegment={(segmentId, nextStartSlot) => moveSegmentForDate(dateKey, segmentId, nextStartSlot)}
                    onResizeSegment={(segmentId, nextStartSlot, nextEndSlot) =>
                      resizeSegmentForDate(dateKey, segmentId, nextStartSlot, nextEndSlot)
                    }
                    draggingCategoryId={draggingCategoryId}
                    onCopyTimeline={() => handleCopyTimeline(dateKey)}
                    onPasteTimeline={() => handlePasteTimeline(dateKey)}
                    onClearTimeline={() => handleClearTimeline(dateKey, formatCalendarDateLabel(dateKey))}
                    onDropCategory={(categoryId, startSlot, endSlot) =>
                      handleDropCategory(dateKey, categoryId, startSlot, endSlot)
                    }
                    onDeleteSegment={(segmentId) => deleteSegmentForDate(dateKey, segmentId)}
                    showCurrentTimeMarker={row.showCurrentTimeMarker}
                  />
                );
              })}

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
          ) : activeTabDefinition.contentKind === "meal-planner" ? (
            <section className="flex flex-1 flex-col gap-5">
              {DASHBOARD_TIMELINE_ROWS.map((row, index) => {
                const dateKey = dashboardDateKeys[index];
                return (
                  <MealTimelineTrack
                    key={dateKey}
                    title={row.title}
                    titleSuffix={formatDashboardWeekdayLabel(dateKey)}
                    subtitle={formatDashboardDateSubtitle(dateKey)}
                    categories={categories}
                    segments={segmentsByDate[dateKey] ?? []}
                    meals={meals}
                    showCurrentTimeMarker={row.showCurrentTimeMarker}
                    onEatSegmentClick={(segment) => handleMealEatSegmentClick(dateKey, segment)}
                  />
                );
              })}

              <MonthlyWallCalendar
                selectedDateKey={selectedMealDateKey}
                onSelectDate={setSelectedMealDateKey}
                categories={categories}
                segmentsByDate={segmentsByDate}
              />

              <ShoppingListPanel />
            </section>
          ) : activeTabDefinition.contentKind === "meal-creator" ? (
            <section className="flex flex-1 flex-col gap-5">
              <MealCreator />
            </section>
          ) : activeTabDefinition.contentKind === "settings" ? (
            <Settings />
          ) : (
            <section className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-app-border bg-app-surface/70 px-6 py-16 text-center">
              <div className="max-w-md">
                <h2 className="text-2xl font-semibold tracking-tight">Coming soon</h2>
              </div>
            </section>
          )}
        </section>

        {isDayPlannerTab ? (
          <section className="fixed inset-x-0 bottom-0 z-50 px-4 pb-4 lg:px-6 lg:pb-5">
            <div className="mx-auto flex w-full max-w-[96rem] flex-col gap-4 rounded-lg border border-app-border bg-app-surface/95 p-4 shadow-card backdrop-blur">
              <div className="flex items-center justify-end">
                <PlannerHistoryControls
                  canUndo={canUndoPlannerEdit}
                  canRedo={canRedoPlannerEdit}
                  onUndo={undoPlannerEdit}
                  onRedo={redoPlannerEdit}
                />
              </div>

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
                    dateKey={selectedDateKey}
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
                    onClearTimeline={() => handleClearTimeline(selectedDateKey, selectedDateTitle)}
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

        {isMealPlannerTab && (selectedMealDateKey || selectedEatSegment) ? (
          <section className="fixed inset-x-0 bottom-0 z-50 px-4 pb-4 lg:px-6 lg:pb-5">
            <div className="mx-auto flex w-full max-w-[96rem] flex-col gap-4 rounded-lg border border-app-border bg-app-surface/95 p-4 shadow-card backdrop-blur">
              {selectedMealDateKey ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-app-muted">
                      Viewing {selectedMealDateTitle}
                    </p>
                    <button
                      type="button"
                      onClick={() => setSelectedMealDateKey(null)}
                      className="rounded-md border border-app-border px-2 py-1 text-xs font-medium text-app-muted transition hover:border-app-text hover:text-app-text"
                      aria-label="Close selected date meal view"
                    >
                      Close
                    </button>
                  </div>

                  <MealTimelineTrack
                    title={selectedMealDateTitle}
                    categories={categories}
                    segments={selectedMealDateSegments}
                    meals={meals}
                    onEatSegmentClick={(segment) => handleMealEatSegmentClick(selectedMealDateKey, segment)}
                  />
                </div>
              ) : null}

              {selectedEatSegment ? (
                <MealAssignmentPanel
                  contextLabel={selectedEatSegmentLabel}
                  meals={meals}
                  selectedMealIds={pendingMealIds}
                  onToggleMeal={handleToggleAssignedMeal}
                  onSubmit={handleSubmitMealAssignment}
                  onClose={handleCloseMealAssignment}
                />
              ) : null}
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
