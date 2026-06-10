import { quarterHourMarks } from "../../lib/timeline";

/**
 * Renders the absolute-positioned quarter-hour gridlines behind a timeline track's content.
 */
function TimelineQuarterHourGrid() {
  return (
    <div className="absolute inset-x-0 inset-y-3 grid grid-cols-96 overflow-hidden rounded-lg">
      {quarterHourMarks.map((slot) => {
        const isHourMark = slot % 4 === 0;

        return (
          <div key={slot} className={isHourMark ? "border-l border-app-border/90" : "border-l border-app-border/35"} />
        );
      })}
    </div>
  );
}

export default TimelineQuarterHourGrid;
