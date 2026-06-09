export const DEFAULT_HISTORY_LIMIT = 100;

export type PlannerHistoryStacks<T> = {
  past: T[];
  future: T[];
};

type PlannerHistoryOptions<T> = {
  current: T;
  next: T;
  history: PlannerHistoryStacks<T>;
  clone: (value: T) => T;
  equals: (left: T, right: T) => boolean;
  limit?: number;
};

type PlannerHistoryStepOptions<T> = {
  current: T;
  history: PlannerHistoryStacks<T>;
  clone: (value: T) => T;
  limit?: number;
};

/**
 * Creates an empty pair of undo/redo history stacks.
 *
 * @returns A PlannerHistoryStacks instance with empty past and future arrays.
 */
export function createPlannerHistoryStacks<T>(): PlannerHistoryStacks<T> {
  return {
    past: [],
    future: []
  };
}

/**
 * Clamps a raw limit value to a positive integer, falling back to DEFAULT_HISTORY_LIMIT
 * when the value is absent, zero, or negative.
 *
 * @param limit - Raw limit value from caller options.
 * @returns A positive integer history cap.
 */
function clampHistoryLimit(limit: number | undefined): number {
  if (!limit || limit <= 0) {
    return DEFAULT_HISTORY_LIMIT;
  }

  return Math.floor(limit);
}

/**
 * Trims the oldest entries from a past stack to stay within the configured limit.
 *
 * @param past - Current past stack.
 * @param limit - Maximum allowed entries.
 * @returns The capped past stack, dropping the oldest entries first.
 */
function capPast<T>(past: T[], limit: number): T[] {
  if (past.length <= limit) {
    return past;
  }

  return past.slice(past.length - limit);
}

/**
 * Trims the oldest entries from a future (redo) stack to stay within the configured limit.
 *
 * @param future - Current future stack.
 * @param limit - Maximum allowed entries.
 * @returns The capped future stack, keeping only the most recent entries.
 */
function capFuture<T>(future: T[], limit: number): T[] {
  if (future.length <= limit) {
    return future;
  }

  return future.slice(0, limit);
}

/**
 * Records a new state snapshot in history when the next value differs from the current.
 * Clears the redo (future) stack on every successful record.
 * No-ops if current and next are equal according to the provided equals function.
 *
 * @param options.current - The state value before the edit.
 * @param options.next - The state value after the edit.
 * @param options.history - The existing history stacks.
 * @param options.clone - Function to produce an isolated copy of a state value.
 * @param options.equals - Function that returns true if two state values are equivalent.
 * @param options.limit - Optional cap on history stack size; defaults to DEFAULT_HISTORY_LIMIT.
 * @returns An object containing changed (whether a record was created), the new present value, and updated stacks.
 */
export function recordPlannerHistory<T>({
  current,
  next,
  history,
  clone,
  equals,
  limit
}: PlannerHistoryOptions<T>): { changed: boolean; present: T; history: PlannerHistoryStacks<T> } {
  if (equals(current, next)) {
    return {
      changed: false,
      present: current,
      history
    };
  }

  const resolvedLimit = clampHistoryLimit(limit);
  const nextPast = capPast([...history.past, clone(current)], resolvedLimit);

  return {
    changed: true,
    present: clone(next),
    history: {
      past: nextPast,
      future: []
    }
  };
}

/**
 * Moves one step backward through history, making the previous state the new present
 * and pushing the current state onto the redo stack.
 * No-ops when the past stack is empty.
 *
 * @param options.current - The current state value.
 * @param options.history - The existing history stacks.
 * @param options.clone - Function to produce an isolated copy of a state value.
 * @param options.limit - Optional cap on the resulting redo stack size.
 * @returns An object containing changed (whether the step was taken), the new present value, and updated stacks.
 */
export function undoPlannerHistory<T>({
  current,
  history,
  clone,
  limit
}: PlannerHistoryStepOptions<T>): { changed: boolean; present: T; history: PlannerHistoryStacks<T> } {
  if (history.past.length === 0) {
    return {
      changed: false,
      present: current,
      history
    };
  }

  const resolvedLimit = clampHistoryLimit(limit);
  const previous = history.past[history.past.length - 1];

  return {
    changed: true,
    present: clone(previous),
    history: {
      past: history.past.slice(0, -1),
      future: capFuture([clone(current), ...history.future], resolvedLimit)
    }
  };
}

/**
 * Moves one step forward through history, making the next future state the new present
 * and pushing the current state onto the past (undo) stack.
 * No-ops when the future stack is empty.
 *
 * @param options.current - The current state value.
 * @param options.history - The existing history stacks.
 * @param options.clone - Function to produce an isolated copy of a state value.
 * @param options.limit - Optional cap on the resulting past stack size.
 * @returns An object containing changed (whether the step was taken), the new present value, and updated stacks.
 */
export function redoPlannerHistory<T>({
  current,
  history,
  clone,
  limit
}: PlannerHistoryStepOptions<T>): { changed: boolean; present: T; history: PlannerHistoryStacks<T> } {
  if (history.future.length === 0) {
    return {
      changed: false,
      present: current,
      history
    };
  }

  const resolvedLimit = clampHistoryLimit(limit);
  const next = history.future[0];

  return {
    changed: true,
    present: clone(next),
    history: {
      past: capPast([...history.past, clone(current)], resolvedLimit),
      future: history.future.slice(1)
    }
  };
}

/**
 * Discards all history and establishes a fresh baseline from the provided state.
 * Used after wholesale data replacement (e.g. import) to prevent invalid undo traversal.
 *
 * @param next - The new baseline state value.
 * @param clone - Function to produce an isolated copy of the state value.
 * @returns An object with the cloned present and empty history stacks.
 */
export function rebasePlannerHistory<T>(next: T, clone: (value: T) => T): { present: T; history: PlannerHistoryStacks<T> } {
  return {
    present: clone(next),
    history: createPlannerHistoryStacks<T>()
  };
}
