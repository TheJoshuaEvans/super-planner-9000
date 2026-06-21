import { describe, expect, it } from "vitest";
import {
  countSegmentsUsingCategory,
  createCategoryId,
  DEFAULT_CATEGORY_COLOR_PALETTE,
  isCategoryLabelTaken,
  isProtectedCategory,
  pickNextCategoryColor,
  removeSegmentsForCategory
} from "./plannerCategories";
import type { PlannerCategory, PlannerSegment, PlannerSegmentsByDate } from "../store/plannerStore";

function makeCategory(id: string, label: string, color: string): PlannerCategory {
  return { id, label, color };
}

function makeSegment(id: string, categoryId: string, startSlot = 0, endSlot = 4): PlannerSegment {
  return { id, categoryId, startSlot, endSlot };
}

describe("isProtectedCategory", () => {
  it("protects the eat category", () => {
    expect(isProtectedCategory("eat")).toBe(true);
  });

  it("protects the work category", () => {
    expect(isProtectedCategory("work")).toBe(true);
  });

  it("does not protect other categories", () => {
    expect(isProtectedCategory("sleep")).toBe(false);
    expect(isProtectedCategory("custom-123")).toBe(false);
  });
});

describe("createCategoryId", () => {
  it("creates unique-looking ids", () => {
    const first = createCategoryId();
    const second = createCategoryId();

    expect(first).toMatch(/^category-/);
    expect(first).not.toBe(second);
  });
});

describe("pickNextCategoryColor", () => {
  it("returns the first palette color when no categories exist", () => {
    expect(pickNextCategoryColor([])).toBe(DEFAULT_CATEGORY_COLOR_PALETTE[0]);
  });

  it("skips colors already used by existing categories", () => {
    const categories = [makeCategory("a", "A", DEFAULT_CATEGORY_COLOR_PALETTE[0])];

    expect(pickNextCategoryColor(categories)).toBe(DEFAULT_CATEGORY_COLOR_PALETTE[1]);
  });

  it("cycles back to the first color once the whole palette is used", () => {
    const categories = DEFAULT_CATEGORY_COLOR_PALETTE.map((color, index) => makeCategory(`c${index}`, `C${index}`, color));

    expect(pickNextCategoryColor(categories)).toBe(DEFAULT_CATEGORY_COLOR_PALETTE[0]);
  });
});

describe("isCategoryLabelTaken", () => {
  const categories = [makeCategory("eat", "Eat", "#ca8a04"), makeCategory("sleep", "Sleep", "#7c3aed")];

  it("matches case-insensitively after trimming", () => {
    expect(isCategoryLabelTaken(categories, "  eat  ")).toBe(true);
    expect(isCategoryLabelTaken(categories, "SLEEP")).toBe(true);
  });

  it("returns false for unused labels", () => {
    expect(isCategoryLabelTaken(categories, "Travel")).toBe(false);
  });

  it("excludes the given category id, allowing a no-op rename", () => {
    expect(isCategoryLabelTaken(categories, "Eat", "eat")).toBe(false);
  });
});

describe("countSegmentsUsingCategory", () => {
  it("counts matching segments across all dates", () => {
    const segmentsByDate: PlannerSegmentsByDate = {
      "2026-06-01": [makeSegment("s1", "eat"), makeSegment("s2", "sleep")],
      "2026-06-02": [makeSegment("s3", "eat")]
    };

    expect(countSegmentsUsingCategory(segmentsByDate, "eat")).toBe(2);
    expect(countSegmentsUsingCategory(segmentsByDate, "sleep")).toBe(1);
    expect(countSegmentsUsingCategory(segmentsByDate, "travel")).toBe(0);
  });
});

describe("removeSegmentsForCategory", () => {
  it("filters out segments using the given category from every date", () => {
    const segmentsByDate: PlannerSegmentsByDate = {
      "2026-06-01": [makeSegment("s1", "eat"), makeSegment("s2", "sleep")],
      "2026-06-02": [makeSegment("s3", "eat")]
    };

    const result = removeSegmentsForCategory(segmentsByDate, "eat");

    expect(result["2026-06-01"]).toEqual([makeSegment("s2", "sleep")]);
    expect(result["2026-06-02"]).toEqual([]);
  });

  it("does not mutate the original map", () => {
    const segmentsByDate: PlannerSegmentsByDate = {
      "2026-06-01": [makeSegment("s1", "eat")]
    };

    removeSegmentsForCategory(segmentsByDate, "eat");

    expect(segmentsByDate["2026-06-01"]).toHaveLength(1);
  });
});
