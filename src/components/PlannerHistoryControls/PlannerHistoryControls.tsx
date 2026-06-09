import { getTimelineControlButtonClassName } from "../shared/timelineControlButton";

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
        className={getTimelineControlButtonClassName(canUndo)}
        aria-label="Undo day planner change"
      >
        Undo
      </button>

      <button
        type="button"
        onClick={onRedo}
        disabled={!canRedo}
        className={getTimelineControlButtonClassName(canRedo)}
        aria-label="Redo day planner change"
      >
        Redo
      </button>
    </div>
  );
}

export default PlannerHistoryControls;
