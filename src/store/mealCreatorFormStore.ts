import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type PanelMode = "list" | "add" | "edit";

/** A single row in the meal ingredient form — componentId may be empty until the user selects one. */
export type IngredientRow = { componentId: string; quantity: string };

type ComponentFormSlice = {
  componentMode: PanelMode;
  componentEditingId: string | null;
  componentFormName: string;
};

type MealFormSlice = {
  mealMode: PanelMode;
  mealEditingId: string | null;
  mealFormName: string;
  mealFormDescription: string;
  mealFormIngredients: IngredientRow[];
};

type MealCreatorFormStore = ComponentFormSlice &
  MealFormSlice & {
    /** Partially updates the component panel form state. */
    setComponentForm: (patch: Partial<ComponentFormSlice>) => void;
    /** Partially updates the meal panel form state. */
    setMealForm: (patch: Partial<MealFormSlice>) => void;
  };

const initialComponentForm: ComponentFormSlice = {
  componentMode: "list",
  componentEditingId: null,
  componentFormName: "",
};

const initialMealForm: MealFormSlice = {
  mealMode: "list",
  mealEditingId: null,
  mealFormName: "",
  mealFormDescription: "",
  mealFormIngredients: [],
};

/**
 * Persisted form state for the Meal Creator panels.
 * Survives page reloads and app-tab switches so users do not lose in-progress forms.
 */
export const useMealCreatorFormStore = create<MealCreatorFormStore>()(
  persist(
    (set) => ({
      ...initialComponentForm,
      ...initialMealForm,
      setComponentForm: (patch) => set(patch),
      setMealForm: (patch) => set(patch),
    }),
    {
      name: "sp9000-meal-creator-form",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
