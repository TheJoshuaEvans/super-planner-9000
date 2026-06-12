import { describe, expect, it } from "vitest";
import { buildDateKeyRange, buildShoppingList } from "./shoppingList";
import type { Meal, MealComponent } from "../store/mealStore.types";
import type { PlannerSegmentsByDate } from "../store/plannerStore.types";

describe("buildDateKeyRange", () => {
  it("returns a single-day range when start and end match", () => {
    expect(buildDateKeyRange("2026-06-11", "2026-06-11")).toEqual(["2026-06-11"]);
  });

  it("returns an inclusive range spanning multiple days", () => {
    expect(buildDateKeyRange("2026-06-11", "2026-06-14")).toEqual([
      "2026-06-11",
      "2026-06-12",
      "2026-06-13",
      "2026-06-14"
    ]);
  });

  it("handles ranges that cross a month boundary", () => {
    expect(buildDateKeyRange("2026-06-29", "2026-07-02")).toEqual([
      "2026-06-29",
      "2026-06-30",
      "2026-07-01",
      "2026-07-02"
    ]);
  });

  it("returns an empty array when the end date precedes the start date", () => {
    expect(buildDateKeyRange("2026-06-14", "2026-06-11")).toEqual([]);
  });

  it("returns an empty array for invalid date keys", () => {
    expect(buildDateKeyRange("not-a-date", "2026-06-11")).toEqual([]);
    expect(buildDateKeyRange("2026-06-11", "not-a-date")).toEqual([]);
  });
});

describe("buildShoppingList", () => {
  const components: MealComponent[] = [
    { id: "chicken", name: "Chicken" },
    { id: "rice", name: "Rice" },
    { id: "garlic", name: "Garlic" }
  ];

  const meals: Meal[] = [
    {
      id: "meal-chicken-rice",
      name: "Chicken and Rice",
      description: "",
      ingredients: [
        { componentId: "chicken", quantity: 200, unit: "g" },
        { componentId: "rice", quantity: 0.5, unit: "cup" },
        { componentId: "garlic", quantity: 0, unit: "" }
      ]
    },
    {
      id: "meal-rice-bowl",
      name: "Rice Bowl",
      description: "",
      ingredients: [{ componentId: "rice", quantity: 1, unit: "cup" }]
    }
  ];

  it("sums quantities for the same component and unit across days and meals", () => {
    const segmentsByDate: PlannerSegmentsByDate = {
      "2026-06-11": [{ id: "s1", categoryId: "eat", startSlot: 0, endSlot: 4, assignedMealIds: ["meal-chicken-rice"] }],
      "2026-06-12": [{ id: "s2", categoryId: "eat", startSlot: 0, endSlot: 4, assignedMealIds: ["meal-rice-bowl"] }]
    };

    const result = buildShoppingList(["2026-06-11", "2026-06-12"], segmentsByDate, meals, components);

    expect(result).toEqual([
      { componentId: "chicken", name: "Chicken", quantity: 200, unit: "g" },
      { componentId: "garlic", name: "Garlic", quantity: 0, unit: "" },
      { componentId: "rice", name: "Rice", quantity: 1.5, unit: "cup" }
    ]);
  });

  it("ignores segments outside the date range", () => {
    const segmentsByDate: PlannerSegmentsByDate = {
      "2026-06-11": [{ id: "s1", categoryId: "eat", startSlot: 0, endSlot: 4, assignedMealIds: ["meal-rice-bowl"] }],
      "2026-06-20": [{ id: "s2", categoryId: "eat", startSlot: 0, endSlot: 4, assignedMealIds: ["meal-chicken-rice"] }]
    };

    const result = buildShoppingList(["2026-06-11"], segmentsByDate, meals, components);

    expect(result).toEqual([{ componentId: "rice", name: "Rice", quantity: 1, unit: "cup" }]);
  });

  it("ignores non-eat segments", () => {
    const segmentsByDate: PlannerSegmentsByDate = {
      "2026-06-11": [{ id: "s1", categoryId: "work", startSlot: 0, endSlot: 4, assignedMealIds: ["meal-rice-bowl"] }]
    };

    expect(buildShoppingList(["2026-06-11"], segmentsByDate, meals, components)).toEqual([]);
  });

  it("ignores eat segments with no assigned meals", () => {
    const segmentsByDate: PlannerSegmentsByDate = {
      "2026-06-11": [{ id: "s1", categoryId: "eat", startSlot: 0, endSlot: 4 }]
    };

    expect(buildShoppingList(["2026-06-11"], segmentsByDate, meals, components)).toEqual([]);
  });

  it("ignores assigned meal ids that no longer resolve to a meal", () => {
    const segmentsByDate: PlannerSegmentsByDate = {
      "2026-06-11": [{ id: "s1", categoryId: "eat", startSlot: 0, endSlot: 4, assignedMealIds: ["missing-meal"] }]
    };

    expect(buildShoppingList(["2026-06-11"], segmentsByDate, meals, components)).toEqual([]);
  });

  it("ignores ingredients whose component no longer exists", () => {
    const segmentsByDate: PlannerSegmentsByDate = {
      "2026-06-11": [{ id: "s1", categoryId: "eat", startSlot: 0, endSlot: 4, assignedMealIds: ["meal-rice-bowl"] }]
    };

    expect(buildShoppingList(["2026-06-11"], segmentsByDate, meals, [])).toEqual([]);
  });

  it("keeps the same component listed separately per distinct unit", () => {
    const mealsWithMixedUnits: Meal[] = [
      {
        id: "meal-mixed",
        name: "Mixed",
        description: "",
        ingredients: [
          { componentId: "rice", quantity: 1, unit: "cup" },
          { componentId: "rice", quantity: 200, unit: "g" }
        ]
      }
    ];
    const segmentsByDate: PlannerSegmentsByDate = {
      "2026-06-11": [{ id: "s1", categoryId: "eat", startSlot: 0, endSlot: 4, assignedMealIds: ["meal-mixed"] }]
    };

    const result = buildShoppingList(["2026-06-11"], segmentsByDate, mealsWithMixedUnits, components);

    expect(result).toEqual([
      { componentId: "rice", name: "Rice", quantity: 1, unit: "cup" },
      { componentId: "rice", name: "Rice", quantity: 200, unit: "g" }
    ]);
  });

  it("rounds summed quantities to avoid floating point artifacts", () => {
    const mealsWithFloats: Meal[] = [
      {
        id: "meal-floats",
        name: "Floats",
        description: "",
        ingredients: [{ componentId: "rice", quantity: 0.1, unit: "cup" }]
      }
    ];
    const segmentsByDate: PlannerSegmentsByDate = {
      "2026-06-11": [{ id: "s1", categoryId: "eat", startSlot: 0, endSlot: 4, assignedMealIds: ["meal-floats", "meal-floats"] }]
    };

    const result = buildShoppingList(["2026-06-11"], segmentsByDate, mealsWithFloats, components);

    expect(result).toEqual([{ componentId: "rice", name: "Rice", quantity: 0.2, unit: "cup" }]);
  });

  it("returns an empty list for an empty date range", () => {
    expect(buildShoppingList([], {}, meals, components)).toEqual([]);
  });
});
