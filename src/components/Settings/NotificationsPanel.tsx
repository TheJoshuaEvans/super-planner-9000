import {
  clampToastAutoDismissSeconds,
  DEFAULT_TOAST_AUTO_DISMISS_SECONDS,
  TOAST_AUTO_DISMISS_MAX_SECONDS,
  TOAST_AUTO_DISMISS_MIN_SECONDS
} from "../../lib/toastSettings";
import { useSettingsStore } from "../../store/settingsStore";

/**
 * Settings panel for toast notification behavior: whether toasts auto-dismiss after a delay,
 * or remain until manually closed (the default).
 */
function NotificationsPanel() {
  const toastAutoDismissSeconds = useSettingsStore((state) => state.toastAutoDismissSeconds);
  const setToastAutoDismissSeconds = useSettingsStore((state) => state.setToastAutoDismissSeconds);
  const autoDismissEnabled = toastAutoDismissSeconds !== null;

  /**
   * Toggles automatic toast dismissal, seeding a default delay when first enabled.
   */
  function handleToggleAutoDismiss(enabled: boolean): void {
    setToastAutoDismissSeconds(enabled ? DEFAULT_TOAST_AUTO_DISMISS_SECONDS : null);
  }

  /**
   * Applies a clamped auto-dismiss delay from the number input.
   */
  function handleDelayChange(value: string): void {
    const parsed = Number.parseFloat(value);
    setToastAutoDismissSeconds(clampToastAutoDismissSeconds(parsed));
  }

  return (
    <section className="space-y-3 rounded-lg border border-app-border bg-app-surface/70 p-4">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-app-muted">Notifications</h3>
        <p className="text-sm text-app-text">
          Toast notifications stay on screen until you close them, unless you enable automatic dismissal below.
        </p>
      </div>

      <label className="flex items-start gap-2 text-sm text-app-text">
        <input
          type="checkbox"
          checked={autoDismissEnabled}
          onChange={(event) => handleToggleAutoDismiss(event.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-app-accent"
        />
        <span>Automatically dismiss toast notifications</span>
      </label>

      {autoDismissEnabled ? (
        <label className="flex items-center gap-2 text-sm text-app-text">
          <span>Dismiss after</span>
          <input
            type="number"
            inputMode="numeric"
            min={TOAST_AUTO_DISMISS_MIN_SECONDS}
            max={TOAST_AUTO_DISMISS_MAX_SECONDS}
            step="1"
            value={toastAutoDismissSeconds}
            onChange={(event) => handleDelayChange(event.target.value)}
            aria-label="Toast auto-dismiss delay in seconds"
            className="w-20 rounded-md border border-app-border bg-app-bg px-2 py-1.5 text-sm text-app-text focus:border-app-accent/60 focus:outline-none focus:ring-2 focus:ring-app-accent/20"
          />
          <span>seconds</span>
        </label>
      ) : null}
    </section>
  );
}

export default NotificationsPanel;
