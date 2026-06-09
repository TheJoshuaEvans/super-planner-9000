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

export function createPlannerHistoryStacks<T>(): PlannerHistoryStacks<T> {
  return {
    past: [],
    future: []
  };
}

function clampHistoryLimit(limit: number | undefined): number {
  if (!limit || limit <= 0) {
    return DEFAULT_HISTORY_LIMIT;
  }

  return Math.floor(limit);
}

function capPast<T>(past: T[], limit: number): T[] {
  if (past.length <= limit) {
    return past;
  }

  return past.slice(past.length - limit);
}

function capFuture<T>(future: T[], limit: number): T[] {
  if (future.length <= limit) {
    return future;
  }

  return future.slice(0, limit);
}

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

export function rebasePlannerHistory<T>(next: T, clone: (value: T) => T): { present: T; history: PlannerHistoryStacks<T> } {
  return {
    present: clone(next),
    history: createPlannerHistoryStacks<T>()
  };
}
