import { create } from "zustand";

type ToastLevel = "info" | "success" | "warning" | "error";

export type ToastInput = {
  title: string;
  message?: string;
  level: ToastLevel;
};

export type ToastItem = ToastInput & {
  id: string;
};

type ToastState = {
  toasts: ToastItem[];
  showToast: (toast: ToastInput) => string;
  dismissToast: (id: string) => void;
  clearToasts: () => void;
};

let nextToastId = 0;

function createToastId(): string {
  nextToastId += 1;
  return `toast-${Date.now()}-${nextToastId}`;
}

/**
 * Global, reusable toast store for transient app notifications.
 */
export const useToastStore = create<ToastState>()((set) => ({
  toasts: [],
  showToast: (toast) => {
    const id = createToastId();

    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }]
    }));

    return id;
  },
  dismissToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id)
    })),
  clearToasts: () => set({ toasts: [] })
}));

export type { ToastLevel };
