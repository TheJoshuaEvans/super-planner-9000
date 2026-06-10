import { SLOTS_PER_HOUR, TOTAL_DAY_SLOTS } from "./timeline";
import type { Meal } from "../store/mealStore.types";

/**
 * Hour of day at which the meal-planner listing order "starts", so meals
 * scheduled after midnight but before this hour are listed last.
 */
export const MEAL_DAY_START_HOUR = 6;

const MEAL_DAY_START_SLOT = MEAL_DAY_START_HOUR * SLOTS_PER_HOUR;

/**
 * Computes a sort key for a segment's start slot relative to the meal-planner
 * day start, so times before {@link MEAL_DAY_START_HOUR} sort after times later in the day.
 *
 * @param startSlot - Quarter-hour slot index where the segment starts.
 * @returns Slot offset from the meal-planner day start, in [0, TOTAL_DAY_SLOTS).
 */
export function getMealDaySortKey(startSlot: number): number {
  return ((startSlot - MEAL_DAY_START_SLOT) % TOTAL_DAY_SLOTS + TOTAL_DAY_SLOTS) % TOTAL_DAY_SLOTS;
}

/**
 * Returns a new selection list with the given meal id added or removed.
 *
 * @param selectedMealIds - Currently selected meal ids.
 * @param mealId - Meal id to toggle.
 * @returns Updated selection with the meal id present if it was absent, or removed if it was present.
 */
export function toggleMealSelection(selectedMealIds: string[], mealId: string): string[] {
  return selectedMealIds.includes(mealId)
    ? selectedMealIds.filter((id) => id !== mealId)
    : [...selectedMealIds, mealId];
}

/**
 * Resolves assigned meal ids to their meal records, silently dropping any ids that no longer exist.
 *
 * @param meals - Full meal library.
 * @param assignedMealIds - Meal ids assigned to a segment, if any.
 * @returns Meals matching the assigned ids, in assignment order.
 */
export function resolveAssignedMeals(meals: Meal[], assignedMealIds: string[] | undefined): Meal[] {
  if (!assignedMealIds || assignedMealIds.length === 0) {
    return [];
  }

  const mealsById = new Map(meals.map((meal) => [meal.id, meal]));
  return assignedMealIds
    .map((mealId) => mealsById.get(mealId))
    .filter((meal): meal is Meal => meal !== undefined);
}
