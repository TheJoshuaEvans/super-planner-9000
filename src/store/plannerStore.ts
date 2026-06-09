import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { applySegmentOverwrite, createSegment, moveSegment, pasteSegmentsWithOverwrite, resizeSegment } from "../lib/plannerSegments";
import {
  createPlannerHistoryStacks,
  DEFAULT_HISTORY_LIMIT,
  recordPlannerHistory,
  redoPlannerHistory,
  undoPlannerHistory,
  type PlannerHistoryStacks
} from "../lib/plannerHistory";
import { TOTAL_DAY_SLOTS } from "../lib/timeline";

/**
 * Fixed category metadata used to label and color timeline segments.
 */
export type PlannerCategory = {
  id: string;
  label: string;
  color: string;
};

/**
 * A scheduled range on the day timeline, stored in quarter-hour slots.
 */
export type PlannerSegment = {
  id: string;
  categoryId: string;
  startSlot: number;
  endSlot: number;
};

export type PlannerDateKey = string;

/**
 * Per-date segment state map for the planner.
 */
export type PlannerSegmentsByDate = Record<PlannerDateKey, PlannerSegment[]>;

/**
 * Persisted planner data that should be exported/imported as a unit.
 */
export type PlannerPersistedData = {
  categories: PlannerCategory[];
  segmentsByDate: PlannerSegmentsByDate;
};

type PlannerHistoryState = PlannerHistoryStacks<PlannerPersistedData>;

/**
 * Persisted planner data for the current single-day editor.
 */
type PlannerState = PlannerPersistedData & {
  history: PlannerHistoryState;
  canUndo: boolean;
  canRedo: boolean;
};

/**
 * Planner state plus the actions exposed to the UI.
 */
type PlannerStore = PlannerState & {
  /**
    * Replaces the full segment list for a given calendar date.
   */
    setSegmentsForDate: (dateKey: PlannerDateKey, segments: PlannerSegment[]) => void;

  /**
    * Adds a category block over the given slot range for a date, overwriting overlaps.
   */
    addCategoryForDate: (dateKey: PlannerDateKey, categoryId: string, startSlot: number, endSlot: number) => void;

  /**
    * Moves an existing segment for a date while keeping its duration.
   */
    moveSegmentForDate: (dateKey: PlannerDateKey, segmentId: string, nextStartSlot: number) => void;

  /**
    * Resizes an existing segment for a date to a new slot range.
   */
    resizeSegmentForDate: (dateKey: PlannerDateKey, segmentId: string, nextStartSlot: number, nextEndSlot: number) => void;

  /**
    * Deletes a segment from the selected date timeline.
   */
    deleteSegmentForDate: (dateKey: PlannerDateKey, segmentId: string) => void;

  /**
    * Pastes copied segments into the selected date using overwrite merge rules.
   */
    pasteSegmentsForDate: (dateKey: PlannerDateKey, copiedSegments: PlannerSegment[]) => void;

  /**
    * Removes all scheduled segments for the selected date.
   */
    clearSegmentsForDate: (dateKey: PlannerDateKey) => void;

  /**
   * Restores the planner to its default categories and empty timeline.
   */
  replacePlannerData: (data: PlannerPersistedData) => void;

  /**
   * Restores the planner to its default categories and empty timeline.
   */
  resetPlanner: () => void;

  /**
   * Reverts the latest Day Planner edit action, if available.
   */
  undoPlannerEdit: () => void;

  /**
   * Re-applies the latest undone Day Planner edit action, if available.
   */
  redoPlannerEdit: () => void;
};

/**
 * Built-in categories for the first version of the planner.
 */
const defaultCategories: PlannerCategory[] = [
  { id: "sleep", label: "Sleep", color: "#7c3aed" },
  { id: "work", label: "Work", color: "#0f766e" },
  { id: "play", label: "Play", color: "#ea580c" },
  { id: "eat", label: "Eat", color: "#ca8a04" },
  { id: "travel", label: "Travel", color: "#2563eb" }
];

