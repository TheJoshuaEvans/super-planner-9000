import { useMemo, useState, type FormEvent } from "react";
import { useMealStore } from "../../store/mealStore";
import type { Meal, MealIngredient } from "../../store/mealStore";

type PanelMode = "list" | "add" | "edit";

type IngredientRow = { componentId: string; quantity: string };

const inputClassName =
  "w-full rounded-md border border-app-border bg-app-bg px-3 py-2 text-sm text-app-text placeholder:text-app-muted/60 focus:border-app-accent/60 focus:outline-none focus:ring-2 focus:ring-app-accent/20";

const primaryButtonClassName =
  "rounded-md bg-app-accent px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-app-accentStrong disabled:cursor-not-allowed disabled:opacity-40";

const secondaryButtonClassName =
  "rounded-md border border-app-border bg-app-panel/85 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-app-muted transition hover:border-app-accent/70 hover:text-app-text";

/**
 * Builds a human-readable ingredient summary line for a meal.
 *
 * @param meal - The meal to summarise.
 * @param componentsById - Lookup map from component id to component.
 * @returns A comma-separated list of "Name (quantity)" strings, or "No ingredients".
 */
function formatIngredientSummary(
  meal: Meal,
  componentsById: Map<string, { name: string }>
): string {
  if (meal.ingredients.length === 0) return "No ingredients";

  const parts = meal.ingredients
    .map((ingredient) => {
      const component = componentsById.get(ingredient.componentId);
      if (!component) return null;
      return ingredient.quantity ? `${component.name} (${ingredient.quantity})` : component.name;
    })
    .filter((part): part is string => part !== null);

  return parts.length > 0 ? parts.join(", ") : "No ingredients";
}

/**
 * Panel for creating, editing, and deleting meals with their ingredient lists.
 */
