import { beforeEach, describe, expect, it } from "vitest";
import { usePlannerStore } from "./plannerStore";

describe("plannerStore", () => {
  beforeEach(() => {
    localStorage.clear();
    usePlannerStore.getState().resetPlanner();
  });

  it("starts with default categories and no segments", () => {
    const state = usePlannerStore.getState();

    expect(state.categories.map((category) => category.id)).toEqual([
      "sleep",
      "work",
      "play",
      "eat",
      "travel"
    ]);
    expect(state.segments).toEqual([]);
  });

  it("adds a category into the first hour", () => {
    usePlannerStore.getState().addCategoryToFirstHour("work");

    const segments = usePlannerStore.getState().segments;
    expect(segments).toHaveLength(1);
    expect(segments[0]).toMatchObject({
      categoryId: "work",
      startSlot: 0,
      endSlot: 4
    });
  });

  it("overwrites overlapping first-hour segment while preserving trailing time", () => {
    usePlannerStore.getState().setSegments([
      { id: "a", categoryId: "sleep", startSlot: 0, endSlot: 8 }
    ]);

    usePlannerStore.getState().addCategoryToFirstHour("eat");

    const segments = usePlannerStore.getState().segments;
    expect(segments).toHaveLength(2);
    expect(segments[0]).toMatchObject({ categoryId: "eat", startSlot: 0, endSlot: 4 });
    expect(segments[1]).toMatchObject({ categoryId: "sleep", startSlot: 4, endSlot: 8 });
  });

  it("clears and resets planner state", () => {
    const store = usePlannerStore.getState();
    store.addCategoryToFirstHour("play");
    store.clearSegments();

    expect(usePlannerStore.getState().segments).toEqual([]);

    store.setSegments([{ id: "x", categoryId: "travel", startSlot: 12, endSlot: 16 }]);
    store.resetPlanner();

    const reset = usePlannerStore.getState();
    expect(reset.segments).toEqual([]);
    expect(reset.categories).toHaveLength(5);
  });
});
