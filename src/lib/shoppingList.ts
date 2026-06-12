import type { Meal, MealComponent } from "../store/mealStore.types";
import type { PlannerSegmentsByDate } from "../store/plannerStore.types";
import { formatCalendarDateIdentity, parseCalendarDateKey } from "./calendar";

/** A single aggregated entry in a generated shopping list. */
export type ShoppingListItem = {
  componentId: string;
  name: string;
  quantity: number;
  unit: string;
};

/**
 * Builds an inclusive list of calendar date keys spanning from start to end.
 *
 * @param startDateKey - First date key (YYYY-MM-DD) in the range.
 * @param endDateKey - Last date key (YYYY-MM-DD) in the range.
 * @returns Ordered date keys from start to end, or an empty array if either key is
 * invalid or end precedes start.
 */
export function buildDateKeyRange(startDateKey: string, endDateKey: string): string[] {
  const start = parseCalendarDateKey(startDateKey);
  const end = parseCalendarDateKey(endDateKey);

  if (!start || !end || end < start) {
    return [];
  }

  const dateKeys: string[] = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    dateKeys.push(formatCalendarDateIdentity(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return dateKeys;
}

/**
 * Aggregates ingredient quantities for every meal assigned to an "eat" segment across the
 * given dates, summing quantities that share the same component and unit.
 *
 * @param dateKeys - Date keys to include in the aggregation.
 * @param segmentsByDate - Planner segments keyed by date.
 * @param meals - Full meal library used to resolve assigned meal ids.
 * @param components - Full component library used to resolve ingredient names.
 * @returns Shopping list items sorted alphabetically by component name, then unit.
 */
export function buildShoppingList(
  dateKeys: string[],
  segmentsByDate: PlannerSegmentsByDate,
  meals: Meal[],
  components: MealComponent[]
): ShoppingListItem[] {
  const mealsById = new Map(meals.map((meal) => [meal.id, meal]));
  const componentsById = new Map(components.map((component) => [component.id, component]));
  const totalsByKey = new Map<string, ShoppingListItem>();

  for (const dateKey of dateKeys) {
    for (const segment of segmentsByDate[dateKey] ?? []) {
      if (segment.categoryId !== "eat") {
        continue;
      }

      for (const mealId of segment.assignedMealIds ?? []) {
        const meal = mealsById.get(mealId);
        if (!meal) {
          continue;
        }

        for (const ingredient of meal.ingredients) {
          const component = componentsById.get(ingredient.componentId);
          if (!component) {
            continue;
          }

          const key = `${ingredient.componentId}::${ingredient.unit}`;
          const existing = totalsByKey.get(key);
          if (existing) {
            existing.quantity += ingredient.quantity;
          } else {
            totalsByKey.set(key, {
              componentId: ingredient.componentId,
              name: component.name,
              quantity: ingredient.quantity,
              unit: ingredient.unit
            });
          }
        }
      }
    }
  }

  return [...totalsByKey.values()]
    .map((item) => ({ ...item, quantity: Math.round(item.quantity * 100) / 100 }))
    .sort((a, b) => a.name.localeCompare(b.name) || a.unit.localeCompare(b.unit));
}
