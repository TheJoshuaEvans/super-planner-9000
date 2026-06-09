import { useToastStore } from "../store/toastStore";

const toastLevelClasses = {
  info: "border-sky-400/50 bg-sky-500/15 text-sky-100",
  success: "border-emerald-400/50 bg-emerald-500/15 text-emerald-100",
  warning: "border-amber-400/50 bg-amber-500/15 text-amber-100",
  error: "border-red-400/50 bg-red-500/15 text-red-100"
} as const;

const toastLevelLabels = {
  info: "Info",
  success: "Success",
  warning: "Warning",
  error: "Error"
} as const;

/**
 * Renders globally managed manual-dismiss toasts.
 */
function ToastViewport() {
  const toasts = useToastStore((state) => state.toasts);
  const dismissToast = useToastStore((state) => state.dismissToast);

  if (toasts.length === 0) {
    return null;
  }

  return (
    <section className="pointer-events-none fixed left-1/2 top-4 z-[70] flex w-[min(42rem,calc(100vw-2rem))] -translate-x-1/2 flex-col gap-2">
      {toasts.map((toast) => (
        <article
          key={toast.id}
          className={`pointer-events-auto rounded-lg border p-3 shadow-card backdrop-blur ${toastLevelClasses[toast.level]}`}
          role="status"
          aria-live="polite"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-80">
                {toastLevelLabels[toast.level]}
              </p>
              <h3 className="text-sm font-semibold">{toast.title}</h3>
              {toast.message ? <p className="text-sm leading-5 opacity-90">{toast.message}</p> : null}
            </div>

            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              className="rounded-md border border-current/20 px-2 py-1 text-xs font-semibold uppercase tracking-wide opacity-80 transition hover:opacity-100"
              aria-label={`Dismiss ${toastLevelLabels[toast.level]} toast`}
            >
              Close
            </button>
          </div>
        </article>
      ))}
    </section>
  );
}

export default ToastViewport;
