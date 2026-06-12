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

  it("replaces planner data wholesale", () => {
    const store = usePlannerStore.getState();
    store.addCategoryForDate(DATE_A, "play", 0, 4);
    store.addCategoryForDate(DATE_B, "travel", 8, 12);

    store.replacePlannerData({
      categories: [{ id: "custom", label: "Custom", color: "#111111" }],
      segmentsByDate: {
        "2026-06-11": [{ id: "replacement", categoryId: "custom", startSlot: 16, endSlot: 20 }]
      }
    });

    const state = usePlannerStore.getState();
    expect(state.categories).toEqual([{ id: "custom", label: "Custom", color: "#111111" }]);
    expect(state.segmentsByDate).toEqual({
      "2026-06-11": [{ id: "replacement", categoryId: "custom", startSlot: 16, endSlot: 20 }]
    });
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

  it("sets and clears assigned meal ids for a segment", () => {
    const store = usePlannerStore.getState();
    store.setSegmentsForDate(DATE_A, [
      { id: "a", categoryId: "eat", startSlot: 4, endSlot: 8 }
    ]);

    store.setSegmentAssignedMealsForDate(DATE_A, "a", ["meal-1", "meal-2"]);

    let segments = usePlannerStore.getState().segmentsByDate[DATE_A] ?? [];
    expect(segments[0]).toMatchObject({ id: "a", assignedMealIds: ["meal-1", "meal-2"] });

    store.setSegmentAssignedMealsForDate(DATE_A, "a", []);

    segments = usePlannerStore.getState().segmentsByDate[DATE_A] ?? [];
    expect(segments[0]).toMatchObject({ id: "a", assignedMealIds: [] });
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

  it("tracks undo and redo flags after timeline edits", () => {
    const store = usePlannerStore.getState();

    expect(store.canUndo).toBe(false);
    expect(store.canRedo).toBe(false);

    store.addCategoryForDate(DATE_A, "work", 0, 4);

    expect(usePlannerStore.getState().canUndo).toBe(true);
    expect(usePlannerStore.getState().canRedo).toBe(false);

    store.undoPlannerEdit();

    expect(usePlannerStore.getState().segmentsByDate[DATE_A]).toEqual(undefined);
    expect(usePlannerStore.getState().canUndo).toBe(false);
    expect(usePlannerStore.getState().canRedo).toBe(true);

    store.redoPlannerEdit();

    expect(usePlannerStore.getState().segmentsByDate[DATE_A]).toHaveLength(1);
    expect(usePlannerStore.getState().canUndo).toBe(true);
    expect(usePlannerStore.getState().canRedo).toBe(false);
  });

  it("clears redo history when a new edit happens after undo", () => {
    const store = usePlannerStore.getState();

    store.addCategoryForDate(DATE_A, "work", 0, 4);
    store.addCategoryForDate(DATE_A, "eat", 8, 12);
    store.undoPlannerEdit();

    expect(usePlannerStore.getState().canRedo).toBe(true);

    store.addCategoryForDate(DATE_A, "play", 16, 20);

    expect(usePlannerStore.getState().canRedo).toBe(false);
  });

  it("does not create history entries for no-op invalid range edits", () => {
    const store = usePlannerStore.getState();

    store.addCategoryForDate(DATE_A, "work", 10, 10);

    expect(usePlannerStore.getState().canUndo).toBe(false);
    expect(usePlannerStore.getState().canRedo).toBe(false);
  });

  it("adds a new category", () => {
    usePlannerStore.getState().addCategory("Hobby", "#123456");

    const categories = usePlannerStore.getState().categories;
    expect(categories).toHaveLength(6);
    expect(categories[5]).toMatchObject({ label: "Hobby", color: "#123456" });
    expect(categories[5].id).toBeTruthy();
  });

  it("ignores adding a category with a blank label", () => {
    usePlannerStore.getState().addCategory("   ", "#123456");

    expect(usePlannerStore.getState().categories).toHaveLength(5);
    expect(usePlannerStore.getState().canUndo).toBe(false);
  });

  it("renames and recolors an existing category, including the protected Eat category", () => {
    usePlannerStore.getState().updateCategory("eat", { label: "Dining", color: "#abcdef" });

    const eat = usePlannerStore.getState().categories.find((category) => category.id === "eat");
    expect(eat).toMatchObject({ id: "eat", label: "Dining", color: "#abcdef" });
  });

  it("trims renamed category labels", () => {
    usePlannerStore.getState().updateCategory("work", { label: "  Job  " });

    const work = usePlannerStore.getState().categories.find((category) => category.id === "work");
    expect(work?.label).toBe("Job");
  });

  it("removes a category with no segments", () => {
    usePlannerStore.getState().removeCategory("travel");

    const categories = usePlannerStore.getState().categories;
    expect(categories.map((category) => category.id)).toEqual(["sleep", "work", "play", "eat"]);
  });

  it("removes a category and deletes its segments across dates", () => {
    const store = usePlannerStore.getState();
    store.addCategoryForDate(DATE_A, "travel", 0, 4);
    store.addCategoryForDate(DATE_B, "travel", 8, 12);
    store.addCategoryForDate(DATE_B, "work", 12, 16);

    store.removeCategory("travel");

    const state = usePlannerStore.getState();
    expect(state.categories.map((category) => category.id)).toEqual(["sleep", "work", "play", "eat"]);
    expect(state.segmentsByDate[DATE_A]).toEqual([]);
    expect(state.segmentsByDate[DATE_B]).toHaveLength(1);
    expect(state.segmentsByDate[DATE_B][0]).toMatchObject({ categoryId: "work" });
  });

  it("refuses to remove a protected category", () => {
    usePlannerStore.getState().removeCategory("eat");

    const state = usePlannerStore.getState();
    expect(state.categories.map((category) => category.id)).toEqual(["sleep", "work", "play", "eat", "travel"]);
    expect(state.canUndo).toBe(false);
  });

  it("supports undo and redo for category edits", () => {
    const store = usePlannerStore.getState();

    store.addCategory("Hobby", "#123456");
    expect(usePlannerStore.getState().categories).toHaveLength(6);
    expect(usePlannerStore.getState().canUndo).toBe(true);

    store.undoPlannerEdit();
    expect(usePlannerStore.getState().categories).toHaveLength(5);
    expect(usePlannerStore.getState().canRedo).toBe(true);

    store.redoPlannerEdit();
    expect(usePlannerStore.getState().categories).toHaveLength(6);
  });

  it("rebases and clears history on replacePlannerData", () => {
    const store = usePlannerStore.getState();

    store.addCategoryForDate(DATE_A, "work", 0, 4);
    expect(usePlannerStore.getState().canUndo).toBe(true);

    store.replacePlannerData({
      categories: [{ id: "custom", label: "Custom", color: "#111111" }],
      segmentsByDate: {
        [DATE_B]: [{ id: "custom-1", categoryId: "custom", startSlot: 12, endSlot: 16 }]
      }
    });

    const state = usePlannerStore.getState();

    expect(state.canUndo).toBe(false);
    expect(state.canRedo).toBe(false);
    expect(state.categories).toEqual([{ id: "custom", label: "Custom", color: "#111111" }]);
    expect(state.segmentsByDate[DATE_B]).toHaveLength(1);
  });
});
