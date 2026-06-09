import { describe, expect, it } from "vitest";
import {
  createPlannerHistoryStacks,
  recordPlannerHistory,
  redoPlannerHistory,
  undoPlannerHistory,
  type PlannerHistoryStacks
} from "./plannerHistory";

type Snapshot = {
  value: number;
};

function cloneSnapshot(snapshot: Snapshot): Snapshot {
  return { ...snapshot };
}

function isSnapshotEqual(left: Snapshot, right: Snapshot): boolean {
  return left.value === right.value;
}

describe("plannerHistory", () => {
  it("records a new snapshot and clears redo history", () => {
    const history: PlannerHistoryStacks<Snapshot> = {
      past: [{ value: 1 }],
      future: [{ value: 4 }]
    };

    const result = recordPlannerHistory({
      current: { value: 2 },
      next: { value: 3 },
      history,
      clone: cloneSnapshot,
      equals: isSnapshotEqual,
      limit: 10
    });

    expect(result.changed).toBe(true);
    expect(result.present).toEqual({ value: 3 });
    expect(result.history.past).toEqual([{ value: 1 }, { value: 2 }]);
    expect(result.history.future).toEqual([]);
  });

  it("does not record when next equals current", () => {
    const history = createPlannerHistoryStacks<Snapshot>();

    const result = recordPlannerHistory({
      current: { value: 2 },
      next: { value: 2 },
      history,
      clone: cloneSnapshot,
      equals: isSnapshotEqual,
      limit: 10
    });

    expect(result.changed).toBe(false);
    expect(result.history).toBe(history);
    expect(result.present).toEqual({ value: 2 });
  });

  it("undoes and redoes snapshots", () => {
    const undoResult = undoPlannerHistory({
      current: { value: 3 },
      history: {
        past: [{ value: 1 }, { value: 2 }],
        future: []
      },
      clone: cloneSnapshot,
      limit: 10
    });

    expect(undoResult.changed).toBe(true);
    expect(undoResult.present).toEqual({ value: 2 });
    expect(undoResult.history.past).toEqual([{ value: 1 }]);
    expect(undoResult.history.future).toEqual([{ value: 3 }]);

    const redoResult = redoPlannerHistory({
      current: undoResult.present,
      history: undoResult.history,
      clone: cloneSnapshot,
      limit: 10
    });

    expect(redoResult.changed).toBe(true);
    expect(redoResult.present).toEqual({ value: 3 });
    expect(redoResult.history.past).toEqual([{ value: 1 }, { value: 2 }]);
    expect(redoResult.history.future).toEqual([]);
  });

  it("caps past history to the configured limit", () => {
    let history = createPlannerHistoryStacks<Snapshot>();
    let current = { value: 0 };

    for (let nextValue = 1; nextValue <= 5; nextValue += 1) {
      const result = recordPlannerHistory({
        current,
        next: { value: nextValue },
        history,
        clone: cloneSnapshot,
        equals: isSnapshotEqual,
        limit: 3
      });

      history = result.history;
      current = result.present;
    }

    expect(history.past).toEqual([{ value: 2 }, { value: 3 }, { value: 4 }]);
    expect(current).toEqual({ value: 5 });
  });
});
