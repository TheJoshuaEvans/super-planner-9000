import { describe, expect, it } from "vitest";
import { buildMonthlyWorkChartData } from "./workTrackerChart";
import type { WorkEntriesByDate, WorkProject } from "../store/workTrackerStore.types";

describe("buildMonthlyWorkChartData", () => {
  it("computes expected cumulative as 8h per workday, flat on weekends", () => {
    // June 2026: Jun 1 is a Monday, Jun 6-7 is a Sat/Sun.
    const points = buildMonthlyWorkChartData(new Date(2026, 5, 1), {}, []);
    expect(points[0].expectedCumulative).toBe(8); // Mon Jun 1
    expect(points[4].expectedCumulative).toBe(40); // Fri Jun 5
    expect(points[5].expectedCumulative).toBe(40); // Sat Jun 6, no growth
    expect(points[6].expectedCumulative).toBe(40); // Sun Jun 7, no growth
    expect(points[7].expectedCumulative).toBe(48); // Mon Jun 8
  });

  it("accumulates actual hours per project across the month, stacked-ready", () => {
    const entriesByDate: WorkEntriesByDate = {
      "2026-06-01": [{ id: "e1", projectId: "proj-a", hours: 4 }],
      "2026-06-02": [
        { id: "e2", projectId: "proj-a", hours: 2 },
        { id: "e3", projectId: "proj-b", hours: 3 }
      ]
    };
    const projects: WorkProject[] = [
      { id: "proj-a", name: "A", color: "#000", clientId: "c1" },
      { id: "proj-b", name: "B", color: "#111", clientId: "c1" }
    ];
    const points = buildMonthlyWorkChartData(new Date(2026, 5, 1), entriesByDate, projects);

    expect(points[0]["proj-a"]).toBe(4);
    expect(points[0]["proj-b"]).toBe(0);
    expect(points[1]["proj-a"]).toBe(6);
    expect(points[1]["proj-b"]).toBe(3);
    // Future days with no entries hold steady (no growth).
    expect(points[29]["proj-a"]).toBe(6);
    expect(points[29]["proj-b"]).toBe(3);
  });

  it("covers every day of the month even with no entries", () => {
    const points = buildMonthlyWorkChartData(new Date(2026, 1, 1), {}, []); // Feb 2026, 28 days
    expect(points).toHaveLength(28);
    expect(points[0].day).toBe(1);
    expect(points[27].day).toBe(28);
  });

  it("does not share the same running-totals object reference across points", () => {
    const entriesByDate: WorkEntriesByDate = {
      "2026-06-01": [{ id: "e1", projectId: "proj-a", hours: 4 }]
    };
    const projects: WorkProject[] = [{ id: "proj-a", name: "A", color: "#000", clientId: "c1" }];
    const points = buildMonthlyWorkChartData(new Date(2026, 5, 1), entriesByDate, projects);

    expect(points[0]["proj-a"]).toBe(4);
    expect(points[1]["proj-a"]).toBe(4);
    expect(points[0]).not.toBe(points[1]);
  });
});
