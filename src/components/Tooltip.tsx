import { useLayoutEffect, useRef, type CSSProperties, type ReactNode, type RefObject } from "react";

type TooltipProps = {
  content: ReactNode;
  children: ReactNode;
  triggerClassName?: string;
  triggerStyle?: CSSProperties;
  boundaryRef?: RefObject<HTMLElement | null>;
  contentClassName?: string;
};

/**
 * Wraps any trigger element with a reusable hover/focus tooltip.
 */
function Tooltip({
  content,
  children,
  triggerClassName,
  triggerStyle,
  boundaryRef,
  contentClassName
}: TooltipProps) {
  const triggerRef = useRef<HTMLSpanElement | null>(null);
  const contentRef = useRef<HTMLSpanElement | null>(null);

  useLayoutEffect(() => {
    const triggerEl = triggerRef.current;
    const contentEl = contentRef.current;

    if (!triggerEl || !contentEl) {
      return;
    }

    const updateTooltipPosition = (): void => {
      const triggerWidth = triggerEl.getBoundingClientRect().width;
      const contentWidth = contentEl.getBoundingClientRect().width;
      const triggerRect = triggerEl.getBoundingClientRect();
      const boundaryEl = boundaryRef?.current;
      const boundaryRect = boundaryEl?.getBoundingClientRect() ?? triggerRect;
      const centeredLeft = triggerWidth / 2 - contentWidth / 2;
      const minLeft = boundaryRect.left - triggerRect.left;
      const maxLeft = boundaryRect.right - triggerRect.left - contentWidth;
      const clampedLeft = Math.max(minLeft, Math.min(maxLeft, centeredLeft));
      const shiftPx = clampedLeft - centeredLeft;

      contentEl.style.transform = `translateX(calc(-50% + ${shiftPx}px))`;
    };

    updateTooltipPosition();

    if (typeof ResizeObserver === "undefined") {
      const handleResize = (): void => updateTooltipPosition();
      window.addEventListener("resize", handleResize);

      return () => {
        window.removeEventListener("resize", handleResize);
        contentEl.style.transform = "";
      };
    }

    const observer = new ResizeObserver(() => updateTooltipPosition());
    observer.observe(triggerEl);
    observer.observe(contentEl);

    return () => {
      observer.disconnect();
      contentEl.style.transform = "";
    };
  }, [boundaryRef, content]);

  return (
    <span ref={triggerRef} className={`group/tooltip relative ${triggerClassName ?? "inline-flex items-center"}`.trim()} style={triggerStyle}>
      {children}
      <span
        ref={contentRef}
        role="tooltip"
        className={`pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md border border-app-border/80 bg-app-surfaceStrong px-2 py-1 text-xs font-medium text-app-text opacity-0 shadow-card transition-opacity duration-150 group-hover/tooltip:opacity-100 group-focus-within/tooltip:opacity-100 ${contentClassName ?? ""}`.trim()}
      >
        {content}
      </span>
    </span>
  );
}

export default Tooltip;
