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
 * Converts a string to Title Case, trimming surrounding whitespace and collapsing internal runs.
 *
 * @param text - Raw input string.
 * @returns Title-cased string.
 */
export function toTitleCase(text: string): string {
  return text
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Creates a new MealComponent with a generated id.
 *
 * @param name - Display name for the component.
 * @returns A new MealComponent.
 */
export function createComponent(name: string): MealComponent {
  return { id: createId("component"), name: toTitleCase(name) };
}

/**
 * Returns true if any component other than the one being edited shares the given name (case-insensitive).
 *
 * @param components - Existing component list to check against.
 * @param name - Name to test for a conflict.
 * @param excludeId - Id of the component being edited, if any, so it is not matched against itself.
 * @returns Whether the name is already taken by another component.
 */
export function isComponentNameTaken(
  components: MealComponent[],
  name: string,
  excludeId?: string
): boolean {
  const normalized = name.trim().toLowerCase();
  return components.some(
    (component) =>
      component.id !== excludeId && component.name.toLowerCase() === normalized
  );
}

/**
 * Creates a new Meal with a generated id.
 *
 * @param name - Display name for the meal.
 * @param description - Optional description of the meal.
 * @param ingredients - Initial ingredient list.
 * @returns A new Meal.
 */
export function createMeal(name: string, description: string, ingredients: MealIngredient[]): Meal {
  return {
    id: createId("meal"),
    name: name.trim(),
    description: description.trim(),
    ingredients: ingredients.map((i) => ({ ...i, quantity: i.quantity.toLowerCase() }))
  };
}

/**
 * Returns a new list with the target component's name updated.
 *
 * @param components - Existing component list.
 * @param id - Id of the component to update.
 * @param name - New name value.
 * @returns Updated component list.
 */
export function updateComponentInList(
  components: MealComponent[],
  id: string,
  name: string
): MealComponent[] {
  return components.map((component) =>
    component.id === id ? { ...component, name: toTitleCase(name) } : component
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
 * Returns a new list with the target meal's name, description, and ingredients updated.
 *
 * @param meals - Existing meal list.
 * @param id - Id of the meal to update.
 * @param name - New name value.
 * @param description - New description value.
 * @param ingredients - New ingredient list.
 * @returns Updated meal list.
 */
export function updateMealInList(
  meals: Meal[],
  id: string,
  name: string,
  description: string,
  ingredients: MealIngredient[]
): Meal[] {
  return meals.map((meal) =>
    meal.id === id
      ? {
          ...meal,
          name: name.trim(),
          description: description.trim(),
          ingredients: ingredients.map((i) => ({ ...i, quantity: i.quantity.toLowerCase() }))
        }
      : meal
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
