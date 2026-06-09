import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { applySegmentOverwrite, createSegment, moveSegment, pasteSegmentsWithOverwrite, resizeSegment } from "../lib/plannerSegments";
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
 * Persisted planner data for the current single-day editor.
 */
type PlannerState = {
  categories: PlannerCategory[];
  segmentsByDate: PlannerSegmentsByDate;
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
  resetPlanner: () => void;
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
  segmentsByDate: {}
};

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
        set((state) => ({
          segmentsByDate: {
            ...state.segmentsByDate,
            [dateKey]: segments
          }
        })),
      addCategoryForDate: (dateKey, categoryId, startSlot, endSlot) =>
        set((state) => ({
          segmentsByDate:
            endSlot <= startSlot
              ? state.segmentsByDate
              : {
                  ...state.segmentsByDate,
                  [dateKey]: applySegmentOverwrite(
                    segmentsForDate(state, dateKey),
                    createSegment(categoryId, startSlot, endSlot)
                  )
                }
        })),
      moveSegmentForDate: (dateKey, segmentId, nextStartSlot) =>
        set((state) => ({
          segmentsByDate: {
            ...state.segmentsByDate,
            [dateKey]: moveSegment(segmentsForDate(state, dateKey), segmentId, nextStartSlot, TOTAL_DAY_SLOTS)
          }
        })),
      resizeSegmentForDate: (dateKey, segmentId, nextStartSlot, nextEndSlot) =>
        set((state) => ({
          segmentsByDate: {
            ...state.segmentsByDate,
            [dateKey]: resizeSegment(segmentsForDate(state, dateKey), segmentId, nextStartSlot, nextEndSlot, TOTAL_DAY_SLOTS)
          }
        })),
      deleteSegmentForDate: (dateKey, segmentId) =>
        set((state) => ({
          segmentsByDate: {
            ...state.segmentsByDate,
            [dateKey]: segmentsForDate(state, dateKey).filter((segment) => segment.id !== segmentId)
          }
        })),
      pasteSegmentsForDate: (dateKey, copiedSegments) =>
        set((state) => ({
          segmentsByDate: {
            ...state.segmentsByDate,
            [dateKey]: pasteSegmentsWithOverwrite(segmentsForDate(state, dateKey), copiedSegments)
          }
        })),
      clearSegmentsForDate: (dateKey) =>
        set((state) => ({
          segmentsByDate: {
            ...state.segmentsByDate,
            [dateKey]: []
          }
        })),
      resetPlanner: () => set({ ...initialState })
    }),
    {
      name: "sp9000-planner-state",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        categories: state.categories,
        segmentsByDate: state.segmentsByDate
      })
    }
  )
);
