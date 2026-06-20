import { Area, CartesianGrid, ComposedChart, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { WorkChartDataPoint } from "../../lib/workTrackerChart";
import type { WorkProject } from "../../store/workTrackerStore";

type WorkHoursChartProps = {
  data: WorkChartDataPoint[];
  projects: WorkProject[];
};

/**
 * Renders the monthly cumulative work-hours chart: a dashed "Expected" area (8h/workday running
 * total) behind a solid stacked-by-project "Actual" area (cumulative hours logged so far).
 */
function WorkHoursChart({ data, projects }: WorkHoursChartProps) {
  return (
    <section className="rounded-lg border border-app-border bg-app-surface p-4">
      <h3 className="mb-3 text-base font-semibold tracking-tight sm:text-lg">Hours Worked</h3>

      <ResponsiveContainer width="100%" height={320}>
        <ComposedChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
          <XAxis dataKey="day" stroke="var(--color-muted)" tick={{ fill: "var(--color-muted)", fontSize: 12 }} />
          <YAxis
            stroke="var(--color-muted)"
            tick={{ fill: "var(--color-muted)", fontSize: 12 }}
            label={{ value: "Hours Worked", angle: -90, position: "insideLeft", fill: "var(--color-muted)" }}
          />
          <Tooltip
            contentStyle={{ background: "var(--color-panel)", border: "1px solid var(--color-border)" }}
            labelStyle={{ color: "var(--color-text)" }}
          />
          <Legend />

          <Area
            type="monotone"
            dataKey="expectedCumulative"
            name="Expected"
            stroke="var(--color-muted)"
            strokeDasharray="6 4"
            fill="var(--color-muted)"
            fillOpacity={0.15}
            isAnimationActive={false}
          />

          {projects.map((project) => (
            <Area
              key={project.id}
              type="monotone"
              dataKey={project.id}
              name={project.name}
              stackId="actual"
              stroke={project.color}
              fill={project.color}
              fillOpacity={0.55}
              isAnimationActive={false}
            />
          ))}
        </ComposedChart>
      </ResponsiveContainer>

      {projects.length === 0 ? (
        <p className="mt-2 text-center text-sm text-app-muted">
          Add a project in Settings to start tracking actual hours.
        </p>
      ) : null}
    </section>
  );
}

export default WorkHoursChart;
