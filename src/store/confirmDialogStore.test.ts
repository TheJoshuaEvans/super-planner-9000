import { beforeEach, describe, expect, it, vi } from "vitest";
import { useConfirmDialogStore } from "./confirmDialogStore";

describe("confirmDialogStore", () => {
  beforeEach(() => {
    useConfirmDialogStore.getState().cancel();
  });

  it("opens a dialog with the requested options", () => {
    const onConfirm = vi.fn();

    useConfirmDialogStore.getState().requestConfirm({
      title: "Clear timeline?",
      message: "This removes all blocks.",
      tone: "danger",
      onConfirm
    });

    const { request } = useConfirmDialogStore.getState();

    expect(request).toMatchObject({
      title: "Clear timeline?",
      message: "This removes all blocks.",
      tone: "danger"
    });
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("runs the confirm callback and closes the dialog on confirm", () => {
    const onConfirm = vi.fn();

    useConfirmDialogStore.getState().requestConfirm({
      title: "Clear timeline?",
      message: "This removes all blocks.",
      onConfirm
    });

    useConfirmDialogStore.getState().confirm();

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(useConfirmDialogStore.getState().request).toBeNull();
  });

  it("closes the dialog without running the callback on cancel", () => {
    const onConfirm = vi.fn();

    useConfirmDialogStore.getState().requestConfirm({
      title: "Clear timeline?",
      message: "This removes all blocks.",
      onConfirm
    });

    useConfirmDialogStore.getState().cancel();

    expect(onConfirm).not.toHaveBeenCalled();
    expect(useConfirmDialogStore.getState().request).toBeNull();
  });

  it("replaces a pending request when a new one is made", () => {
    const firstConfirm = vi.fn();
    const secondConfirm = vi.fn();

    useConfirmDialogStore.getState().requestConfirm({
      title: "First",
      message: "First message",
      onConfirm: firstConfirm
    });

    useConfirmDialogStore.getState().requestConfirm({
      title: "Second",
      message: "Second message",
      onConfirm: secondConfirm
    });

    useConfirmDialogStore.getState().confirm();

    expect(firstConfirm).not.toHaveBeenCalled();
    expect(secondConfirm).toHaveBeenCalledTimes(1);
  });
});
