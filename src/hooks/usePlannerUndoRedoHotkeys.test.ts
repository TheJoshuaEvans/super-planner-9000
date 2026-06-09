import { describe, expect, it, vi } from "vitest";
import { createPlannerUndoRedoKeydownHandler } from "./usePlannerUndoRedoHotkeys";

type KeydownEventInit = {
  key?: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  target?: EventTarget | null;
};

function createKeyboardEvent(init: KeydownEventInit = {}): KeyboardEvent {
  const preventDefault = vi.fn();

  return {
    key: init.key ?? "z",
    ctrlKey: init.ctrlKey ?? false,
    metaKey: init.metaKey ?? false,
    altKey: init.altKey ?? false,
    shiftKey: init.shiftKey ?? false,
    target: init.target ?? null,
    preventDefault
  } as unknown as KeyboardEvent;
}

describe("createPlannerUndoRedoKeydownHandler", () => {
  it("triggers undo for Ctrl+Z when undo is available", () => {
    const onUndo = vi.fn();
    const onRedo = vi.fn();
    const handler = createPlannerUndoRedoKeydownHandler({ canUndo: true, canRedo: true, onUndo, onRedo });
    const event = createKeyboardEvent({ ctrlKey: true });

    handler(event);

    expect(onUndo).toHaveBeenCalledTimes(1);
    expect(onRedo).not.toHaveBeenCalled();
    expect(event.preventDefault).toHaveBeenCalledTimes(1);
  });

  it("triggers redo for Ctrl+Shift+Z when redo is available", () => {
    const onUndo = vi.fn();
    const onRedo = vi.fn();
    const handler = createPlannerUndoRedoKeydownHandler({ canUndo: true, canRedo: true, onUndo, onRedo });
    const event = createKeyboardEvent({ ctrlKey: true, shiftKey: true });

    handler(event);

    expect(onRedo).toHaveBeenCalledTimes(1);
    expect(onUndo).not.toHaveBeenCalled();
    expect(event.preventDefault).toHaveBeenCalledTimes(1);
  });

  it("ignores shortcuts when undo or redo is unavailable", () => {
    const onUndo = vi.fn();
    const onRedo = vi.fn();
    const handler = createPlannerUndoRedoKeydownHandler({ canUndo: false, canRedo: false, onUndo, onRedo });

    handler(createKeyboardEvent({ ctrlKey: true }));
    handler(createKeyboardEvent({ ctrlKey: true, shiftKey: true }));

    expect(onUndo).not.toHaveBeenCalled();
    expect(onRedo).not.toHaveBeenCalled();
  });

  it("ignores non-matching modifier combinations", () => {
    const onUndo = vi.fn();
    const onRedo = vi.fn();
    const handler = createPlannerUndoRedoKeydownHandler({ canUndo: true, canRedo: true, onUndo, onRedo });

    handler(createKeyboardEvent({ key: "x", ctrlKey: true }));
    handler(createKeyboardEvent({ key: "z" }));
    handler(createKeyboardEvent({ key: "z", ctrlKey: true, altKey: true }));

    expect(onUndo).not.toHaveBeenCalled();
    expect(onRedo).not.toHaveBeenCalled();
  });

  it("ignores shortcuts from editable targets", () => {
    const onUndo = vi.fn();
    const onRedo = vi.fn();
    const handler = createPlannerUndoRedoKeydownHandler({ canUndo: true, canRedo: true, onUndo, onRedo });

    const inputTarget = { tagName: "INPUT" } as unknown as EventTarget;
    const textareaTarget = { tagName: "textarea" } as unknown as EventTarget;
    const contentEditableTarget = { isContentEditable: true, tagName: "DIV" } as unknown as EventTarget;

    handler(createKeyboardEvent({ ctrlKey: true, target: inputTarget }));
    handler(createKeyboardEvent({ ctrlKey: true, target: textareaTarget }));
    handler(createKeyboardEvent({ ctrlKey: true, target: contentEditableTarget }));

    expect(onUndo).not.toHaveBeenCalled();
    expect(onRedo).not.toHaveBeenCalled();
  });
});
