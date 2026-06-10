import { describe, expect, it } from "vitest";
import { resolveAssignedMeals, toggleMealSelection } from "./mealAssignment";
import type { Meal } from "../store/mealStore.types";

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
