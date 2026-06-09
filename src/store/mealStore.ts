import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  createComponent,
  createMeal,
  removeComponentFromState,
  removeMealFromList,
  updateComponentInList,
  updateMealInList
} from "../lib/mealData";
import type { Meal, MealComponent, MealStore } from "./mealStore.types";

export type { Meal, MealComponent, MealIngredient } from "./mealStore.types";

const initialState: { components: MealComponent[]; meals: Meal[] } = {
  components: [],
  meals: []
};

/**
 * Local persisted Zustand store for meal components and meals.
 */
export const useMealStore = create<MealStore>()(
  persist(
    (set) => ({
      ...initialState,
      addComponent: (name) =>
        set((state) => ({ components: [...state.components, createComponent(name)] })),
      updateComponent: (id, name) =>
        set((state) => ({ components: updateComponentInList(state.components, id, name) })),
      deleteComponent: (id) =>
        set((state) => removeComponentFromState(state.components, state.meals, id)),
      addMeal: (name, description, ingredients) =>
        set((state) => ({ meals: [...state.meals, createMeal(name, description, ingredients)] })),
      updateMeal: (id, name, description, ingredients) =>
        set((state) => ({ meals: updateMealInList(state.meals, id, name, description, ingredients) })),
      deleteMeal: (id) =>
        set((state) => ({ meals: removeMealFromList(state.meals, id) })),
      replaceMealData: (data) => set({ components: data.components, meals: data.meals }),
      resetMealStore: () => set({ components: [], meals: [] })
    }),
    {
      name: "sp9000-meal-state",
      storage: createJSONStorage(() => localStorage)
    }
  )
);
