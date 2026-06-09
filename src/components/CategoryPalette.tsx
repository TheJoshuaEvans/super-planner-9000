import type { PlannerCategory } from "../store/plannerStore";

type CategoryPaletteProps = {
  categories: PlannerCategory[];
  draggingCategoryId: string | null;
  onCategoryDragStart: (categoryId: string) => void;
};

/**
 * Renders draggable category chips for timeline placement.
 */
function CategoryPalette({ categories, draggingCategoryId, onCategoryDragStart }: CategoryPaletteProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {categories.map((category) => (
        <div
          key={category.id}
          role="button"
          tabIndex={0}
          className={`flex items-center gap-3 rounded-md border border-app-border bg-app-surfaceStrong px-3 py-3 text-left select-none transition hover:border-app-accent hover:bg-app-surface ${draggingCategoryId ? "cursor-grabbing" : "cursor-grab active:cursor-grabbing"}`}
          onPointerDown={() => onCategoryDragStart(category.id)}
        >
          <span aria-hidden="true" className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: category.color }} />
          <span className="font-medium text-app-text">{category.label}</span>
        </div>
      ))}
    </div>
  );
}

export default CategoryPalette;