/**
 * Default persisted state used for first load and full resets.
 */
const initialState: PlannerState = {
  categories: defaultCategories,
  segmentsByDate: {},
  history: createPlannerHistoryStacks<PlannerPersistedData>(),
  canUndo: false,
  canRedo: false
};

function clonePersistedData(data: PlannerPersistedData): PlannerPersistedData {
  return {
    categories: data.categories.map((category) => ({ ...category })),
    segmentsByDate: Object.fromEntries(
      Object.entries(data.segmentsByDate).map(([dateKey, segments]) => [
        dateKey,
        segments.map((segment) => ({ ...segment }))
      ])
    )
  };
}

function toPersistedData(state: PlannerState): PlannerPersistedData {
  return {
    categories: state.categories,
    segmentsByDate: state.segmentsByDate
  };
}

function arePersistedDataEqual(left: PlannerPersistedData, right: PlannerPersistedData): boolean {
  if (left.categories.length !== right.categories.length) {
    return false;
  }

  for (let index = 0; index < left.categories.length; index += 1) {
    const leftCategory = left.categories[index];
    const rightCategory = right.categories[index];

    if (
      leftCategory.id !== rightCategory.id ||
      leftCategory.label !== rightCategory.label ||
      leftCategory.color !== rightCategory.color
    ) {
      return false;
    }
  }

  const leftDateKeys = Object.keys(left.segmentsByDate).sort();
  const rightDateKeys = Object.keys(right.segmentsByDate).sort();

  if (leftDateKeys.length !== rightDateKeys.length) {
    return false;
  }

  for (let index = 0; index < leftDateKeys.length; index += 1) {
    if (leftDateKeys[index] !== rightDateKeys[index]) {
      return false;
    }

    const dateKey = leftDateKeys[index];
    const leftSegments = left.segmentsByDate[dateKey] ?? [];
    const rightSegments = right.segmentsByDate[dateKey] ?? [];

    if (leftSegments.length !== rightSegments.length) {
      return false;
    }

    for (let segmentIndex = 0; segmentIndex < leftSegments.length; segmentIndex += 1) {
      const leftSegment = leftSegments[segmentIndex];
      const rightSegment = rightSegments[segmentIndex];

      if (
        leftSegment.id !== rightSegment.id ||
        leftSegment.categoryId !== rightSegment.categoryId ||
        leftSegment.startSlot !== rightSegment.startSlot ||
        leftSegment.endSlot !== rightSegment.endSlot
      ) {
        return false;
      }
    }
  }

  return true;
}

function withHistoryFlags(history: PlannerHistoryState): Pick<PlannerState, "history" | "canUndo" | "canRedo"> {
  return {
    history,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0
  };
}

function applyTimelineEdit(
  state: PlannerState,
  nextSegmentsByDate: PlannerSegmentsByDate
): PlannerState {
  const current = toPersistedData(state);
  const next: PlannerPersistedData = {
    categories: state.categories,
    segmentsByDate: nextSegmentsByDate
  };

  const result = recordPlannerHistory({
    current,
    next,
    history: state.history,
    clone: clonePersistedData,
    equals: arePersistedDataEqual,
    limit: DEFAULT_HISTORY_LIMIT
  });

  if (!result.changed) {
    return state;
  }

  return {
    ...state,
    categories: result.present.categories,
    segmentsByDate: result.present.segmentsByDate,
    ...withHistoryFlags(result.history)
  };
}

function rebaseHistory(state: PlannerState, next: PlannerPersistedData): PlannerState {
  return {
    ...state,
    categories: clonePersistedData(next).categories,
    segmentsByDate: clonePersistedData(next).segmentsByDate,
    ...withHistoryFlags(createPlannerHistoryStacks<PlannerPersistedData>())
  };
}

