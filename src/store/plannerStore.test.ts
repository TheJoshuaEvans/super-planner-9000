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
    expect(state.segmentsByDay.today).toEqual([]);
    expect(state.segmentsByDay.tomorrow).toEqual([]);
  });

  it("adds a category into the first hour", () => {
    usePlannerStore.getState().addCategory("today", "work", 0, 4);

    const segments = usePlannerStore.getState().segmentsByDay.today;
    expect(segments).toHaveLength(1);
    expect(segments[0]).toMatchObject({
      categoryId: "work",
      startSlot: 0,
      endSlot: 4
    });
  });

  it("overwrites overlapping first-hour segment while preserving trailing time", () => {
    usePlannerStore.getState().setSegments("today", [
      { id: "a", categoryId: "sleep", startSlot: 0, endSlot: 8 }
    ]);

    usePlannerStore.getState().addCategory("today", "eat", 0, 4);

    const segments = usePlannerStore.getState().segmentsByDay.today;
    expect(segments).toHaveLength(2);
    expect(segments[0]).toMatchObject({ categoryId: "eat", startSlot: 0, endSlot: 4 });
    expect(segments[1]).toMatchObject({ categoryId: "sleep", startSlot: 4, endSlot: 8 });
  });

  it("clears and resets planner state", () => {
    const store = usePlannerStore.getState();
    store.addCategory("today", "play", 0, 4);
    store.clearSegments("today");

    expect(usePlannerStore.getState().segmentsByDay.today).toEqual([]);

    store.setSegments("today", [{ id: "x", categoryId: "travel", startSlot: 12, endSlot: 16 }]);
    store.resetPlanner();

    const reset = usePlannerStore.getState();
    expect(reset.segmentsByDay.today).toEqual([]);
    expect(reset.segmentsByDay.tomorrow).toEqual([]);
    expect(reset.categories).toHaveLength(5);
  });

  it("adds a category for an arbitrary slot range", () => {
    usePlannerStore.getState().addCategory("today", "travel", 12, 20);

    const segments = usePlannerStore.getState().segmentsByDay.today;
    expect(segments).toHaveLength(1);
    expect(segments[0]).toMatchObject({
      categoryId: "travel",
      startSlot: 12,
      endSlot: 20
    });
  });

  it("ignores invalid ranges where end is not after start", () => {
    usePlannerStore.getState().addCategory("today", "work", 10, 10);
    usePlannerStore.getState().addCategory("today", "work", 14, 8);

    expect(usePlannerStore.getState().segmentsByDay.today).toEqual([]);
  });

  it("moves a segment to a snapped start slot while preserving duration", () => {
    usePlannerStore.getState().setSegments("today", [
      { id: "a", categoryId: "work", startSlot: 4, endSlot: 8 }
    ]);

    usePlannerStore.getState().moveSegment("today", "a", 20);

    const moved = usePlannerStore.getState().segmentsByDay.today;
    expect(moved).toHaveLength(1);
    expect(moved[0]).toMatchObject({ id: "a", startSlot: 20, endSlot: 24 });
  });

  it("resizes a segment to a new range via store action", () => {
    usePlannerStore.getState().setSegments("today", [
      { id: "a", categoryId: "work", startSlot: 4, endSlot: 8 }
    ]);

    usePlannerStore.getState().resizeSegment("today", "a", 4, 16);

    const resized = usePlannerStore.getState().segmentsByDay.today;
    expect(resized).toHaveLength(1);
    expect(resized[0]).toMatchObject({ id: "a", startSlot: 4, endSlot: 16 });
  });

  it("deletes a segment from the selected day only", () => {
    const store = usePlannerStore.getState();
    store.setSegments("today", [
      { id: "today-a", categoryId: "work", startSlot: 4, endSlot: 8 }
    ]);
    store.setSegments("tomorrow", [
      { id: "tomorrow-a", categoryId: "play", startSlot: 8, endSlot: 12 }
    ]);

    store.deleteSegment("today", "today-a");

    const state = usePlannerStore.getState();
    expect(state.segmentsByDay.today).toEqual([]);
    expect(state.segmentsByDay.tomorrow).toHaveLength(1);
    expect(state.segmentsByDay.tomorrow[0]).toMatchObject({ id: "tomorrow-a" });
  });

  it("keeps today and tomorrow segment collections independent", () => {
    const store = usePlannerStore.getState();
    store.addCategory("today", "work", 0, 4);
    store.addCategory("tomorrow", "play", 8, 12);

    const state = usePlannerStore.getState();
    expect(state.segmentsByDay.today).toHaveLength(1);
    expect(state.segmentsByDay.today[0]).toMatchObject({ categoryId: "work", startSlot: 0, endSlot: 4 });
    expect(state.segmentsByDay.tomorrow).toHaveLength(1);
    expect(state.segmentsByDay.tomorrow[0]).toMatchObject({ categoryId: "play", startSlot: 8, endSlot: 12 });
  });
});
