import { useMemo, type FormEvent } from "react";
import { isComponentNameTaken } from "../../lib/mealData";
import { useMealCreatorFormStore } from "../../store/mealCreatorFormStore";
import { useMealStore } from "../../store/mealStore";
import type { MealComponent } from "../../store/mealStore";

const inputClassName =
  "w-full rounded-md border border-app-border bg-app-bg px-3 py-2 text-sm text-app-text placeholder:text-app-muted/60 focus:border-app-accent/60 focus:outline-none focus:ring-2 focus:ring-app-accent/20";

const primaryButtonClassName =
  "rounded-md bg-app-accent px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-app-accentStrong disabled:cursor-not-allowed disabled:opacity-40";

const secondaryButtonClassName =
  "rounded-md border border-app-border bg-app-panel/85 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-app-muted transition hover:border-app-accent/70 hover:text-app-text";

/**
 * Panel for creating, editing, and deleting meal components.
 */
function ComponentsPanel() {
  const components = useMealStore((state) => state.components);
  const addComponent = useMealStore((state) => state.addComponent);
  const updateComponent = useMealStore((state) => state.updateComponent);
  const deleteComponent = useMealStore((state) => state.deleteComponent);

  const mode = useMealCreatorFormStore((s) => s.componentMode);
  const editingId = useMealCreatorFormStore((s) => s.componentEditingId);
  const formName = useMealCreatorFormStore((s) => s.componentFormName);
  const setForm = useMealCreatorFormStore((s) => s.setComponentForm);

  const sortedComponents = useMemo(
    () => [...components].sort((a, b) => a.name.localeCompare(b.name)),
    [components]
  );

  const nameTaken = isComponentNameTaken(components, formName, editingId ?? undefined);
  const canSave = formName.trim().length > 0 && !nameTaken;

  /**
   * Opens the add form with an empty state.
   */
  function handleStartAdd(): void {
    setForm({ componentMode: "add", componentEditingId: null, componentFormName: "" });
  }

  /**
   * Opens the edit form pre-populated with the given component's values.
   *
   * @param component - The component to edit.
   */
  function handleStartEdit(component: MealComponent): void {
    setForm({
      componentMode: "edit",
      componentEditingId: component.id,
      componentFormName: component.name,
    });
  }

  /**
   * Discards the active form and returns to list mode.
   */
  function handleCancel(): void {
    setForm({ componentMode: "list", componentEditingId: null, componentFormName: "" });
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
      addComponent(formName);
    } else if (mode === "edit" && editingId) {
      updateComponent(editingId, formName);
    }
    handleCancel();
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-app-border bg-app-surface p-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold">Components</h2>
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
            {mode === "add" ? "New Component" : "Edit Component"}
          </p>
          <div className="space-y-1">
            <input
              type="text"
              placeholder="Name"
              value={formName}
              onChange={(e) => setForm({ componentFormName: e.target.value })}
              autoFocus
              className={inputClassName}
            />
            {nameTaken && formName.trim().length > 0 && (
              <p className="text-xs text-red-400">A component with this name already exists.</p>
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

      {components.length === 0 ? (
        <p className="py-4 text-center text-sm text-app-muted">
          No components yet. Add your first one above.
        </p>
      ) : (
        <ul className="space-y-2">
          {sortedComponents.map((component) => {
            const isBeingEdited = mode === "edit" && editingId === component.id;
            return (
              <li
                key={component.id}
                className={`flex items-center justify-between gap-3 rounded-md border p-3 ${
                  isBeingEdited
                    ? "border-app-accent/50 bg-app-panel"
                    : "border-app-border bg-app-panel/60"
                }`}
              >
                <p className="truncate text-sm font-semibold text-app-text">{component.name}</p>
                {mode === "list" && (
                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      onClick={() => handleStartEdit(component)}
                      className="rounded-sm border border-app-border px-2 py-0.5 text-xs text-app-muted transition hover:border-app-accent/60 hover:text-app-text"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteComponent(component.id)}
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

export default ComponentsPanel;
