import { useRef } from "react";
import { useMiniTimelineEvents } from "../../hooks/useMiniTimelineEvents";
import { formatMiniTimelineEventTooltip } from "../../lib/miniTimeline";
import { TOTAL_DAY_SLOTS } from "../../lib/timeline";
import { useSettingsStore } from "../../store/settingsStore";
import Tooltip from "../Tooltip/Tooltip";

type MiniTimelineProps = {
  /** Date (YYYY-MM-DD) this row shows Google Calendar events for. */
  dateKey: string;
};

/**
 * Read-only row appended to the bottom of a timeline track showing Google Calendar event titles
 * for a date, positioned on the same quarter-hour slot grid as the main timeline above it.
 * Renders nothing (reserving no extra space) if Google Calendar isn't connected or there are no
 * events for this date.
 */
function MiniTimeline({ dateKey }: MiniTimelineProps) {
  const googleCalendarConnected = useSettingsStore((state) => state.googleCalendarConnected);
  const { events } = useMiniTimelineEvents(dateKey);
  const trackRef = useRef<HTMLDivElement | null>(null);

  if (!googleCalendarConnected || events.length === 0) {
    return null;
  }

  return (
    <div className="relative h-[2rem] px-3 pb-1.5">
      <div ref={trackRef} className="relative h-full">
        {events.map((event, index) => {
          const left = `${(event.startSlot / TOTAL_DAY_SLOTS) * 100}%`;
          const width = `${((event.endSlot - event.startSlot) / TOTAL_DAY_SLOTS) * 100}%`;

          return (
            <Tooltip
              key={event.id}
              content={formatMiniTimelineEventTooltip(event)}
              triggerClassName={`!absolute inset-y-0 flex items-center overflow-visible rounded border px-1 text-[10px] font-medium leading-none ${
                event.isAllDay ? "border-dashed border-black/20" : "border-solid border-black/15"
              }`}
              triggerStyle={{
                left,
                width,
                zIndex: index + 1,
                backgroundColor: event.color.background,
                color: event.color.foreground
              }}
              boundaryRef={trackRef}
            >
              {event.htmlLink ? (
                <a
                  href={event.htmlLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-full w-full min-w-0 items-center truncate"
                >
                  {event.title}
                </a>
              ) : (
                <span className="min-w-0 truncate">{event.title}</span>
              )}
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
}

export default MiniTimeline;
