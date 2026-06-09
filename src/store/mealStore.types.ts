/**
 * An individual ingredient or foodstuff available to the user.
 */
export type MealComponent = {
  id: string;
  name: string;
  description: string;
};

/**
 * A single ingredient reference within a meal, with a free-text quantity.
 */
export type MealIngredient = {
  componentId: string;
  quantity: string;
};

/**
 * A meal made up of one or more components with their quantities.
 */
export type Meal = {
  id: string;
  name: string;
  ingredients: MealIngredient[];
};

/**
 * Persisted meal store data.
 */
export type MealPersistedData = {
  components: MealComponent[];
  meals: Meal[];
};

/**
 * Meal store state plus all actions exposed to the UI.
 */
export type MealStore = MealPersistedData & {
  /** Adds a new component to the library. */
  addComponent: (name: string, description: string) => void;
  /** Updates the name and description of an existing component by id. */
  updateComponent: (id: string, name: string, description: string) => void;
  /** Removes a component and strips it from all meal ingredient lists. */
  deleteComponent: (id: string) => void;
  /** Adds a new meal to the library. */
  addMeal: (name: string, ingredients: MealIngredient[]) => void;
  /** Updates the name and ingredients of an existing meal by id. */
  updateMeal: (id: string, name: string, ingredients: MealIngredient[]) => void;
  /** Removes a meal from the library. */
  deleteMeal: (id: string) => void;
  /** Resets the store to an empty state. */
  resetMealStore: () => void;
};
