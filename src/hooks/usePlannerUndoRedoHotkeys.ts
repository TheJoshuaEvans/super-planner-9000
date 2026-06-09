import { useEffect } from "react";

type UsePlannerUndoRedoHotkeysOptions = {
  enabled: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
};

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  if (target.isContentEditable) {
    return true;
  }

  const tagName = target.tagName.toLowerCase();
  return tagName === "input" || tagName === "textarea" || tagName === "select";
}

/**
 * Registers Day Planner undo/redo keyboard shortcuts.
 */
export function usePlannerUndoRedoHotkeys({
  enabled,
  canUndo,
  canRedo,
  onUndo,
  onRedo
}: UsePlannerUndoRedoHotkeysOptions): void {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (isEditableTarget(event.target)) {
        return;
      }

      const key = event.key.toLowerCase();
      const hasModifier = event.ctrlKey || event.metaKey;

      if (!hasModifier || key !== "z" || event.altKey) {
        return;
      }

      if (event.shiftKey) {
        if (!canRedo) {
          return;
        }

        event.preventDefault();
        onRedo();
        return;
      }

      if (!canUndo) {
        return;
      }

      event.preventDefault();
      onUndo();
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [enabled, canUndo, canRedo, onUndo, onRedo]);
}
