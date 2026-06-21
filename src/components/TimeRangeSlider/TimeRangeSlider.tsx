import { useRef, useState, type PointerEvent } from "react";
import {
  clientXToSlot,
  formatHourLabel,
  formatSlotDurationLabel,
  formatSlotLabelMeridiem,
  TOTAL_DAY_SLOTS
} from "../../lib/timeline";
import { endTimeToSlot, resolveDraggedSlot, slotToTimeString, startTimeToSlot } from "../../lib/timeRangeSlider";

type TimeRangeSliderProps = {
  /** "HH:MM" 24-hour string. */
  startTime: string;
  /** "HH:MM" 24-hour string; "00:00" means midnight at the end of the day. */
  endTime: string;
  onChange: (startTime: string, endTime: string) => void;
};

type GrabbedHandle = "start" | "end";

const LABEL_HOURS = [0, 6, 12, 18, 24];

/**
 * Horizontal 0-24h timeline with two draggable handles for picking a time range, with the span
 * between them filled to represent the selected duration. The handles are interchangeable:
 * dragging one past the other swaps which is "start" and which is "end", since the range is
 * always derived from whichever slot is lower/higher rather than from handle identity.
 */
function TimeRangeSlider({ startTime, endTime, onChange }: TimeRangeSliderProps) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const stationarySlotRef = useRef(0);
  const [grabbedHandle, setGrabbedHandle] = useState<GrabbedHandle | null>(null);

  const startSlot = startTimeToSlot(startTime);
  const endSlot = endTimeToSlot(endTime);
  const startPercent = (startSlot / TOTAL_DAY_SLOTS) * 100;
  const endPercent = (endSlot / TOTAL_DAY_SLOTS) * 100;

  /**
   * Begins a drag gesture on one handle, freezing the other handle's slot as the pivot that the
   * dragged slot is measured against for the rest of the gesture.
   */
  function handleHandlePointerDown(handle: GrabbedHandle, event: PointerEvent<HTMLButtonElement>): void {
    event.stopPropagation();
    stationarySlotRef.current = handle === "start" ? endSlot : startSlot;
    setGrabbedHandle(handle);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  /**
   * Updates the range on every pointer move during a drag, deriving start/end as the lower/higher
   * of the dragged slot and the frozen stationary slot so crossing past it swaps their roles.
   */
  function handleTrackPointerMove(event: PointerEvent<HTMLDivElement>): void {
    if (!grabbedHandle || !trackRef.current) return;

    const rect = trackRef.current.getBoundingClientRect();
    const rawSlot = clientXToSlot(event.clientX, rect.left, rect.width);
    const draggedSlot = resolveDraggedSlot(rawSlot, stationarySlotRef.current);

    onChange(
      slotToTimeString(Math.min(draggedSlot, stationarySlotRef.current)),
      slotToTimeString(Math.max(draggedSlot, stationarySlotRef.current))
    );
  }

  function handleTrackPointerUp(): void {
    setGrabbedHandle(null);
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold text-app-text">{formatSlotLabelMeridiem(startSlot)}</span>
        <span className="text-xs text-app-muted">{formatSlotDurationLabel(startSlot, endSlot)}</span>
        <span className="font-semibold text-app-text">{formatSlotLabelMeridiem(endSlot % TOTAL_DAY_SLOTS)}</span>
      </div>

      <div
        ref={trackRef}
        className="relative h-9 select-none rounded-md border border-app-border bg-app-bg"
        onPointerMove={handleTrackPointerMove}
        onPointerUp={handleTrackPointerUp}
        onPointerCancel={handleTrackPointerUp}
      >
        <div className="absolute inset-0 flex overflow-hidden rounded-md" aria-hidden="true">
          {Array.from({ length: TOTAL_DAY_SLOTS / 4 }, (_, hour) => (
            <div key={hour} className={`flex-1 ${hour > 0 ? "border-l border-app-border/40" : ""}`} />
          ))}
        </div>

        <div
          className="absolute inset-y-0 bg-app-accent opacity-30"
          style={{ left: `${startPercent}%`, width: `${endPercent - startPercent}%` }}
          aria-hidden="true"
        />

        <button
          type="button"
          onPointerDown={(event) => handleHandlePointerDown("start", event)}
          className="absolute top-1/2 z-10 h-7 w-3.5 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize rounded-sm border border-white/70 bg-app-accent shadow transition hover:scale-110"
          style={{ left: `${startPercent}%` }}
          aria-label={`Start time: ${formatSlotLabelMeridiem(startSlot)}`}
        />
        <button
          type="button"
          onPointerDown={(event) => handleHandlePointerDown("end", event)}
          className="absolute top-1/2 z-10 h-7 w-3.5 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize rounded-sm border border-white/70 bg-app-accent shadow transition hover:scale-110"
          style={{ left: `${endPercent}%` }}
          aria-label={`End time: ${formatSlotLabelMeridiem(endSlot % TOTAL_DAY_SLOTS)}`}
        />
      </div>

      <div className="relative h-3 text-[10px] text-app-muted">
        {LABEL_HOURS.map((hour, index) => {
          const isFirst = index === 0;
          const isLast = index === LABEL_HOURS.length - 1;

          return (
            <span
              key={hour}
              className={`absolute ${isFirst ? "left-0" : isLast ? "right-0" : "-translate-x-1/2"}`}
              style={isFirst || isLast ? undefined : { left: `${(hour / 24) * 100}%` }}
            >
              {formatHourLabel(hour)}
            </span>
          );
        })}
      </div>
    </div>
  );
}

export default TimeRangeSlider;
