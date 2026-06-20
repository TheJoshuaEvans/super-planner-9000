import { describe, expect, it } from "vitest";
import { buildWorkDayPreviewBands, CALENDAR_PREVIEW_WORKDAY_MARKER_PERCENT } from "./workTrackerCalendarPreview";
import type { WorkEntry, WorkProject } from "../store/workTrackerStore.types";

const projects: WorkProject[] = [
  { id: "p1", name: "A", color: "#112233", clientId: "c1" },
  { id: "p2", name: "B", color: "#445566", clientId: "c1" }
];

function makeEntry(id: string, projectId: string, hours: number): WorkEntry {
  return { id, projectId, hours };
}

describe("CALENDAR_PREVIEW_WORKDAY_MARKER_PERCENT", () => {
  it("places the 8h reference line one third of the way across a 24h scale", () => {
    expect(CALENDAR_PREVIEW_WORKDAY_MARKER_PERCENT).toBeCloseTo(33.33, 1);
  });
});

describe("buildWorkDayPreviewBands", () => {
  it("returns no bands for an empty day", () => {
    expect(buildWorkDayPreviewBands([], projects)).toEqual([]);
  });

  it("builds one band per project proportional to the 24h scale", () => {
    const entries = [makeEntry("e1", "p1", 12)];
    const bands = buildWorkDayPreviewBands(entries, projects);
    expect(bands).toEqual([{ projectId: "p1", leftPercent: 0, widthPercent: 50, color: "#11223366" }]);
  });

  it("stacks multiple projects left to right in project order", () => {
    const entries = [makeEntry("e1", "p1", 6), makeEntry("e2", "p2", 6)];
    const bands = buildWorkDayPreviewBands(entries, projects);
    expect(bands[0]).toMatchObject({ projectId: "p1", leftPercent: 0, widthPercent: 25 });
    expect(bands[1]).toMatchObject({ projectId: "p2", leftPercent: 25, widthPercent: 25 });
  });

  it("clamps total width at 100% when hours exceed the scale", () => {
    const entries = [makeEntry("e1", "p1", 30)];
    const bands = buildWorkDayPreviewBands(entries, projects);
    expect(bands[0].widthPercent).toBe(100);
  });

  it("sums multiple entries for the same project before computing width", () => {
    const entries = [makeEntry("e1", "p1", 3), makeEntry("e2", "p1", 9)];
    const bands = buildWorkDayPreviewBands(entries, projects);
    expect(bands[0].widthPercent).toBe(50);
  });

  it("skips projects with no logged hours that day", () => {
    const entries = [makeEntry("e1", "p2", 4)];
    const bands = buildWorkDayPreviewBands(entries, projects);
    expect(bands).toHaveLength(1);
    expect(bands[0].projectId).toBe("p2");
  });
});
