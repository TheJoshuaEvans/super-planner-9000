import { useMemo, useState } from "react";
import WorkEntryDock from "./WorkEntryDock";
import WorkHoursChart from "./WorkHoursChart";
import WorkTrackerCalendar from "./WorkTrackerCalendar";
import { formatCalendarDateLabel, getMonthStart } from "../../lib/calendar";
import { buildMonthlyWorkChartData } from "../../lib/workTrackerChart";
import { useTodayDateKey } from "../../hooks/useTodayDateKey";
import { useWorkTrackerStore } from "../../store/workTrackerStore";

/**
 * Work Tracker page: a monthly cumulative hours chart over a calendar for logging hours per
 * project per day. Fully self-contained, like the Meal Creator tab — it owns its own visible
 * month and selected-date state and renders its own docked entry editor.
 */
function WorkTracker() {
  const projects = useWorkTrackerStore((state) => state.projects);
  const entriesByDate = useWorkTrackerStore((state) => state.entriesByDate);

  const todayDateKey = useTodayDateKey();
  const [visibleMonth, setVisibleMonth] = useState<Date>(() => getMonthStart(new Date()));
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);

  const chartData = useMemo(
    () => buildMonthlyWorkChartData(visibleMonth, entriesByDate, projects),
    [visibleMonth, entriesByDate, projects]
  );

  return (
    <section className={`flex flex-1 flex-col gap-5 ${selectedDateKey ? "pb-64 lg:pb-72" : ""}`}>
      <WorkHoursChart data={chartData} projects={projects} />

      <WorkTrackerCalendar
        visibleMonth={visibleMonth}
        onVisibleMonthChange={setVisibleMonth}
        selectedDateKey={selectedDateKey}
        onSelectDate={setSelectedDateKey}
        entriesByDate={entriesByDate}
        projects={projects}
        todayDateKey={todayDateKey}
      />

      {selectedDateKey ? (
        <section className="fixed inset-x-0 bottom-0 z-50 px-4 pb-4 lg:px-6 lg:pb-5">
          <div className="mx-auto max-h-[70vh] w-full max-w-[96rem] overflow-y-auto rounded-lg border border-app-border bg-app-surface/95 p-4 shadow-card backdrop-blur">
            <WorkEntryDock
              dateKey={selectedDateKey}
              dateLabel={formatCalendarDateLabel(selectedDateKey)}
              entries={entriesByDate[selectedDateKey] ?? []}
              projects={projects}
              onClose={() => setSelectedDateKey(null)}
            />
          </div>
        </section>
      ) : null}
    </section>
  );
}

export default WorkTracker;
