import { describe, expect, it } from "vitest";
import {
  createComponent,
  createMeal,
  isComponentNameTaken,
  removeComponentFromState,
  removeMealFromList,
  toTitleCase,
  updateComponentInList,
  updateMealInList
} from "./mealData";
import type { Meal, MealComponent } from "../store/mealStore.types";

describe("toTitleCase", () => {
  it("capitalizes the first letter of each word", () => {
    expect(toTitleCase("chicken breast")).toBe("Chicken Breast");
  });

  it("lowercases letters after the first in each word", () => {
    expect(toTitleCase("CHICKEN BREAST")).toBe("Chicken Breast");
  });

  it("handles mixed case input", () => {
    expect(toTitleCase("grilled cHiCkEn")).toBe("Grilled Chicken");
  });

  it("trims surrounding whitespace", () => {
    expect(toTitleCase("  chicken  ")).toBe("Chicken");
  });

  it("collapses internal whitespace runs", () => {
    expect(toTitleCase("chicken   breast")).toBe("Chicken Breast");
  });
});

describe("createComponent", () => {
  it("creates a component with the given name in Title Case", () => {
    const component = createComponent("chicken breast");
    expect(component.name).toBe("Chicken Breast");
    expect(component.id).toBeTruthy();
  });

  it("normalizes name to Title Case", () => {
    const component = createComponent("  CHICKEN  ");
    expect(component.name).toBe("Chicken");
  });

  it("assigns unique ids to distinct calls", () => {
    const a = createComponent("Chicken");
    const b = createComponent("Chicken");
    expect(a.id).not.toBe(b.id);
  });
});

describe("createMeal", () => {
  it("creates a meal with the given name trimmed", () => {
    const ingredients = [{ componentId: "c1", quantity: "200g" }];
    const meal = createMeal("chicken salad", "A light lunch", ingredients);
    expect(meal.name).toBe("chicken salad");
    expect(meal.description).toBe("A light lunch");
    expect(meal.id).toBeTruthy();
  });

  it("trims name and description whitespace", () => {
    const meal = createMeal("  my PASTA  ", "  Quick dinner  ", []);
    expect(meal.name).toBe("my PASTA");
    expect(meal.description).toBe("Quick dinner");
  });

  it("lowercases ingredient quantities", () => {
    const meal = createMeal("Salad", "", [{ componentId: "c1", quantity: "200G" }, { componentId: "c2", quantity: "1 CUP" }]);
    expect(meal.ingredients[0].quantity).toBe("200g");
    expect(meal.ingredients[1].quantity).toBe("1 cup");
  });

  it("assigns unique ids to distinct calls", () => {
    const a = createMeal("Salad", "", []);
    const b = createMeal("Salad", "", []);
    expect(a.id).not.toBe(b.id);
  });
});

describe("updateComponentInList", () => {
  const components: MealComponent[] = [
    { id: "c1", name: "Chicken" },
    { id: "c2", name: "Lettuce" }
  ];

  it("updates the name of the matching component in Title Case", () => {
    const updated = updateComponentInList(components, "c1", "grilled chicken");
    expect(updated[0]).toEqual({ id: "c1", name: "Grilled Chicken" });
  });

  it("leaves other components unchanged", () => {
    const updated = updateComponentInList(components, "c1", "Grilled Chicken");
    expect(updated[1]).toEqual(components[1]);
  });

  it("normalizes name to Title Case on update", () => {
    const updated = updateComponentInList(components, "c2", "  ROMAINE  ");
    expect(updated[1].name).toBe("Romaine");
  });

  it("returns the original list unchanged when id is not found", () => {
    const updated = updateComponentInList(components, "c99", "X");
    expect(updated).toEqual(components);
  });
});

