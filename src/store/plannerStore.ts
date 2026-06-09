import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { createSegment, applySegmentOverwrite } from "../lib/plannerSegments";
import { DEFAULT_SEGMENT_DURATION_SLOTS } from "../lib/timeline";

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
 * Persisted planner data for the current single-day editor.
 */
type PlannerState = {
  categories: PlannerCategory[];
  segments: PlannerSegment[];
};

/**
 * Planner state plus the actions exposed to the UI.
 */
type PlannerStore = PlannerState & {
  /**
   * Replaces the full segment list.
   */
  setSegments: (segments: PlannerSegment[]) => void;

  /**
   * Places a category block into the first hour, overwriting any existing time there.
   */
  addCategoryToFirstHour: (categoryId: string) => void;

  /**
   * Removes all scheduled segments from the day.
   */
  clearSegments: () => void;

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
  segments: []
};

/**
 * Local persisted Zustand store for the current planner editor.
 */
export const usePlannerStore = create<PlannerStore>()(
  persist(
    (set) => ({
      ...initialState,
      setSegments: (segments) => set({ segments }),
      addCategoryToFirstHour: (categoryId) =>
        set((state) => ({
          segments: applySegmentOverwrite(
            state.segments,
            createSegment(categoryId, 0, DEFAULT_SEGMENT_DURATION_SLOTS)
          )
        })),
      clearSegments: () => set({ segments: [] }),
      resetPlanner: () => set({ ...initialState })
    }),
    {
      name: "sp9000-planner-state",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        categories: state.categories,
        segments: state.segments
      })
    }
  )
);
