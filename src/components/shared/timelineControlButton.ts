const TIMELINE_CONTROL_BUTTON_BASE_CLASS =
  "rounded-md border border-app-border bg-app-panel/85 px-2.5 py-1.5 text-xs font-semibold uppercase tracking-wide text-app-muted transition";

/**
 * Builds shared class names for timeline/history control buttons.
 *
 * @param enabled - Whether the button is interactive.
 * @returns Tailwind class string for enabled or disabled control state.
 */
export function getTimelineControlButtonClassName(enabled: boolean): string {
  if (enabled) {
    return `${TIMELINE_CONTROL_BUTTON_BASE_CLASS} hover:border-app-accent/70 hover:text-app-text`;
  }

  return `${TIMELINE_CONTROL_BUTTON_BASE_CLASS} cursor-not-allowed opacity-50`;
}