describe("isComponentNameTaken", () => {
  const components: MealComponent[] = [
    { id: "c1", name: "Chicken" },
    { id: "c2", name: "Lettuce" }
  ];

  it("returns true when another component has the same name", () => {
    expect(isComponentNameTaken(components, "Chicken")).toBe(true);
  });

  it("is case-insensitive", () => {
    expect(isComponentNameTaken(components, "chicken")).toBe(true);
    expect(isComponentNameTaken(components, "LETTUCE")).toBe(true);
  });

  it("returns false when no component has that name", () => {
    expect(isComponentNameTaken(components, "Broccoli")).toBe(false);
  });

  it("ignores the component being edited when excludeId is provided", () => {
    expect(isComponentNameTaken(components, "Chicken", "c1")).toBe(false);
  });

  it("still detects conflicts with other components when excludeId is provided", () => {
    expect(isComponentNameTaken(components, "Lettuce", "c1")).toBe(true);
  });

  it("trims whitespace before comparing", () => {
    expect(isComponentNameTaken(components, "  Chicken  ")).toBe(true);
  });
});

describe("removeComponentFromState", () => {
  const components: MealComponent[] = [
    { id: "c1", name: "Chicken" },
    { id: "c2", name: "Lettuce" }
  ];
  const meals: Meal[] = [
    {
      id: "m1",
      name: "Chicken Salad",
      description: "",
      ingredients: [
        { componentId: "c1", quantity: "200g" },
        { componentId: "c2", quantity: "1 cup" }
      ]
    },
    {
      id: "m2",
      name: "Lettuce Wrap",
      description: "",
      ingredients: [{ componentId: "c2", quantity: "2 leaves" }]
    }
  ];

  it("removes the component from the component list", () => {
    const result = removeComponentFromState(components, meals, "c1");
    expect(result.components).toHaveLength(1);
    expect(result.components[0].id).toBe("c2");
  });

  it("strips the deleted component from all meals that reference it", () => {
    const result = removeComponentFromState(components, meals, "c1");
    expect(result.meals[0].ingredients).toHaveLength(1);
    expect(result.meals[0].ingredients[0].componentId).toBe("c2");
  });

  it("does not affect meals that do not reference the deleted component", () => {
    const result = removeComponentFromState(components, meals, "c1");
    expect(result.meals[1].ingredients).toHaveLength(1);
    expect(result.meals[1].ingredients[0].componentId).toBe("c2");
  });

  it("returns unchanged lists when id is not found", () => {
    const result = removeComponentFromState(components, meals, "c99");
    expect(result.components).toEqual(components);
    expect(result.meals).toEqual(meals);
  });
});

describe("updateMealInList", () => {
  const meals: Meal[] = [
    { id: "m1", name: "Salad", description: "Light", ingredients: [{ componentId: "c1", quantity: "100g" }] },
    { id: "m2", name: "Soup", description: "", ingredients: [] }
  ];

  it("updates the matching meal with trimmed name and lowercased quantities", () => {
    const updated = updateMealInList(meals, "m1", "big salad", "Very filling", [{ componentId: "c2", quantity: "200G" }]);
    expect(updated[0]).toEqual({
      id: "m1",
      name: "big salad",
      description: "Very filling",
      ingredients: [{ componentId: "c2", quantity: "200g" }]
    });
  });

  it("leaves other meals unchanged", () => {
    const updated = updateMealInList(meals, "m1", "Big Salad", "", []);
    expect(updated[1]).toEqual(meals[1]);
  });

  it("trims name and description whitespace on update", () => {
    const updated = updateMealInList(meals, "m2", "  HOT SOUP  ", "  Warm and comforting  ", []);
    expect(updated[1].name).toBe("HOT SOUP");
    expect(updated[1].description).toBe("Warm and comforting");
  });

  it("returns the original list unchanged when id is not found", () => {
    const updated = updateMealInList(meals, "m99", "X", "", []);
    expect(updated).toEqual(meals);
  });
});

describe("removeMealFromList", () => {
  const meals: Meal[] = [
    { id: "m1", name: "Salad", description: "", ingredients: [] },
    { id: "m2", name: "Soup", description: "", ingredients: [] }
  ];

  it("removes the matching meal", () => {
    const updated = removeMealFromList(meals, "m1");
    expect(updated).toHaveLength(1);
    expect(updated[0].id).toBe("m2");
  });

  it("returns all meals unchanged when id is not found", () => {
    const updated = removeMealFromList(meals, "m99");
    expect(updated).toEqual(meals);
  });
});
