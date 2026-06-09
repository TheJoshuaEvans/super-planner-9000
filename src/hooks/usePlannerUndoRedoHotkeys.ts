import { useEffect } from "react";

type UsePlannerUndoRedoHotkeysOptions = {
  enabled: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
};

/**
 * Returns true when the event target is an editable element.
 *
 * @param target - Keyboard event target.
 * @returns Whether shortcut handling should be ignored.
 */
function isEditableTarget(target: EventTarget | null): boolean {
  if (!target || typeof target !== "object") {
    return false;
  }

  const candidate = target as { isContentEditable?: unknown; tagName?: unknown };

  if (candidate.isContentEditable === true) {
    return true;
  }

  if (typeof candidate.tagName !== "string") {
    return false;
  }

  const tagName = candidate.tagName.toLowerCase();
  return tagName === "input" || tagName === "textarea" || tagName === "select";
}

type UndoRedoHotkeyHandlerOptions = Pick<UsePlannerUndoRedoHotkeysOptions, "canUndo" | "canRedo" | "onUndo" | "onRedo">;

/**
 * Creates a keyboard event handler implementing Day Planner undo/redo shortcuts.
 *
 * @param options - Undo/redo availability flags and callbacks.
 * @returns Keydown handler suitable for window listeners.
 */
export function createPlannerUndoRedoKeydownHandler({
  canUndo,
  canRedo,
  onUndo,
  onRedo
}: UndoRedoHotkeyHandlerOptions): (event: KeyboardEvent) => void {
  return (event: KeyboardEvent): void => {
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

    const handleKeyDown = createPlannerUndoRedoKeydownHandler({
      canUndo,
      canRedo,
      onUndo,
      onRedo
    });

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [enabled, canUndo, canRedo, onUndo, onRedo]);
}
