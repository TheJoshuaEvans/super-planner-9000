import { formatHourLabel, hourMarks, TOTAL_DAY_SLOTS } from "../../lib/timeline";

type TimelineHourRulerProps = {
  /** Opacity of the accent gradient colors in the progress bar. Defaults to 0.15. */
  accentOpacity?: number;
};

/**
 * Renders the hour-label row and gradient progress bar shown above a timeline track.
 */
function TimelineHourRuler({ accentOpacity = 0.15 }: TimelineHourRulerProps) {
  return (
    <>
      <div className="h-4 px-3 text-[11px] leading-none text-app-muted">
        <div className="relative h-full">
          {hourMarks.map((hour) => {
            const isFirst = hour === 0;
            const isLast = hour === TOTAL_DAY_SLOTS / 4;
            const left = `${(hour / (TOTAL_DAY_SLOTS / 4)) * 100}%`;

            return (
              <span
                key={hour}
                className={`absolute top-0 ${isFirst ? "left-0 translate-x-0" : isLast ? "-translate-x-full" : "-translate-x-1/2"}`}
                style={{ left: isLast ? "100%" : left }}
              >
                {formatHourLabel(hour)}
              </span>
            );
          })}
        </div>
      </div>

      <div className="px-3">
        <div
          className="h-2 rounded-full border-[0.5px] border-app-border/65"
          style={{
            backgroundImage:
              `repeating-linear-gradient(to right, rgba(154,176,197,0.25) 0, rgba(154,176,197,0.25) 1.5px, transparent 1.5px, transparent calc(100% / 96)), repeating-linear-gradient(to right, rgba(237,246,255,0.55) 0, rgba(237,246,255,0.55) 2px, transparent 2px, transparent calc(100% / 24)), linear-gradient(to right, rgba(20,184,166,${accentOpacity}), rgba(59,130,246,${accentOpacity}))`
          }}
        />
      </div>
    </>
  );
}

export default TimelineHourRuler;
