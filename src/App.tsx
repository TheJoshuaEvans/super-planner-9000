import CategoryPalette from "./components/CategoryPalette";
import TimelineTrack from "./components/TimelineTrack";
import { usePlannerStore } from "./store/plannerStore";

/**
 * Composes the planner page shell from the timeline track and category palette.
 */
function App() {
  const categories = usePlannerStore((state) => state.categories);
  const segments = usePlannerStore((state) => state.segments);
  const addCategoryToFirstHour = usePlannerStore((state) => state.addCategoryToFirstHour);

  return (
    <main className="min-h-screen bg-app-bg text-app-text px-4 py-5 lg:px-6 lg:py-6">
      <section className="mx-auto flex min-h-[calc(100vh-2.5rem)] w-full max-w-[96rem] flex-col gap-5 rounded-lg bg-app-panel p-5 shadow-card lg:min-h-[calc(100vh-3rem)] lg:p-6">
        <header className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-app-muted">
              Daily Timeline Planner
            </p>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Super Planner 9000</h1>
            <p className="max-w-3xl text-sm text-app-muted sm:text-base">
              The day is modeled as a 24-hour number line split into 15-minute slots. This first implementation pass
              establishes the landscape workspace, fixed category palette, and timeline grid that the drag-and-resize
              editor will be built on.
            </p>
          </div>

          <div className="rounded-md border border-app-border bg-app-surface px-4 py-3 text-sm text-app-muted">
            <p>
              <span className="font-semibold text-app-text">Categories:</span> {categories.length}
            </p>
            <p>
              <span className="font-semibold text-app-text">Scheduled blocks:</span> {segments.length}
            </p>
          </div>
        </header>

        <section className="flex flex-1 flex-col gap-5">
          <TimelineTrack categories={categories} segments={segments} />
          <CategoryPalette categories={categories} onCategoryPress={addCategoryToFirstHour} />
        </section>
      </section>
    </main>
  );
}

export default App;
