import type { ReactNode } from "react";

type TooltipProps = {
  content: ReactNode;
  children: ReactNode;
  triggerClassName?: string;
  contentClassName?: string;
};

/**
 * Wraps any trigger element with a reusable hover/focus tooltip.
 */
function Tooltip({ content, children, triggerClassName, contentClassName }: TooltipProps) {
  return (
    <span className={`group/tooltip relative ${triggerClassName ?? "inline-flex items-center"}`.trim()}>
      {children}
      <span
        role="tooltip"
        className={`pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md border border-app-border/80 bg-app-surfaceStrong px-2 py-1 text-xs font-medium text-app-text opacity-0 shadow-card transition-opacity duration-150 group-hover/tooltip:opacity-100 group-focus-within/tooltip:opacity-100 ${contentClassName ?? ""}`.trim()}
      >
        {content}
      </span>
    </span>
  );
}

export default Tooltip;
