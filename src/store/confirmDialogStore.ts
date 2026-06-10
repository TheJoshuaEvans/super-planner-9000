import { create } from "zustand";

/** Visual emphasis for a confirmation dialog's confirm button. */
export type ConfirmDialogTone = "default" | "danger";

/** Options used to request a confirmation dialog. */
export type ConfirmDialogRequest = {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmDialogTone;
  onConfirm: () => void;
};

type ConfirmDialogState = {
  request: ConfirmDialogRequest | null;
  /** Opens the confirmation dialog with the given options, replacing any pending request. */
  requestConfirm: (request: ConfirmDialogRequest) => void;
  /** Runs the pending request's confirm callback and closes the dialog. */
  confirm: () => void;
  /** Closes the dialog without running the confirm callback. */
  cancel: () => void;
};

/**
 * Global, reusable store backing a single app-wide confirmation dialog.
 */
export const useConfirmDialogStore = create<ConfirmDialogState>()((set, get) => ({
  request: null,
  requestConfirm: (request) => set({ request }),
  confirm: () => {
    const { request } = get();
    set({ request: null });
    request?.onConfirm();
  },
  cancel: () => set({ request: null })
}));
