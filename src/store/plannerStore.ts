import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { applySegmentOverwrite, createSegment, moveSegment, pasteSegmentsWithOverwrite, resizeSegment } from "../lib/plannerSegments";
import { TOTAL_DAY_SLOTS } from "../lib/timeline";
import { segmentsForDate } from "./plannerStoreData";
import {
  applyTimelineEdit,
  rebaseHistory,
  redoTimelineEdit,
  undoTimelineEdit
} from "./plannerStoreHistory";
import type {
  PlannerCategory,
  PlannerStore,
  PlannerState
} from "./plannerStore.types";

export type {
  PlannerCategory,
  PlannerDateKey,
  PlannerPersistedData,
  PlannerSegment,
  PlannerSegmentsByDate
} from "./plannerStore.types";

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
  history: {
    past: [],
    future: []
  },
  canUndo: false,
  canRedo: false
};

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
      undoPlannerEdit: () => set((state) => undoTimelineEdit(state)),
      redoPlannerEdit: () => set((state) => redoTimelineEdit(state))
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
