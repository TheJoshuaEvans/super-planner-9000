import { useState, type FormEvent } from "react";
import {
  countSegmentsUsingCategory,
  isCategoryLabelTaken,
  isProtectedCategory,
  pickNextCategoryColor
} from "../../lib/plannerCategories";
import { useConfirmDialogStore } from "../../store/confirmDialogStore";
import { usePlannerStore } from "../../store/plannerStore";
import type { PlannerCategory } from "../../store/plannerStore";

const inputClassName =
  "w-full rounded-md border border-app-border bg-app-bg px-3 py-2 text-sm text-app-text placeholder:text-app-muted/60 focus:border-app-accent/60 focus:outline-none focus:ring-2 focus:ring-app-accent/20";

const colorInputClassName = "h-9 w-12 cursor-pointer rounded-md border border-app-border bg-app-bg p-1";

const primaryButtonClassName =
  "rounded-md bg-app-accent px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-app-accentStrong disabled:cursor-not-allowed disabled:opacity-40";

const secondaryButtonClassName =
  "rounded-md border border-app-border bg-app-panel/85 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-app-muted transition hover:border-app-accent/70 hover:text-app-text";

const rowButtonClassName =
  "rounded-sm border border-app-border px-2 py-0.5 text-xs text-app-muted transition hover:border-app-accent/60 hover:text-app-text";

const rowDangerButtonClassName =
  "rounded-sm border border-app-border px-2 py-0.5 text-xs text-app-muted transition hover:border-red-400/60 hover:text-red-300";

type FormMode = "list" | "add" | "edit";

/**
 * Settings panel for adding, renaming, recoloring, and removing planner categories.
 * The "Eat" category cannot be removed because it powers meal assignment, but it can still
 * be renamed and recolored.
 */
function CategoriesPanel() {
  const categories = usePlannerStore((state) => state.categories);
  const segmentsByDate = usePlannerStore((state) => state.segmentsByDate);
  const addCategory = usePlannerStore((state) => state.addCategory);
  const updateCategory = usePlannerStore((state) => state.updateCategory);
  const removeCategory = usePlannerStore((state) => state.removeCategory);
  const requestConfirm = useConfirmDialogStore((state) => state.requestConfirm);

  const [mode, setMode] = useState<FormMode>("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formLabel, setFormLabel] = useState("");
  const [formColor, setFormColor] = useState("#000000");

  const nameTaken = isCategoryLabelTaken(categories, formLabel, editingId ?? undefined);
  const canSave = formLabel.trim().length > 0 && !nameTaken;

  /**
   * Opens the add form with an empty label and a suggested unused color.
   */
  function handleStartAdd(): void {
    setMode("add");
    setEditingId(null);
    setFormLabel("");
    setFormColor(pickNextCategoryColor(categories));
  }

  /**
   * Opens the edit form pre-populated with the given category's values.
   *
   * @param category - The category to edit.
   */
  function handleStartEdit(category: PlannerCategory): void {
    setMode("edit");
    setEditingId(category.id);
    setFormLabel(category.label);
    setFormColor(category.color);
  }

  /**
   * Discards the active form and returns to list mode.
   */
  function handleCancel(): void {
    setMode("list");
    setEditingId(null);
    setFormLabel("");
  }

  /**
   * Commits the add or edit form, then returns to list mode.
   *
   * @param event - The form submit event.
   */
  function handleSubmit(event: FormEvent): void {
    event.preventDefault();
    if (!canSave) return;
    if (mode === "add") {
      addCategory(formLabel, formColor);
    } else if (mode === "edit" && editingId) {
      updateCategory(editingId, { label: formLabel, color: formColor });
    }
    handleCancel();
  }

  /**
   * Removes a category, warning first if any timeline blocks would be deleted with it.
   *
   * @param category - The category to remove.
   */
  function handleDelete(category: PlannerCategory): void {
    const usageCount = countSegmentsUsingCategory(segmentsByDate, category.id);

    if (usageCount === 0) {
      removeCategory(category.id);
      return;
    }

    requestConfirm({
      title: "Remove category?",
      message: `"${category.label}" is used by ${usageCount} block${usageCount === 1 ? "" : "s"} on the timeline. Removing this category will delete those blocks too. You can undo this afterwards.`,
      confirmLabel: "Remove",
      tone: "danger",
      onConfirm: () => removeCategory(category.id)
    });
  }

  return (
    <section className="space-y-3 rounded-lg border border-app-border bg-app-surface/70 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-app-muted">Categories</h3>
          <p className="text-sm text-app-text">
            Add, rename, recolor, or remove the categories used for timeline blocks. "Eat" and "Work" cannot be
            removed because they power meal assignment and the Work Tracker, but both can still be renamed and
            recolored.
          </p>
        </div>
        {mode === "list" && (
          <button type="button" onClick={handleStartAdd} className={`shrink-0 ${primaryButtonClassName}`}>
            + Add category
          </button>
        )}
      </div>

      {mode !== "list" && (
        <form onSubmit={handleSubmit} className="space-y-3 rounded-md border border-app-accent/40 bg-app-panel p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-app-muted">
            {mode === "add" ? "New Category" : "Edit Category"}
          </p>
          <div className="flex flex-wrap items-start gap-3">
            <div className="min-w-[10rem] flex-1 space-y-1">
              <input
                type="text"
                placeholder="Label"
                value={formLabel}
                onChange={(e) => setFormLabel(e.target.value)}
                autoFocus
                className={inputClassName}
              />
              {nameTaken && formLabel.trim().length > 0 && (
                <p className="text-xs text-red-400">A category with this name already exists.</p>
              )}
            </div>
            <input
              type="color"
              value={formColor}
              onChange={(e) => setFormColor(e.target.value)}
              aria-label="Category color"
              className={colorInputClassName}
            />
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

      <ul className="space-y-2">
        {categories.map((category) => {
          const isBeingEdited = mode === "edit" && editingId === category.id;

          return (
            <li
              key={category.id}
              className={`flex items-center justify-between gap-3 rounded-md border p-3 ${
                isBeingEdited ? "border-app-accent/50 bg-app-panel" : "border-app-border bg-app-panel/60"
              }`}
            >
              <div className="flex min-w-0 items-center gap-2">
                <span
                  aria-hidden="true"
                  className="h-4 w-4 shrink-0 rounded-full border border-app-border"
                  style={{ backgroundColor: category.color }}
                />
                <p className="truncate text-sm font-semibold text-app-text">{category.label}</p>
              </div>
              {mode === "list" && (
                <div className="flex shrink-0 gap-1">
                  <button type="button" onClick={() => handleStartEdit(category)} className={rowButtonClassName}>
                    Edit
                  </button>
                  {!isProtectedCategory(category.id) && (
                    <button type="button" onClick={() => handleDelete(category)} className={rowDangerButtonClassName}>
                      Delete
                    </button>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default CategoriesPanel;