function MealsPanel() {
  const components = useMealStore((state) => state.components);
  const meals = useMealStore((state) => state.meals);
  const addMeal = useMealStore((state) => state.addMeal);
  const updateMeal = useMealStore((state) => state.updateMeal);
  const deleteMeal = useMealStore((state) => state.deleteMeal);

  const [mode, setMode] = useState<PanelMode>("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formIngredients, setFormIngredients] = useState<IngredientRow[]>([]);

  const componentsById = useMemo(
    () => new Map(components.map((c) => [c.id, c])),
    [components]
  );

  const canSave = formName.trim().length > 0;

  /**
   * Opens the add form with an empty state.
   */
  function handleStartAdd(): void {
    setMode("add");
    setEditingId(null);
    setFormName("");
    setFormIngredients([]);
  }

  /**
   * Opens the edit form pre-populated with the given meal's values.
   *
   * @param meal - The meal to edit.
   */
  function handleStartEdit(meal: Meal): void {
    setMode("edit");
    setEditingId(meal.id);
    setFormName(meal.name);
    setFormIngredients(meal.ingredients.map((i) => ({ ...i })));
  }

  /**
   * Discards the active form and returns to list mode.
   */
  function handleCancel(): void {
    setMode("list");
    setEditingId(null);
    setFormName("");
    setFormIngredients([]);
  }

  /**
   * Appends a blank ingredient row to the form.
   */
  function handleAddIngredientRow(): void {
    setFormIngredients((prev) => [...prev, { componentId: "", quantity: "" }]);
  }

  /**
   * Updates a single field in an ingredient row.
   *
   * @param index - Row index to update.
   * @param field - Field name to update.
   * @param value - New field value.
   */
  function handleIngredientChange(index: number, field: keyof IngredientRow, value: string): void {
    setFormIngredients((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  }

  /**
   * Removes an ingredient row by index.
   *
   * @param index - Row index to remove.
   */
  function handleRemoveIngredient(index: number): void {
    setFormIngredients((prev) => prev.filter((_, i) => i !== index));
  }

  /**
   * Commits the add or edit form. Rows with no component selected are discarded.
   *
   * @param event - The form submit event.
   */
  function handleSubmit(event: FormEvent): void {
    event.preventDefault();
    if (!canSave) return;
    const ingredients: MealIngredient[] = formIngredients
      .filter((row) => row.componentId !== "")
      .map(({ componentId, quantity }) => ({ componentId, quantity }));
    if (mode === "add") {
      addMeal(formName, ingredients);
    } else if (mode === "edit" && editingId) {
      updateMeal(editingId, formName, ingredients);
    }
    handleCancel();
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-app-border bg-app-surface p-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold">Meals</h2>
        {mode === "list" && (
          <button type="button" onClick={handleStartAdd} className={primaryButtonClassName}>
            + Add
          </button>
        )}
      </div>

      {mode !== "list" && (
        <form
          onSubmit={handleSubmit}
          className="space-y-3 rounded-md border border-app-accent/40 bg-app-panel p-3"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-app-muted">
            {mode === "add" ? "New Meal" : "Edit Meal"}
          </p>

          <input
            type="text"
            placeholder="Meal name"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            autoFocus
            className={inputClassName}
          />

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-app-muted">
              Ingredients
            </p>

            {components.length === 0 ? (
              <p className="text-xs text-app-muted">
                Add components first to build an ingredient list.
              </p>
            ) : (
              <>
                {formIngredients.map((row, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <select
                      aria-label={`Ingredient ${index + 1} component`}
                      value={row.componentId}
                      onChange={(e) => handleIngredientChange(index, "componentId", e.target.value)}
                      className="min-w-0 flex-1 rounded-md border border-app-border bg-app-bg px-2 py-2 text-sm text-app-text focus:border-app-accent/60 focus:outline-none focus:ring-2 focus:ring-app-accent/20"
                    >
                      <option value="">Select component…</option>
                      {components.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      aria-label={`Ingredient ${index + 1} quantity`}
                      placeholder="Quantity"
                      value={row.quantity}
                      onChange={(e) => handleIngredientChange(index, "quantity", e.target.value)}
                      className="w-28 rounded-md border border-app-border bg-app-bg px-2 py-2 text-sm text-app-text placeholder:text-app-muted/60 focus:border-app-accent/60 focus:outline-none focus:ring-2 focus:ring-app-accent/20"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveIngredient(index)}
                      aria-label={`Remove ingredient ${index + 1}`}
                      className="rounded-sm border border-app-border px-2 py-1.5 text-xs text-app-muted transition hover:border-red-400/60 hover:text-red-300"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={handleAddIngredientRow}
                  className="text-xs font-medium text-app-accent transition hover:text-app-accentStrong"
                >
                  + Add Ingredient
                </button>
              </>
            )}
          </div>

          <div className="flex gap-2">
            <button type="submit" disabled={!canSave} className={primaryButtonClassName}>
              Save
            </button>
            <button type="button" onClick={handleCancel} className={secondaryButtonClassName}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {meals.length === 0 ? (
        <p className="py-4 text-center text-sm text-app-muted">
          No meals yet. Add your first one above.
        </p>
      ) : (
        <ul className="space-y-2">
          {meals.map((meal) => {
            const isBeingEdited = mode === "edit" && editingId === meal.id;
            return (
              <li
                key={meal.id}
                className={`flex items-start justify-between gap-3 rounded-md border p-3 ${
                  isBeingEdited
                    ? "border-app-accent/50 bg-app-panel"
                    : "border-app-border bg-app-panel/60"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-app-text">{meal.name}</p>
                  <p className="truncate text-xs text-app-muted">
                    {formatIngredientSummary(meal, componentsById)}
                  </p>
                </div>
                {mode === "list" && (
                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      onClick={() => handleStartEdit(meal)}
                      className="rounded-sm border border-app-border px-2 py-0.5 text-xs text-app-muted transition hover:border-app-accent/60 hover:text-app-text"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteMeal(meal.id)}
                      className="rounded-sm border border-app-border px-2 py-0.5 text-xs text-app-muted transition hover:border-red-400/60 hover:text-red-300"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default MealsPanel;
