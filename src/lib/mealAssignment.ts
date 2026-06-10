import type { Meal } from "../store/mealStore.types";

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
