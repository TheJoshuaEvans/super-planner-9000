import { beforeEach, describe, expect, it } from "vitest";
import { useMealStore } from "./mealStore";

describe("mealStore", () => {
  beforeEach(() => {
    localStorage.clear();
    useMealStore.getState().resetMealStore();
  });

  describe("components", () => {
    it("starts with no components", () => {
      expect(useMealStore.getState().components).toEqual([]);
    });

    it("adds a component with a generated id", () => {
      useMealStore.getState().addComponent("Chicken", "A lean protein");
      const { components } = useMealStore.getState();
      expect(components).toHaveLength(1);
      expect(components[0]).toMatchObject({ name: "Chicken", description: "A lean protein" });
      expect(components[0].id).toBeTruthy();
    });

    it("adds multiple components independently", () => {
      useMealStore.getState().addComponent("Chicken", "Protein");
      useMealStore.getState().addComponent("Lettuce", "Leafy");
      expect(useMealStore.getState().components).toHaveLength(2);
    });

    it("updates a component in place", () => {
      useMealStore.getState().addComponent("Chicken", "Protein");
      const { id } = useMealStore.getState().components[0];
      useMealStore.getState().updateComponent(id, "Grilled Chicken", "Lean protein");
      expect(useMealStore.getState().components[0]).toMatchObject({
        id,
        name: "Grilled Chicken",
        description: "Lean protein"
      });
    });

    it("deletes a component by id", () => {
      useMealStore.getState().addComponent("Chicken", "Protein");
      const { id } = useMealStore.getState().components[0];
      useMealStore.getState().deleteComponent(id);
      expect(useMealStore.getState().components).toHaveLength(0);
    });

    it("cascades component deletion to all meal ingredient lists", () => {
      useMealStore.getState().addComponent("Chicken", "Protein");
      useMealStore.getState().addComponent("Lettuce", "Leafy");
      const [chicken, lettuce] = useMealStore.getState().components;
      useMealStore.getState().addMeal("Salad", [
        { componentId: chicken.id, quantity: "200g" },
        { componentId: lettuce.id, quantity: "1 cup" }
      ]);
      useMealStore.getState().deleteComponent(chicken.id);
      const meal = useMealStore.getState().meals[0];
      expect(meal.ingredients).toHaveLength(1);
      expect(meal.ingredients[0].componentId).toBe(lettuce.id);
    });
  });

  describe("meals", () => {
    it("starts with no meals", () => {
      expect(useMealStore.getState().meals).toEqual([]);
    });

    it("adds a meal with a generated id", () => {
      useMealStore.getState().addMeal("Chicken Salad", []);
      const { meals } = useMealStore.getState();
      expect(meals).toHaveLength(1);
      expect(meals[0]).toMatchObject({ name: "Chicken Salad", ingredients: [] });
      expect(meals[0].id).toBeTruthy();
    });

    it("adds a meal with ingredients", () => {
      useMealStore.getState().addComponent("Chicken", "Protein");
      const componentId = useMealStore.getState().components[0].id;
      useMealStore.getState().addMeal("Grilled Chicken", [{ componentId, quantity: "200g" }]);
      const meal = useMealStore.getState().meals[0];
      expect(meal.ingredients).toHaveLength(1);
      expect(meal.ingredients[0]).toEqual({ componentId, quantity: "200g" });
    });

    it("updates a meal in place", () => {
      useMealStore.getState().addMeal("Salad", []);
      const { id } = useMealStore.getState().meals[0];
      useMealStore.getState().updateMeal(id, "Big Salad", [{ componentId: "c1", quantity: "200g" }]);
      expect(useMealStore.getState().meals[0]).toMatchObject({
        id,
        name: "Big Salad",
        ingredients: [{ componentId: "c1", quantity: "200g" }]
      });
    });

    it("deletes a meal by id", () => {
      useMealStore.getState().addMeal("Salad", []);
      useMealStore.getState().addMeal("Soup", []);
      const { id } = useMealStore.getState().meals[0];
      useMealStore.getState().deleteMeal(id);
      expect(useMealStore.getState().meals).toHaveLength(1);
      expect(useMealStore.getState().meals[0].name).toBe("Soup");
    });
  });

  it("resetMealStore clears all components and meals", () => {
    useMealStore.getState().addComponent("Chicken", "Protein");
    useMealStore.getState().addMeal("Salad", []);
    useMealStore.getState().resetMealStore();
    expect(useMealStore.getState().components).toEqual([]);
    expect(useMealStore.getState().meals).toEqual([]);
  });
});
