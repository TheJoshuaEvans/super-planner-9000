import { describe, expect, it } from "vitest";
import {
  buildPlannerExportFilename,
  createPlannerDataExportEnvelope,
  parsePlannerDataImport,
  serializePlannerDataExport,
  PLANNER_DATA_EXPORT_APP,
  PLANNER_DATA_EXPORT_VERSION
} from "./plannerDataIO";

const sampleData = {
  categories: [
    { id: "work", label: "Work", color: "#0f766e" }
  ],
  segmentsByDate: {
    "2026-06-09": [
      { id: "segment-1", categoryId: "work", startSlot: 4, endSlot: 8 }
    ]
  }
};

describe("plannerDataIO", () => {
  it("creates a versioned export envelope", () => {
    const exportedAt = new Date("2026-06-09T12:34:56.000Z");
    const envelope = createPlannerDataExportEnvelope(sampleData, exportedAt);

    expect(envelope).toEqual({
      app: PLANNER_DATA_EXPORT_APP,
      version: PLANNER_DATA_EXPORT_VERSION,
      exportedAt: "2026-06-09T12:34:56.000Z",
      data: sampleData
    });
  });

  it("serializes export data as formatted json", () => {
    const text = serializePlannerDataExport(sampleData, new Date("2026-06-09T12:34:56.000Z"));

    expect(text).toContain("\n  \"app\": \"super-planner-9000\",");
    expect(text).toContain("\n  \"version\": 1,");
    expect(text).toContain("\n  \"data\": {");
  });

  it("strips non-persisted fields like history from exported data", () => {
    const exportedAt = new Date("2026-06-09T12:34:56.000Z");
    const envelope = createPlannerDataExportEnvelope(
      {
        ...sampleData,
        history: {
          past: [{ categories: [], segmentsByDate: {} }],
          present: sampleData,
          future: []
        }
      } as unknown as typeof sampleData,
      exportedAt
    );

    expect(envelope.data).toEqual(sampleData);
    expect(envelope.data).not.toHaveProperty("history");
  });

  it("builds a predictable export filename", () => {
    const filename = buildPlannerExportFilename(new Date("2026-06-09T12:34:56.000Z"));

    expect(filename).toBe("super-planner-9000-export-2026-06-09T12-34-56-000Z.json");
  });

  it("parses a valid export payload", () => {
    const payload = JSON.stringify({
      app: PLANNER_DATA_EXPORT_APP,
      version: PLANNER_DATA_EXPORT_VERSION,
      exportedAt: "2026-06-09T12:34:56.000Z",
      data: sampleData
    });

    const result = parsePlannerDataImport(payload);

    expect(result).toEqual({ ok: true, data: sampleData });
  });

  it("rejects unsupported versions before validating the payload", () => {
    const result = parsePlannerDataImport(
      JSON.stringify({
        app: PLANNER_DATA_EXPORT_APP,
        version: 999,
        exportedAt: "2026-06-09T12:34:56.000Z",
        data: { categories: [], segmentsByDate: { broken: [{ bad: true }] } }
      })
    );

    expect(result).toEqual({ ok: false, error: "Unsupported import version: 999." });
  });

  it("rejects malformed data after version validation", () => {
    const result = parsePlannerDataImport(
      JSON.stringify({
        app: PLANNER_DATA_EXPORT_APP,
        version: PLANNER_DATA_EXPORT_VERSION,
        exportedAt: "2026-06-09T12:34:56.000Z",
        data: { categories: [], segmentsByDate: { broken: [{ bad: true }] } }
      })
    );

    expect(result).toEqual({ ok: false, error: "Import file does not contain valid planner data." });
  });

  it("rejects invalid json", () => {
    const result = parsePlannerDataImport("not-json");

    expect(result).toEqual({ ok: false, error: "Import file is not valid JSON." });
  });
});
