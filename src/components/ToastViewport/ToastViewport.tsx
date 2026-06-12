import { useSettingsStore } from "../../store/settingsStore";
import { useToastStore } from "../../store/toastStore";
import ToastCard from "./ToastCard";

/**
 * Renders globally managed toasts, which dismiss manually by default or automatically after the
 * configured delay (see Settings > Notifications).
 */
function ToastViewport() {
  const toasts = useToastStore((state) => state.toasts);
  const autoDismissSeconds = useSettingsStore((state) => state.toastAutoDismissSeconds);

  if (toasts.length === 0) {
    return null;
  }

  return (
    <section className="pointer-events-none fixed left-1/2 top-4 z-[70] flex w-[min(42rem,calc(100vw-2rem))] -translate-x-1/2 flex-col gap-2">
      {toasts.map((toast) => (
        <ToastCard key={`${toast.id}-${autoDismissSeconds}`} toast={toast} autoDismissSeconds={autoDismissSeconds} />
      ))}
    </section>
  );
}

export default ToastViewport;
