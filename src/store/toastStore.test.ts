import { beforeEach, describe, expect, it } from "vitest";
import { useToastStore } from "./toastStore";

describe("toastStore", () => {
  beforeEach(() => {
    useToastStore.getState().clearToasts();
  });

  it("adds toasts with stable ids", () => {
    const id = useToastStore.getState().showToast({
      title: "Saved",
      message: "Your changes were stored.",
      level: "success"
    });

    const { toasts } = useToastStore.getState();

    expect(toasts).toHaveLength(1);
    expect(toasts[0]).toMatchObject({
      id,
      title: "Saved",
      message: "Your changes were stored.",
      level: "success"
    });
  });

  it("dismisses a toast by id", () => {
    const firstId = useToastStore.getState().showToast({
      title: "First",
      level: "info"
    });

    useToastStore.getState().showToast({
      title: "Second",
      level: "warning"
    });

    useToastStore.getState().dismissToast(firstId);

    const { toasts } = useToastStore.getState();

    expect(toasts).toHaveLength(1);
    expect(toasts[0].title).toBe("Second");
  });
});
