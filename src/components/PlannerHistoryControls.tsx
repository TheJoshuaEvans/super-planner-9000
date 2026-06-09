type PlannerHistoryControlsProps = {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
};

/**
 * Compact Day Planner history controls for the floating dock card.
 */
function PlannerHistoryControls({ canUndo, canRedo, onUndo, onRedo }: PlannerHistoryControlsProps) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onUndo}
        disabled={!canUndo}
        className={`rounded-md border px-2 py-1 text-[0.68rem] font-semibold uppercase tracking-wide transition ${
          canUndo
            ? "border-app-border bg-app-panel/85 text-app-muted hover:border-app-accent/70 hover:text-app-text"
            : "cursor-not-allowed border-app-border/70 bg-app-panel/45 text-app-muted/55"
        }`}
        aria-label="Undo day planner change"
      >
        Undo
      </button>

      <button
        type="button"
        onClick={onRedo}
        disabled={!canRedo}
        className={`rounded-md border px-2 py-1 text-[0.68rem] font-semibold uppercase tracking-wide transition ${
          canRedo
            ? "border-app-border bg-app-panel/85 text-app-muted hover:border-app-accent/70 hover:text-app-text"
            : "cursor-not-allowed border-app-border/70 bg-app-panel/45 text-app-muted/55"
        }`}
        aria-label="Redo day planner change"
      >
        Redo
      </button>
    </div>
  );
}

export default PlannerHistoryControls;
