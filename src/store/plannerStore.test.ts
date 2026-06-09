import { beforeEach, describe, expect, it } from "vitest";
import { usePlannerStore } from "./plannerStore";

const DATE_A = "2026-06-09";
const DATE_B = "2026-06-10";

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
    expect(state.segmentsByDate).toEqual({});
  });

  it("adds a category into the first hour", () => {
    usePlannerStore.getState().addCategoryForDate(DATE_A, "work", 0, 4);

    const segments = usePlannerStore.getState().segmentsByDate[DATE_A] ?? [];
    expect(segments).toHaveLength(1);
    expect(segments[0]).toMatchObject({
      categoryId: "work",
      startSlot: 0,
      endSlot: 4
    });
  });

  it("overwrites overlapping first-hour segment while preserving trailing time", () => {
    usePlannerStore.getState().setSegmentsForDate(DATE_A, [
      { id: "a", categoryId: "sleep", startSlot: 0, endSlot: 8 }
    ]);

    usePlannerStore.getState().addCategoryForDate(DATE_A, "eat", 0, 4);

    const segments = usePlannerStore.getState().segmentsByDate[DATE_A] ?? [];
    expect(segments).toHaveLength(2);
    expect(segments[0]).toMatchObject({ categoryId: "eat", startSlot: 0, endSlot: 4 });
    expect(segments[1]).toMatchObject({ categoryId: "sleep", startSlot: 4, endSlot: 8 });
  });

  it("clears and resets planner state", () => {
    const store = usePlannerStore.getState();
    store.addCategoryForDate(DATE_A, "play", 0, 4);
    store.clearSegmentsForDate(DATE_A);

    expect(usePlannerStore.getState().segmentsByDate[DATE_A]).toEqual([]);

    store.setSegmentsForDate(DATE_A, [{ id: "x", categoryId: "travel", startSlot: 12, endSlot: 16 }]);
    store.resetPlanner();

    const reset = usePlannerStore.getState();
    expect(reset.segmentsByDate).toEqual({});
    expect(reset.categories).toHaveLength(5);
  });

  it("adds a category for an arbitrary slot range", () => {
    usePlannerStore.getState().addCategoryForDate(DATE_A, "travel", 12, 20);

    const segments = usePlannerStore.getState().segmentsByDate[DATE_A] ?? [];
    expect(segments).toHaveLength(1);
    expect(segments[0]).toMatchObject({
      categoryId: "travel",
      startSlot: 12,
      endSlot: 20
    });
  });

  it("ignores invalid ranges where end is not after start", () => {
    usePlannerStore.getState().addCategoryForDate(DATE_A, "work", 10, 10);
    usePlannerStore.getState().addCategoryForDate(DATE_A, "work", 14, 8);

    expect(usePlannerStore.getState().segmentsByDate[DATE_A]).toEqual(undefined);
  });

  it("moves a segment to a snapped start slot while preserving duration", () => {
    usePlannerStore.getState().setSegmentsForDate(DATE_A, [
      { id: "a", categoryId: "work", startSlot: 4, endSlot: 8 }
    ]);

    usePlannerStore.getState().moveSegmentForDate(DATE_A, "a", 20);

    const moved = usePlannerStore.getState().segmentsByDate[DATE_A] ?? [];
    expect(moved).toHaveLength(1);
    expect(moved[0]).toMatchObject({ id: "a", startSlot: 20, endSlot: 24 });
  });

  it("resizes a segment to a new range via store action", () => {
    usePlannerStore.getState().setSegmentsForDate(DATE_A, [
      { id: "a", categoryId: "work", startSlot: 4, endSlot: 8 }
    ]);

    usePlannerStore.getState().resizeSegmentForDate(DATE_A, "a", 4, 16);

    const resized = usePlannerStore.getState().segmentsByDate[DATE_A] ?? [];
    expect(resized).toHaveLength(1);
    expect(resized[0]).toMatchObject({ id: "a", startSlot: 4, endSlot: 16 });
  });

  it("deletes a segment from the selected day only", () => {
    const store = usePlannerStore.getState();
    store.setSegmentsForDate(DATE_A, [
      { id: "today-a", categoryId: "work", startSlot: 4, endSlot: 8 }
    ]);
    store.setSegmentsForDate(DATE_B, [
      { id: "tomorrow-a", categoryId: "play", startSlot: 8, endSlot: 12 }
    ]);

    store.deleteSegmentForDate(DATE_A, "today-a");

    const state = usePlannerStore.getState();
    expect(state.segmentsByDate[DATE_A]).toEqual([]);
    expect(state.segmentsByDate[DATE_B]).toHaveLength(1);
    expect(state.segmentsByDate[DATE_B][0]).toMatchObject({ id: "tomorrow-a" });
  });

  it("keeps segment collections independent across date keys", () => {
    const store = usePlannerStore.getState();
    store.addCategoryForDate(DATE_A, "work", 0, 4);
    store.addCategoryForDate(DATE_B, "play", 8, 12);

    const state = usePlannerStore.getState();
    expect(state.segmentsByDate[DATE_A]).toHaveLength(1);
    expect(state.segmentsByDate[DATE_A][0]).toMatchObject({ categoryId: "work", startSlot: 0, endSlot: 4 });
    expect(state.segmentsByDate[DATE_B]).toHaveLength(1);
    expect(state.segmentsByDate[DATE_B][0]).toMatchObject({ categoryId: "play", startSlot: 8, endSlot: 12 });
  });

  it("pastes copied segments into a target day using overwrite merge", () => {
    const store = usePlannerStore.getState();
    store.setSegmentsForDate(DATE_A, [
      { id: "a", categoryId: "sleep", startSlot: 0, endSlot: 8 }
    ]);

    store.pasteSegmentsForDate(DATE_A, [
      { id: "copy-a", categoryId: "work", startSlot: 4, endSlot: 12 }
    ]);

    const forDate = usePlannerStore.getState().segmentsByDate[DATE_A] ?? [];
    expect(forDate).toHaveLength(2);
    expect(forDate[0]).toMatchObject({ categoryId: "sleep", startSlot: 0, endSlot: 4 });
    expect(forDate[1]).toMatchObject({ categoryId: "work", startSlot: 4, endSlot: 12 });
    expect(forDate[1].id).not.toBe("copy-a");
  });

  it("pastes into one day without mutating the other", () => {
    const store = usePlannerStore.getState();
    store.setSegmentsForDate(DATE_A, [{ id: "today-a", categoryId: "sleep", startSlot: 0, endSlot: 8 }]);
    store.setSegmentsForDate(DATE_B, [{ id: "tomorrow-a", categoryId: "play", startSlot: 8, endSlot: 12 }]);

    store.pasteSegmentsForDate(DATE_B, [
      { id: "copy-a", categoryId: "work", startSlot: 0, endSlot: 4 }
    ]);

    const state = usePlannerStore.getState();
    expect(state.segmentsByDate[DATE_A]).toHaveLength(1);
    expect(state.segmentsByDate[DATE_A][0]).toMatchObject({ id: "today-a" });
    expect(state.segmentsByDate[DATE_B]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ categoryId: "work", startSlot: 0, endSlot: 4 }),
        expect.objectContaining({ id: "tomorrow-a", categoryId: "play", startSlot: 8, endSlot: 12 })
      ])
    );
  });
});
