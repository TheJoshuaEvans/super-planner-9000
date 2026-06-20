import { useMemo, useState } from "react";
import type { Meal } from "../../store/mealStore";

type SegmentEditorPanelProps = {
  /** e.g. "Eat — 2:00 PM - 3:00 PM" */
  contextLabel: string;
  /** Current persisted description (may be empty). */
  description: string;
  /** Whether to render the meal-assignment section below the description. */
  isEatSegment: boolean;
  meals: Meal[];
  selectedMealIds: string[];
  onToggleMeal: (mealId: string) => void;
  onSubmitMeals: () => void;
  /** Called with the trimmed description when the textarea blurs. */
  onDescriptionChange: (description: string) => void;
  onClose: () => void;
};

/**
 * Bottom-dock card for editing a selected timeline segment's description,
 * and (for Eat segments) assigning meals.
 */
function SegmentEditorPanel({
  contextLabel,
  description,
  isEatSegment,
  meals,
  selectedMealIds,
  onToggleMeal,
  onSubmitMeals,
  onDescriptionChange,
  onClose
}: SegmentEditorPanelProps) {
  const [localDescription, setLocalDescription] = useState(description);
  const sortedMeals = useMemo(() => [...meals].sort((a, b) => a.name.localeCompare(b.name)), [meals]);
  const selectedMealIdSet = useMemo(() => new Set(selectedMealIds), [selectedMealIds]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-app-muted">
          {contextLabel}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md border border-app-border px-2 py-1 text-xs font-medium text-app-muted transition hover:border-app-text hover:text-app-text"
          aria-label="Close segment editor"
        >
          Close
        </button>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-app-muted" htmlFor="segment-description">
          Description
        </label>
        <textarea
          id="segment-description"
          value={localDescription}
          onChange={(e) => setLocalDescription(e.target.value)}
          onBlur={() => onDescriptionChange(localDescription)}
          placeholder="Add a note..."
          rows={2}
          className="w-full resize-none rounded-md border border-app-border bg-app-surface px-3 py-2 text-sm text-app-text placeholder:text-app-muted/60 focus:border-app-accent focus:outline-none focus:ring-1 focus:ring-app-accent/40"
        />
      </div>

      {isEatSegment ? (
        <div className="space-y-3 border-t border-app-border pt-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-app-muted">
            Assign Meals
          </p>

          {sortedMeals.length === 0 ? (
            <p className="py-4 text-center text-sm text-app-muted">
              No meals yet. Add some in the Meal Creator tab first.
            </p>
          ) : (
            <div className="grid max-h-48 grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3 lg:grid-cols-4">
              {sortedMeals.map((meal) => {
                const isSelected = selectedMealIdSet.has(meal.id);

                return (
                  <label
                    key={meal.id}
                    className={`flex min-w-0 cursor-pointer items-start gap-2 rounded-md border bg-app-surfaceStrong p-3 transition ${
                      isSelected
                        ? "border-app-accent ring-1 ring-app-accent/60"
                        : "border-app-border hover:border-app-accent/60"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleMeal(meal.id)}
                      className="mt-0.5 h-4 w-4 shrink-0 accent-app-accent"
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-app-text">{meal.name}</span>
                      {meal.description ? (
                        <span className="block truncate text-xs text-app-muted">{meal.description}</span>
                      ) : null}
                    </span>
                  </label>
                );
              })}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="button"
              onClick={onSubmitMeals}
              className="rounded-md bg-app-accent px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-app-accentStrong"
            >
              Submit
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default SegmentEditorPanel;
