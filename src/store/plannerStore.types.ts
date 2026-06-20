import type { PlannerHistoryStacks } from "../lib/plannerHistory";

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
  /** Ids of meals assigned to this segment (used for "Eat" category segments). */
  assignedMealIds?: string[];
  /** Optional free-text note displayed on and below the block. */
  description?: string;
};

/** Calendar identity string in YYYY-MM-DD format. */
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

export type PlannerHistoryState = PlannerHistoryStacks<PlannerPersistedData>;

/**
 * Persisted planner data for the current single-day editor.
 */
export type PlannerState = PlannerPersistedData & {
  history: PlannerHistoryState;
  canUndo: boolean;
  canRedo: boolean;
};

/**
 * Planner state plus the actions exposed to the UI.
 */
export type PlannerStore = PlannerState & {
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
   * Moves an existing segment from one date's timeline to another, preserving its
   * duration and any additional data (e.g. assigned meals).
   */
  moveSegmentAcrossDates: (
    sourceDateKey: PlannerDateKey,
    segmentId: string,
    targetDateKey: PlannerDateKey,
    nextStartSlot: number
  ) => void;

  /**
   * Resizes an existing segment for a date to a new slot range.
   */
  resizeSegmentForDate: (dateKey: PlannerDateKey, segmentId: string, nextStartSlot: number, nextEndSlot: number) => void;

  /**
   * Deletes a segment from the selected date timeline.
   */
  deleteSegmentForDate: (dateKey: PlannerDateKey, segmentId: string) => void;

  /**
   * Sets the list of meal ids assigned to a segment on the given date.
   */
  setSegmentAssignedMealsForDate: (dateKey: PlannerDateKey, segmentId: string, mealIds: string[]) => void;

  /**
   * Sets the free-text description for a segment on the given date. Passing an
   * empty string removes the description.
   */
  setSegmentDescriptionForDate: (dateKey: PlannerDateKey, segmentId: string, description: string) => void;

  /**
   * Pastes copied segments into the selected date using overwrite merge rules.
   */
  pasteSegmentsForDate: (dateKey: PlannerDateKey, copiedSegments: PlannerSegment[]) => void;

  /**
   * Removes all scheduled segments for the selected date.
   */
  clearSegmentsForDate: (dateKey: PlannerDateKey) => void;

  /**
   * Adds a new category with the given label and color.
   */
  addCategory: (label: string, color: string) => void;

  /**
   * Updates an existing category's label and/or color.
   */
  updateCategory: (categoryId: string, updates: { label?: string; color?: string }) => void;

  /**
   * Removes a category (if not protected) and deletes any segments using it.
   */
  removeCategory: (categoryId: string) => void;

  /**
   * Replaces all persisted planner data and clears history.
   */
  replacePlannerData: (data: PlannerPersistedData) => void;

  /**
   * Restores the planner defaults and clears history.
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
