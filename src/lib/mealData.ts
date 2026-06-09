import type { Meal, MealComponent, MealIngredient } from "../store/mealStore.types";

/**
 * Generates a unique identifier with the given prefix.
 *
 * @param prefix - Prefix string for the id.
 * @returns A unique id string.
 */
function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Creates a new MealComponent with a generated id.
 *
 * @param name - Display name for the component.
 * @param description - Description of the component.
 * @returns A new MealComponent.
 */
export function createComponent(name: string, description: string): MealComponent {
  return { id: createId("component"), name: name.trim(), description: description.trim() };
}

/**
 * Creates a new Meal with a generated id.
 *
 * @param name - Display name for the meal.
 * @param ingredients - Initial ingredient list.
 * @returns A new Meal.
 */
export function createMeal(name: string, ingredients: MealIngredient[]): Meal {
  return { id: createId("meal"), name: name.trim(), ingredients };
}

/**
 * Returns a new list with the target component's name and description updated.
 *
 * @param components - Existing component list.
 * @param id - Id of the component to update.
 * @param name - New name value.
 * @param description - New description value.
 * @returns Updated component list.
 */
export function updateComponentInList(
  components: MealComponent[],
  id: string,
  name: string,
  description: string
): MealComponent[] {
  return components.map((component) =>
    component.id === id
      ? { ...component, name: name.trim(), description: description.trim() }
      : component
  );
}

/**
 * Removes a component from the list and strips matching ingredients from all meals.
 *
 * @param components - Existing component list.
 * @param meals - Existing meal list.
 * @param id - Id of the component to remove.
 * @returns Updated components and meals with the component and its references removed.
 */
export function removeComponentFromState(
  components: MealComponent[],
  meals: Meal[],
  id: string
): { components: MealComponent[]; meals: Meal[] } {
  return {
    components: components.filter((component) => component.id !== id),
    meals: meals.map((meal) => ({
      ...meal,
      ingredients: meal.ingredients.filter((ingredient) => ingredient.componentId !== id)
    }))
  };
}

/**
 * Returns a new list with the target meal's name and ingredients updated.
 *
 * @param meals - Existing meal list.
 * @param id - Id of the meal to update.
 * @param name - New name value.
 * @param ingredients - New ingredient list.
 * @returns Updated meal list.
 */
export function updateMealInList(
  meals: Meal[],
  id: string,
  name: string,
  ingredients: MealIngredient[]
): Meal[] {
  return meals.map((meal) =>
    meal.id === id ? { ...meal, name: name.trim(), ingredients } : meal
  );
}

/**
 * Returns a new list with the target meal removed.
 *
 * @param meals - Existing meal list.
 * @param id - Id of the meal to remove.
 * @returns Filtered meal list.
 */
export function removeMealFromList(meals: Meal[], id: string): Meal[] {
  return meals.filter((meal) => meal.id !== id);
}
