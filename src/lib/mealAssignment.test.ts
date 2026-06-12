import { describe, expect, it } from "vitest";
import {
  hasUnassignedEatSegment,
  resolveAssignedMeals,
  resolveEatSegmentsWithAssignedMeals,
  toggleMealSelection
} from "./mealAssignment";
import type { Meal } from "../store/mealStore.types";
import type { PlannerSegment } from "../store/plannerStore.types";

const meals: Meal[] = [
  { id: "meal-1", name: "Oatmeal", description: "", ingredients: [] },
  { id: "meal-2", name: "Salad", description: "", ingredients: [] }
];

describe("toggleMealSelection", () => {
  it("adds an id that is not yet selected", () => {
    expect(toggleMealSelection([], "meal-1")).toEqual(["meal-1"]);
    expect(toggleMealSelection(["meal-2"], "meal-1")).toEqual(["meal-2", "meal-1"]);
  });

  it("removes an id that is already selected", () => {
    expect(toggleMealSelection(["meal-1", "meal-2"], "meal-1")).toEqual(["meal-2"]);
  });
});

describe("resolveAssignedMeals", () => {
  it("returns an empty array when no ids are assigned", () => {
    expect(resolveAssignedMeals(meals, undefined)).toEqual([]);
    expect(resolveAssignedMeals(meals, [])).toEqual([]);
  });

  it("resolves assigned ids to meals in assignment order", () => {
    expect(resolveAssignedMeals(meals, ["meal-2", "meal-1"])).toEqual([meals[1], meals[0]]);
  });

  it("silently drops ids that no longer match a meal", () => {
    expect(resolveAssignedMeals(meals, ["meal-1", "missing"])).toEqual([meals[0]]);
  });
});

describe("resolveEatSegmentsWithAssignedMeals", () => {
  const breakfast: PlannerSegment = { id: "seg-breakfast", categoryId: "eat", startSlot: 32, endSlot: 36, assignedMealIds: ["meal-1"] };
  const lunch: PlannerSegment = { id: "seg-lunch", categoryId: "eat", startSlot: 48, endSlot: 52, assignedMealIds: [] };
  const work: PlannerSegment = { id: "seg-work", categoryId: "work", startSlot: 36, endSlot: 48, assignedMealIds: ["meal-2"] };

  it("returns only eat segments with at least one resolved assigned meal, sorted by start time", () => {
    expect(resolveEatSegmentsWithAssignedMeals([lunch, work, breakfast], meals)).toEqual([
      { segment: breakfast, assignedMeals: [meals[0]] }
    ]);
  });

  it("returns an empty array when no eat segments have assigned meals", () => {
    expect(resolveEatSegmentsWithAssignedMeals([lunch, work], meals)).toEqual([]);
  });
});

describe("hasUnassignedEatSegment", () => {
  const assignedEat: PlannerSegment = { id: "seg-1", categoryId: "eat", startSlot: 32, endSlot: 36, assignedMealIds: ["meal-1"] };
  const unassignedEat: PlannerSegment = { id: "seg-2", categoryId: "eat", startSlot: 48, endSlot: 52, assignedMealIds: [] };
  const work: PlannerSegment = { id: "seg-3", categoryId: "work", startSlot: 0, endSlot: 4 };

  it("returns true when an eat segment has no resolved assigned meals", () => {
    expect(hasUnassignedEatSegment([assignedEat, unassignedEat], meals)).toBe(true);
  });

  it("returns false when all eat segments have assigned meals", () => {
    expect(hasUnassignedEatSegment([assignedEat, work], meals)).toBe(false);
  });

  it("returns false when there are no eat segments", () => {
    expect(hasUnassignedEatSegment([work], meals)).toBe(false);
  });
});
