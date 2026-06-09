import { describe, expect, it } from "vitest";
import {
  applyTimelineEdit,
  rebaseHistory,
  redoTimelineEdit,
  undoTimelineEdit,
  withHistoryFlags
} from "./plannerStoreHistory";
import type { PlannerPersistedData, PlannerState } from "./plannerStore.types";

function buildState(overrides?: Partial<PlannerState>): PlannerState {
  return {
    categories: [{ id: "work", label: "Work", color: "#0f766e" }],
    segmentsByDate: {
      "2026-06-09": [{ id: "seg-1", categoryId: "work", startSlot: 8, endSlot: 12 }]
    },
    history: { past: [], future: [] },
    canUndo: false,
    canRedo: false,
    ...overrides
  };
}

describe("plannerStoreHistory", () => {
  it("derives history flags from stack lengths", () => {
    const persisted: PlannerPersistedData = {
      categories: [{ id: "work", label: "Work", color: "#0f766e" }],
      segmentsByDate: {}
    };

    expect(withHistoryFlags({ past: [persisted], future: [] }).canUndo).toBe(true);
    expect(withHistoryFlags({ past: [], future: [persisted] }).canRedo).toBe(true);
  });

  it("records history when timeline edits change segments", () => {
    const state = buildState();
    const next = applyTimelineEdit(state, {
      ...state.segmentsByDate,
      "2026-06-09": [{ id: "seg-2", categoryId: "work", startSlot: 10, endSlot: 14 }]
    });

    expect(next).not.toBe(state);
    expect(next.history.past).toHaveLength(1);
    expect(next.canUndo).toBe(true);
    expect(next.canRedo).toBe(false);
  });

  it("returns original state when timeline edits are no-ops", () => {
    const state = buildState();
    const next = applyTimelineEdit(state, state.segmentsByDate);

    expect(next).toBe(state);
  });

  it("rebases persisted data and clears history", () => {
    const state = buildState({
      history: { past: [buildState()], future: [buildState()] },
      canUndo: true,
      canRedo: true
    });
    const replacement: PlannerPersistedData = {
      categories: [{ id: "custom", label: "Custom", color: "#111111" }],
      segmentsByDate: { "2026-06-10": [{ id: "custom-1", categoryId: "custom", startSlot: 2, endSlot: 6 }] }
    };

    const rebased = rebaseHistory(state, replacement);

    expect(rebased.categories).toEqual(replacement.categories);
    expect(rebased.segmentsByDate).toEqual(replacement.segmentsByDate);
    expect(rebased.history.past).toEqual([]);
    expect(rebased.history.future).toEqual([]);
    expect(rebased.canUndo).toBe(false);
    expect(rebased.canRedo).toBe(false);
  });

  it("applies undo and redo transitions", () => {
    const previous: PlannerPersistedData = {
      categories: [{ id: "work", label: "Work", color: "#0f766e" }],
      segmentsByDate: {}
    };
    const current: PlannerPersistedData = {
      categories: [{ id: "work", label: "Work", color: "#0f766e" }],
      segmentsByDate: {
        "2026-06-09": [{ id: "seg-1", categoryId: "work", startSlot: 8, endSlot: 12 }]
      }
    };

    const state = buildState({
      ...current,
      history: { past: [previous], future: [] },
      canUndo: true,
      canRedo: false
    });

    const undone = undoTimelineEdit(state);
    expect(undone.segmentsByDate).toEqual(previous.segmentsByDate);
    expect(undone.canRedo).toBe(true);

    const redone = redoTimelineEdit(undone);
    expect(redone.segmentsByDate).toEqual(current.segmentsByDate);
    expect(redone.canUndo).toBe(true);
  });
});
