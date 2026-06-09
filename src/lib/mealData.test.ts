import { describe, expect, it } from "vitest";
import {
  createComponent,
  createMeal,
  removeComponentFromState,
  removeMealFromList,
  updateComponentInList,
  updateMealInList
} from "./mealData";
import type { Meal, MealComponent } from "../store/mealStore.types";

describe("createComponent", () => {
  it("creates a component with the given name and description", () => {
    const component = createComponent("Chicken", "A lean protein");
    expect(component.name).toBe("Chicken");
    expect(component.description).toBe("A lean protein");
    expect(component.id).toBeTruthy();
  });

  it("trims whitespace from name and description", () => {
    const component = createComponent("  Chicken  ", "  A lean protein  ");
    expect(component.name).toBe("Chicken");
    expect(component.description).toBe("A lean protein");
  });

  it("assigns unique ids to distinct calls", () => {
    const a = createComponent("Chicken", "");
    const b = createComponent("Chicken", "");
    expect(a.id).not.toBe(b.id);
  });
});

describe("createMeal", () => {
  it("creates a meal with the given name and ingredients", () => {
    const ingredients = [{ componentId: "c1", quantity: "200g" }];
    const meal = createMeal("Chicken Salad", ingredients);
    expect(meal.name).toBe("Chicken Salad");
    expect(meal.ingredients).toEqual(ingredients);
    expect(meal.id).toBeTruthy();
  });

  it("trims whitespace from name", () => {
    const meal = createMeal("  Pasta  ", []);
    expect(meal.name).toBe("Pasta");
  });

  it("assigns unique ids to distinct calls", () => {
    const a = createMeal("Salad", []);
    const b = createMeal("Salad", []);
    expect(a.id).not.toBe(b.id);
  });
});

describe("updateComponentInList", () => {
  const components: MealComponent[] = [
    { id: "c1", name: "Chicken", description: "Protein" },
    { id: "c2", name: "Lettuce", description: "Leafy" }
  ];

  it("updates name and description of the matching component", () => {
    const updated = updateComponentInList(components, "c1", "Grilled Chicken", "Lean protein");
    expect(updated[0]).toEqual({ id: "c1", name: "Grilled Chicken", description: "Lean protein" });
  });

  it("leaves other components unchanged", () => {
    const updated = updateComponentInList(components, "c1", "Grilled Chicken", "Lean protein");
    expect(updated[1]).toEqual(components[1]);
  });

  it("trims whitespace on update", () => {
    const updated = updateComponentInList(components, "c2", "  Romaine  ", "  Crispy  ");
    expect(updated[1].name).toBe("Romaine");
    expect(updated[1].description).toBe("Crispy");
  });

  it("returns the original list unchanged when id is not found", () => {
    const updated = updateComponentInList(components, "c99", "X", "Y");
    expect(updated).toEqual(components);
  });
});

describe("removeComponentFromState", () => {
  const components: MealComponent[] = [
    { id: "c1", name: "Chicken", description: "" },
    { id: "c2", name: "Lettuce", description: "" }
  ];
  const meals: Meal[] = [
    {
      id: "m1",
      name: "Chicken Salad",
      ingredients: [
        { componentId: "c1", quantity: "200g" },
        { componentId: "c2", quantity: "1 cup" }
      ]
    },
    {
      id: "m2",
      name: "Lettuce Wrap",
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
    { id: "m1", name: "Salad", ingredients: [{ componentId: "c1", quantity: "100g" }] },
    { id: "m2", name: "Soup", ingredients: [] }
  ];

  it("updates the name and ingredients of the matching meal", () => {
    const updated = updateMealInList(meals, "m1", "Big Salad", [{ componentId: "c2", quantity: "200g" }]);
    expect(updated[0]).toEqual({
      id: "m1",
      name: "Big Salad",
      ingredients: [{ componentId: "c2", quantity: "200g" }]
    });
  });

  it("leaves other meals unchanged", () => {
    const updated = updateMealInList(meals, "m1", "Big Salad", []);
    expect(updated[1]).toEqual(meals[1]);
  });

  it("trims whitespace from the meal name on update", () => {
    const updated = updateMealInList(meals, "m2", "  Hot Soup  ", []);
    expect(updated[1].name).toBe("Hot Soup");
  });

  it("returns the original list unchanged when id is not found", () => {
    const updated = updateMealInList(meals, "m99", "X", []);
    expect(updated).toEqual(meals);
  });
});

describe("removeMealFromList", () => {
  const meals: Meal[] = [
    { id: "m1", name: "Salad", ingredients: [] },
    { id: "m2", name: "Soup", ingredients: [] }
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