/**
 * Returns the existing segment array for a date key or an empty list.
 */
function segmentsForDate(state: PlannerState, dateKey: PlannerDateKey): PlannerSegment[] {
  return state.segmentsByDate[dateKey] ?? [];
}

/**
 * Local persisted Zustand store for the current planner editor.
 */
export const usePlannerStore = create<PlannerStore>()(
  persist(
    (set) => ({
      ...initialState,
      setSegmentsForDate: (dateKey, segments) =>
        set((state) =>
          applyTimelineEdit(state, {
            ...state.segmentsByDate,
            [dateKey]: segments
          })
        ),
      addCategoryForDate: (dateKey, categoryId, startSlot, endSlot) =>
        set((state) =>
          applyTimelineEdit(
            state,
            endSlot <= startSlot
              ? state.segmentsByDate
              : {
                  ...state.segmentsByDate,
                  [dateKey]: applySegmentOverwrite(
                    segmentsForDate(state, dateKey),
                    createSegment(categoryId, startSlot, endSlot)
                  )
                }
          )
        ),
      moveSegmentForDate: (dateKey, segmentId, nextStartSlot) =>
        set((state) =>
          applyTimelineEdit(state, {
            ...state.segmentsByDate,
            [dateKey]: moveSegment(segmentsForDate(state, dateKey), segmentId, nextStartSlot, TOTAL_DAY_SLOTS)
          })
        ),
      resizeSegmentForDate: (dateKey, segmentId, nextStartSlot, nextEndSlot) =>
        set((state) =>
          applyTimelineEdit(state, {
            ...state.segmentsByDate,
            [dateKey]: resizeSegment(segmentsForDate(state, dateKey), segmentId, nextStartSlot, nextEndSlot, TOTAL_DAY_SLOTS)
          })
        ),
      deleteSegmentForDate: (dateKey, segmentId) =>
        set((state) =>
          applyTimelineEdit(state, {
            ...state.segmentsByDate,
            [dateKey]: segmentsForDate(state, dateKey).filter((segment) => segment.id !== segmentId)
          })
        ),
      pasteSegmentsForDate: (dateKey, copiedSegments) =>
        set((state) =>
          applyTimelineEdit(state, {
            ...state.segmentsByDate,
            [dateKey]: pasteSegmentsWithOverwrite(segmentsForDate(state, dateKey), copiedSegments)
          })
        ),
      clearSegmentsForDate: (dateKey) =>
        set((state) =>
          applyTimelineEdit(state, {
            ...state.segmentsByDate,
            [dateKey]: []
          })
        ),
      replacePlannerData: (data) =>
        set((state) => rebaseHistory(state, data)),
      resetPlanner: () => set((state) => rebaseHistory(state, initialState)),
      undoPlannerEdit: () =>
        set((state) => {
          const result = undoPlannerHistory({
            current: toPersistedData(state),
            history: state.history,
            clone: clonePersistedData,
            limit: DEFAULT_HISTORY_LIMIT
          });

          if (!result.changed) {
            return state;
          }

          return {
            ...state,
            categories: result.present.categories,
            segmentsByDate: result.present.segmentsByDate,
            ...withHistoryFlags(result.history)
          };
        }),
      redoPlannerEdit: () =>
        set((state) => {
          const result = redoPlannerHistory({
            current: toPersistedData(state),
            history: state.history,
            clone: clonePersistedData,
            limit: DEFAULT_HISTORY_LIMIT
          });

          if (!result.changed) {
            return state;
          }

          return {
            ...state,
            categories: result.present.categories,
            segmentsByDate: result.present.segmentsByDate,
            ...withHistoryFlags(result.history)
          };
        })
    }),
    {
      name: "sp9000-planner-state",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        categories: state.categories,
        segmentsByDate: state.segmentsByDate,
        history: state.history,
        canUndo: state.canUndo,
        canRedo: state.canRedo
      })
    }
  )
);
