import { describe, expect, it } from "vitest";
import { getMealDaySortKey, resolveAssignedMeals, toggleMealSelection } from "./mealAssignment";
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

describe("getMealDaySortKey", () => {
  it("orders times after the meal-planner day start before midnight", () => {
    const noon = getMealDaySortKey(48); // 12:00 PM
    const evening = getMealDaySortKey(72); // 6:00 PM
    const lateNight = getMealDaySortKey(4); // 1:00 AM

    expect(noon).toBeLessThan(evening);
    expect(evening).toBeLessThan(lateNight);
  });

  it("treats the configured day-start hour as the first slot of the day", () => {
    expect(getMealDaySortKey(24)).toBe(0); // 6:00 AM
  });

  it("wraps slots before the day start to the end of the ordering", () => {
    expect(getMealDaySortKey(0)).toBe(96 - 24); // midnight wraps to just before 6:00 AM
  });
});
