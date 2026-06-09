import {
  createPlannerHistoryStacks,
  DEFAULT_HISTORY_LIMIT,
  recordPlannerHistory,
  redoPlannerHistory,
  undoPlannerHistory
} from "../lib/plannerHistory";
import {
  arePersistedDataEqual,
  clonePersistedData,
  toPersistedData
} from "./plannerStoreData";
import type {
  PlannerHistoryState,
  PlannerPersistedData,
  PlannerSegmentsByDate,
  PlannerState
} from "./plannerStore.types";

/**
 * Derives undo and redo flags from current history stacks.
 *
 * @param history - Current history stacks.
 * @returns History object plus derived canUndo and canRedo flags.
 */
export function withHistoryFlags(history: PlannerHistoryState): Pick<PlannerState, "history" | "canUndo" | "canRedo"> {
  return {
    history,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0
  };
}

/**
 * Applies a timeline edit and records history when persisted data changes.
 *
 * @param state - Current planner state.
 * @param nextSegmentsByDate - Proposed segment map after edit.
 * @returns Updated state, or original state if edit is a no-op.
 */
export function applyTimelineEdit(
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

/**
 * Replaces planner data and clears history, establishing a new baseline.
 *
 * @param state - Current planner state.
 * @param next - New persisted data baseline.
 * @returns Rebased planner state with empty undo/redo stacks.
 */
export function rebaseHistory(state: PlannerState, next: PlannerPersistedData): PlannerState {
  const cloned = clonePersistedData(next);

  return {
    ...state,
    categories: cloned.categories,
    segmentsByDate: cloned.segmentsByDate,
    ...withHistoryFlags(createPlannerHistoryStacks<PlannerPersistedData>())
  };
}

/**
 * Executes one undo step and updates derived history flags.
 *
 * @param state - Current planner state.
 * @returns Updated state after undo, or original state if undo unavailable.
 */
export function undoTimelineEdit(state: PlannerState): PlannerState {
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
}

/**
 * Executes one redo step and updates derived history flags.
 *
 * @param state - Current planner state.
 * @returns Updated state after redo, or original state if redo unavailable.
 */
export function redoTimelineEdit(state: PlannerState): PlannerState {
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
}
