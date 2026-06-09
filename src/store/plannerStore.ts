import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { applySegmentOverwrite, createSegment, moveSegment, resizeSegment } from "../lib/plannerSegments";
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

/**
 * Supported day buckets for the timeline editor.
 */
export type PlannerDayKey = "today" | "tomorrow";

/**
 * Per-day segment state map for the planner.
 */
export type PlannerSegmentsByDay = Record<PlannerDayKey, PlannerSegment[]>;

/**
 * Persisted planner data for the current single-day editor.
 */
type PlannerState = {
  categories: PlannerCategory[];
  segmentsByDay: PlannerSegmentsByDay;
};

/**
 * Planner state plus the actions exposed to the UI.
 */
type PlannerStore = PlannerState & {
  /**
    * Replaces the full segment list for a given day.
   */
    setSegments: (dayKey: PlannerDayKey, segments: PlannerSegment[]) => void;

  /**
    * Adds a category block over the given slot range for a day, overwriting any overlapping time.
   */
    addCategory: (dayKey: PlannerDayKey, categoryId: string, startSlot: number, endSlot: number) => void;

  /**
    * Moves an existing segment for a day to a new start slot while keeping its duration.
   */
    moveSegment: (dayKey: PlannerDayKey, segmentId: string, nextStartSlot: number) => void;

  /**
    * Resizes an existing segment for a day to a new slot range, enforcing a 15-minute minimum.
   */
    resizeSegment: (dayKey: PlannerDayKey, segmentId: string, nextStartSlot: number, nextEndSlot: number) => void;

  /**
    * Deletes a segment from the chosen day timeline.
   */
    deleteSegment: (dayKey: PlannerDayKey, segmentId: string) => void;

  /**
    * Removes all scheduled segments for the chosen day.
   */
    clearSegments: (dayKey: PlannerDayKey) => void;

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
  segmentsByDay: {
    today: [],
    tomorrow: []
  }
};

/**
 * Local persisted Zustand store for the current planner editor.
 */
export const usePlannerStore = create<PlannerStore>()(
  persist(
    (set) => ({
      ...initialState,
      setSegments: (dayKey, segments) =>
        set((state) => ({
          segmentsByDay: {
            ...state.segmentsByDay,
            [dayKey]: segments
          }
        })),
      addCategory: (dayKey, categoryId, startSlot, endSlot) =>
        set((state) => ({
          segmentsByDay:
            endSlot <= startSlot
              ? state.segmentsByDay
              : {
                  ...state.segmentsByDay,
                  [dayKey]: applySegmentOverwrite(
                    state.segmentsByDay[dayKey],
                    createSegment(categoryId, startSlot, endSlot)
                  )
                }
        })),
      moveSegment: (dayKey, segmentId, nextStartSlot) =>
        set((state) => ({
          segmentsByDay: {
            ...state.segmentsByDay,
            [dayKey]: moveSegment(state.segmentsByDay[dayKey], segmentId, nextStartSlot, TOTAL_DAY_SLOTS)
          }
        })),
      resizeSegment: (dayKey, segmentId, nextStartSlot, nextEndSlot) =>
        set((state) => ({
          segmentsByDay: {
            ...state.segmentsByDay,
            [dayKey]: resizeSegment(state.segmentsByDay[dayKey], segmentId, nextStartSlot, nextEndSlot, TOTAL_DAY_SLOTS)
          }
        })),
      deleteSegment: (dayKey, segmentId) =>
        set((state) => ({
          segmentsByDay: {
            ...state.segmentsByDay,
            [dayKey]: state.segmentsByDay[dayKey].filter((segment) => segment.id !== segmentId)
          }
        })),
      clearSegments: (dayKey) =>
        set((state) => ({
          segmentsByDay: {
            ...state.segmentsByDay,
            [dayKey]: []
          }
        })),
      resetPlanner: () => set({ ...initialState })
    }),
    {
      name: "sp9000-planner-state",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        categories: state.categories,
        segmentsByDay: state.segmentsByDay
      })
    }
  )
);
