import { describe, expect, it } from "vitest";
import {
  arePersistedDataEqual,
  clonePersistedData,
  segmentsForDate,
  toPersistedData
} from "./plannerStoreData";
import type { PlannerPersistedData, PlannerState } from "./plannerStore.types";

function buildPersistedData(): PlannerPersistedData {
  return {
    categories: [{ id: "work", label: "Work", color: "#0f766e" }],
    segmentsByDate: {
      "2026-06-09": [{ id: "seg-1", categoryId: "work", startSlot: 8, endSlot: 12 }]
    }
  };
}

describe("plannerStoreData", () => {
  it("creates a deep clone of persisted data", () => {
    const original = buildPersistedData();
    const cloned = clonePersistedData(original);

    expect(cloned).toEqual(original);
    expect(cloned).not.toBe(original);
    expect(cloned.categories).not.toBe(original.categories);
    expect(cloned.segmentsByDate["2026-06-09"]).not.toBe(original.segmentsByDate["2026-06-09"]);
  });

  it("extracts persisted fields from planner state", () => {
    const persisted = buildPersistedData();
    const state = {
      ...persisted,
      history: { past: [], future: [] },
      canUndo: false,
      canRedo: false
    } satisfies PlannerState;

    expect(toPersistedData(state)).toEqual(persisted);
  });

  it("compares persisted data values deeply", () => {
    const left = buildPersistedData();
    const right = buildPersistedData();

    expect(arePersistedDataEqual(left, right)).toBe(true);

    right.segmentsByDate["2026-06-09"][0] = {
      ...right.segmentsByDate["2026-06-09"][0],
      endSlot: 13
    };

    expect(arePersistedDataEqual(left, right)).toBe(false);
  });

  it("returns date segments or an empty list", () => {
    const state = {
      ...buildPersistedData(),
      history: { past: [], future: [] },
      canUndo: false,
      canRedo: false
    } satisfies PlannerState;

    expect(segmentsForDate(state, "2026-06-09")).toHaveLength(1);
    expect(segmentsForDate(state, "2026-06-10")).toEqual([]);
  });
});
