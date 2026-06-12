import type { Meal } from "../store/mealStore.types";
import type { PlannerSegment } from "../store/plannerStore.types";

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

/**
 * Finds "eat" segments that have at least one resolved assigned meal, sorted by start time.
 *
 * @param segments - Segments for a single day.
 * @param meals - Full meal library.
 * @returns Eat segments paired with their resolved assigned meals, ordered by `startSlot`.
 */
export function resolveEatSegmentsWithAssignedMeals(
  segments: PlannerSegment[],
  meals: Meal[]
): { segment: PlannerSegment; assignedMeals: Meal[] }[] {
  return segments
    .filter((segment) => segment.categoryId === "eat")
    .map((segment) => ({ segment, assignedMeals: resolveAssignedMeals(meals, segment.assignedMealIds) }))
    .filter((entry) => entry.assignedMeals.length > 0)
    .sort((a, b) => a.segment.startSlot - b.segment.startSlot);
}

/**
 * Returns true if any "eat" segment for the day has no resolved assigned meals.
 *
 * @param segments - Segments for a single day.
 * @param meals - Full meal library.
 * @returns Whether at least one eat segment is missing meal assignments.
 */
export function hasUnassignedEatSegment(segments: PlannerSegment[], meals: Meal[]): boolean {
  return segments.some(
    (segment) => segment.categoryId === "eat" && resolveAssignedMeals(meals, segment.assignedMealIds).length === 0
  );
}
