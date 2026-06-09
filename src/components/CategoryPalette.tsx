import type { PlannerCategory } from "../store/plannerStore";

type CategoryPaletteProps = {
  categories: PlannerCategory[];
  onCategoryPress: (categoryId: string) => void;
};

/**
 * Renders the fixed category buttons used to create starter timeline segments.
 */
function CategoryPalette({ categories, onCategoryPress }: CategoryPaletteProps) {
  return (
    <section className="flex flex-col gap-4 rounded-lg border border-app-border bg-app-surface p-4">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">Categories</h2>
        <p className="text-sm text-app-muted">
          Press a category to place a 1-hour block into the first hour of the day.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => onCategoryPress(category.id)}
            className="flex items-center gap-3 rounded-md border border-app-border bg-app-surfaceStrong px-3 py-3 text-left transition hover:border-app-accent hover:bg-app-surface"
          >
            <span aria-hidden="true" className="h-3 w-3 rounded-full" style={{ backgroundColor: category.color }} />
            <span className="font-medium text-app-text">{category.label}</span>
          </button>
        ))}
      </div>

      <div className="rounded-md border border-dashed border-app-border bg-app-panel px-3 py-4 text-sm text-app-muted">
        Current interaction slice:
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Press a category to fill the first hour.</li>
          <li>Existing data in the first hour is overwritten.</li>
          <li>Drag, move, and resize land next.</li>
        </ul>
      </div>
    </section>
  );
}

export default CategoryPalette;