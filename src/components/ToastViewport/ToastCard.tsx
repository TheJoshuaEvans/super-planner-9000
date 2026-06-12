import { useEffect, useState } from "react";
import { useToastStore } from "../../store/toastStore";
import type { ToastItem } from "../../store/toastStore";

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

type ToastCardProps = {
  toast: ToastItem;
  /** Seconds after which this toast should dismiss itself, or `null` to require manual dismissal. */
  autoDismissSeconds: number | null;
};

/**
 * Renders a single toast notification, optionally dismissing itself after `autoDismissSeconds`.
 */
function ToastCard({ toast, autoDismissSeconds }: ToastCardProps) {
  const dismissToast = useToastStore((state) => state.dismissToast);
  const [remainingSeconds, setRemainingSeconds] = useState(autoDismissSeconds);

  useEffect(() => {
    if (autoDismissSeconds === null) {
      return;
    }

    const timeoutId = window.setTimeout(() => dismissToast(toast.id), autoDismissSeconds * 1000);
    const intervalId = window.setInterval(() => {
      setRemainingSeconds((current) => (current === null ? null : Math.max(0, current - 1)));
    }, 1000);

    return () => {
      window.clearTimeout(timeoutId);
      window.clearInterval(intervalId);
    };
  }, [toast.id, autoDismissSeconds, dismissToast]);

  return (
    <article
      className={`pointer-events-auto rounded-lg border p-3 shadow-card backdrop-blur ${toastLevelClasses[toast.level]}`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-80">{toastLevelLabels[toast.level]}</p>
          <h3 className="text-sm font-semibold">{toast.title}</h3>
          {toast.message ? <p className="text-sm leading-5 opacity-90">{toast.message}</p> : null}
        </div>

        <button
          type="button"
          onClick={() => dismissToast(toast.id)}
          className="rounded-md border border-current/20 px-2 py-1 text-xs font-semibold uppercase tracking-wide opacity-80 transition hover:opacity-100"
          aria-label={`Dismiss ${toastLevelLabels[toast.level]} toast`}
        >
          Close{remainingSeconds !== null ? ` (${remainingSeconds})` : ""}
        </button>
      </div>
    </article>
  );
}

export default ToastCard;
