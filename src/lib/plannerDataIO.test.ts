import { describe, expect, it } from "vitest";
import {
  buildPlannerExportFilename,
  createPlannerDataExportEnvelope,
  parsePlannerDataImport,
  serializePlannerDataExport,
  PLANNER_DATA_EXPORT_APP,
  PLANNER_DATA_EXPORT_VERSION
} from "./plannerDataIO";

const samplePlannerData = {
  categories: [
    { id: "work", label: "Work", color: "#0f766e" }
  ],
  segmentsByDate: {
    "2026-06-09": [
      { id: "segment-1", categoryId: "work", startSlot: 4, endSlot: 8 }
    ]
  }
};

const sampleMealData = {
  components: [
    { id: "component-1", name: "Chicken" }
  ],
  meals: [
    {
      id: "meal-1",
      name: "Grilled Chicken",
      description: "Simple and healthy",
      ingredients: [{ componentId: "component-1", quantity: 200, unit: "g" }]
    }
  ]
};

const emptyWorkTrackerData = { clients: [], projects: [], entriesByDate: {} };

const sampleWorkTrackerData = {
  clients: [{ id: "client-1", name: "Acme Co" }],
  projects: [{ id: "project-1", name: "Website", color: "#E69F00", clientId: "client-1", hourlyRate: 45 }],
  entriesByDate: {
    "2026-06-09": [{ id: "entry-1", projectId: "project-1", hours: 4 }]
  }
};

describe("plannerDataIO", () => {
  it("creates a versioned export envelope", () => {
    const exportedAt = new Date("2026-06-09T12:34:56.000Z");
    const envelope = createPlannerDataExportEnvelope(samplePlannerData, sampleMealData, sampleWorkTrackerData, exportedAt);

    expect(envelope).toEqual({
      app: PLANNER_DATA_EXPORT_APP,
      version: PLANNER_DATA_EXPORT_VERSION,
      exportedAt: "2026-06-09T12:34:56.000Z",
      data: samplePlannerData,
      meals: sampleMealData,
      workTracker: sampleWorkTrackerData
    });
  });

  it("serializes export data as formatted json", () => {
    const text = serializePlannerDataExport(
      samplePlannerData,
      sampleMealData,
      sampleWorkTrackerData,
      new Date("2026-06-09T12:34:56.000Z")
    );

    expect(text).toContain("\n  \"app\": \"super-planner-9000\",");
    expect(text).toContain("\n  \"version\": 5,");
    expect(text).toContain("\n  \"data\": {");
    expect(text).toContain("\n  \"meals\": {");
    expect(text).toContain("\n  \"workTracker\": {");
  });

  it("strips non-persisted fields like history from exported planner data", () => {
    const exportedAt = new Date("2026-06-09T12:34:56.000Z");
    const envelope = createPlannerDataExportEnvelope(
      {
        ...samplePlannerData,
        history: {
          past: [{ categories: [], segmentsByDate: {} }],
          present: samplePlannerData,
          future: []
        }
      } as unknown as typeof samplePlannerData,
      sampleMealData,
      sampleWorkTrackerData,
      exportedAt
    );

    expect(envelope.data).toEqual(samplePlannerData);
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
      data: samplePlannerData,
      meals: sampleMealData,
      workTracker: sampleWorkTrackerData
    });

    const result = parsePlannerDataImport(payload);

    expect(result).toEqual({ ok: true, data: samplePlannerData, meals: sampleMealData, workTracker: sampleWorkTrackerData });
  });

  it("parses a valid payload with empty meals and work tracker data", () => {
    const emptyMeals = { components: [], meals: [] };
    const payload = JSON.stringify({
      app: PLANNER_DATA_EXPORT_APP,
      version: PLANNER_DATA_EXPORT_VERSION,
      exportedAt: "2026-06-09T12:34:56.000Z",
      data: samplePlannerData,
      meals: emptyMeals,
      workTracker: emptyWorkTrackerData
    });

    const result = parsePlannerDataImport(payload);

    expect(result).toEqual({ ok: true, data: samplePlannerData, meals: emptyMeals, workTracker: emptyWorkTrackerData });
  });

  it("rejects unsupported versions before validating the payload", () => {
    const result = parsePlannerDataImport(
      JSON.stringify({
        app: PLANNER_DATA_EXPORT_APP,
        version: 999,
        exportedAt: "2026-06-09T12:34:56.000Z",
        data: { categories: [], segmentsByDate: { broken: [{ bad: true }] } },
        meals: { components: [], meals: [] },
        workTracker: emptyWorkTrackerData
      })
    );

    expect(result).toEqual({ ok: false, error: "Unsupported import version: 999." });
  });

  it("rejects malformed planner data after version validation", () => {
    const result = parsePlannerDataImport(
      JSON.stringify({
        app: PLANNER_DATA_EXPORT_APP,
        version: PLANNER_DATA_EXPORT_VERSION,
        exportedAt: "2026-06-09T12:34:56.000Z",
        data: { categories: [], segmentsByDate: { broken: [{ bad: true }] } },
        meals: { components: [], meals: [] },
        workTracker: emptyWorkTrackerData
      })
    );

    expect(result).toEqual({ ok: false, error: "Import file does not contain valid planner data." });
  });

  it("rejects malformed meal data after planner data validates", () => {
    const result = parsePlannerDataImport(
      JSON.stringify({
        app: PLANNER_DATA_EXPORT_APP,
        version: PLANNER_DATA_EXPORT_VERSION,
        exportedAt: "2026-06-09T12:34:56.000Z",
        data: { categories: [], segmentsByDate: {} },
        meals: { components: [{ bad: true }], meals: [] },
        workTracker: emptyWorkTrackerData
      })
    );

    expect(result).toEqual({ ok: false, error: "Import file does not contain valid meal data." });
  });

  it("rejects a payload missing the meals key", () => {
    const result = parsePlannerDataImport(
      JSON.stringify({
        app: PLANNER_DATA_EXPORT_APP,
        version: PLANNER_DATA_EXPORT_VERSION,
        exportedAt: "2026-06-09T12:34:56.000Z",
        data: { categories: [], segmentsByDate: {} },
        workTracker: emptyWorkTrackerData
      })
    );

    expect(result).toEqual({ ok: false, error: "Import file does not contain valid meal data." });
  });

  it("rejects malformed work tracker data after meal data validates", () => {
    const result = parsePlannerDataImport(
      JSON.stringify({
        app: PLANNER_DATA_EXPORT_APP,
        version: PLANNER_DATA_EXPORT_VERSION,
        exportedAt: "2026-06-09T12:34:56.000Z",
        data: { categories: [], segmentsByDate: {} },
        meals: { components: [], meals: [] },
        workTracker: { clients: [], projects: [{ bad: true }], entriesByDate: {} }
      })
    );

    expect(result).toEqual({ ok: false, error: "Import file does not contain valid work tracker data." });
  });

  it("rejects a project missing a clientId", () => {
    const result = parsePlannerDataImport(
      JSON.stringify({
        app: PLANNER_DATA_EXPORT_APP,
        version: PLANNER_DATA_EXPORT_VERSION,
        exportedAt: "2026-06-09T12:34:56.000Z",
        data: { categories: [], segmentsByDate: {} },
        meals: { components: [], meals: [] },
        workTracker: {
          clients: [],
          projects: [{ id: "project-1", name: "Website", color: "#E69F00", hourlyRate: 45 }],
          entriesByDate: {}
        }
      })
    );

    expect(result).toEqual({ ok: false, error: "Import file does not contain valid work tracker data." });
  });

  it("rejects a project missing an hourlyRate", () => {
    const result = parsePlannerDataImport(
      JSON.stringify({
        app: PLANNER_DATA_EXPORT_APP,
        version: PLANNER_DATA_EXPORT_VERSION,
        exportedAt: "2026-06-09T12:34:56.000Z",
        data: { categories: [], segmentsByDate: {} },
        meals: { components: [], meals: [] },
        workTracker: {
          clients: [],
          projects: [{ id: "project-1", name: "Website", color: "#E69F00", clientId: "client-1" }],
          entriesByDate: {}
        }
      })
    );

    expect(result).toEqual({ ok: false, error: "Import file does not contain valid work tracker data." });
  });

  it("rejects a project with a negative hourlyRate", () => {
    const result = parsePlannerDataImport(
      JSON.stringify({
        app: PLANNER_DATA_EXPORT_APP,
        version: PLANNER_DATA_EXPORT_VERSION,
        exportedAt: "2026-06-09T12:34:56.000Z",
        data: { categories: [], segmentsByDate: {} },
        meals: { components: [], meals: [] },
        workTracker: {
          clients: [],
          projects: [{ id: "project-1", name: "Website", color: "#E69F00", clientId: "client-1", hourlyRate: -5 }],
          entriesByDate: {}
        }
      })
    );

    expect(result).toEqual({ ok: false, error: "Import file does not contain valid work tracker data." });
  });

  it("rejects an entry with negative hours", () => {
    const result = parsePlannerDataImport(
      JSON.stringify({
        app: PLANNER_DATA_EXPORT_APP,
        version: PLANNER_DATA_EXPORT_VERSION,
        exportedAt: "2026-06-09T12:34:56.000Z",
        data: { categories: [], segmentsByDate: {} },
        meals: { components: [], meals: [] },
        workTracker: {
          clients: [],
          projects: [],
          entriesByDate: { "2026-06-09": [{ id: "entry-1", projectId: "project-1", hours: -1 }] }
        }
      })
    );

    expect(result).toEqual({ ok: false, error: "Import file does not contain valid work tracker data." });
  });

  it("imports succeed even when an entry's projectId has no matching project", () => {
    const payload = JSON.stringify({
      app: PLANNER_DATA_EXPORT_APP,
      version: PLANNER_DATA_EXPORT_VERSION,
      exportedAt: "2026-06-09T12:34:56.000Z",
      data: { categories: [], segmentsByDate: {} },
      meals: { components: [], meals: [] },
      workTracker: {
        clients: [],
        projects: [],
        entriesByDate: { "2026-06-09": [{ id: "entry-1", projectId: "missing-project", hours: 4 }] }
      }
    });

    const result = parsePlannerDataImport(payload);

    expect(result.ok).toBe(true);
  });

  it("rejects invalid json", () => {
    const result = parsePlannerDataImport("not-json");

    expect(result).toEqual({ ok: false, error: "Import file is not valid JSON." });
  });

  it("round-trips assigned meal ids on eat segments", () => {
    const plannerDataWithMeals = {
      categories: samplePlannerData.categories,
      segmentsByDate: {
        "2026-06-09": [
          { id: "segment-eat", categoryId: "eat", startSlot: 32, endSlot: 36, assignedMealIds: ["meal-1"] }
        ]
      }
    };

    const envelope = createPlannerDataExportEnvelope(
      plannerDataWithMeals,
      sampleMealData,
      emptyWorkTrackerData,
      new Date("2026-06-09T12:34:56.000Z")
    );

    expect(envelope.data.segmentsByDate["2026-06-09"][0]).toMatchObject({
      assignedMealIds: ["meal-1"]
    });

    const result = parsePlannerDataImport(JSON.stringify(envelope));

    expect(result).toEqual({ ok: true, data: envelope.data, meals: sampleMealData, workTracker: emptyWorkTrackerData });
  });

  it("omits empty assignedMealIds from normalized export", () => {
    const plannerDataWithEmptyAssignment = {
      categories: samplePlannerData.categories,
      segmentsByDate: {
        "2026-06-09": [
          { id: "segment-eat", categoryId: "eat", startSlot: 32, endSlot: 36, assignedMealIds: [] }
        ]
      }
    };

    const envelope = createPlannerDataExportEnvelope(
      plannerDataWithEmptyAssignment,
      sampleMealData,
      emptyWorkTrackerData,
      new Date("2026-06-09T12:34:56.000Z")
    );

    expect(envelope.data.segmentsByDate["2026-06-09"][0]).not.toHaveProperty("assignedMealIds");
  });

  it("preserves segment description in export/import round-trip", () => {
    const plannerDataWithDescription = {
      categories: [{ id: "work", label: "Work", color: "#0f766e" }],
      segmentsByDate: {
        "2026-06-09": [{ id: "segment-1", categoryId: "work", startSlot: 4, endSlot: 8, description: "Focus time" }]
      }
    };

    const envelope = createPlannerDataExportEnvelope(
      plannerDataWithDescription,
      sampleMealData,
      emptyWorkTrackerData,
      new Date("2026-06-09T12:34:56.000Z")
    );

    expect(envelope.data.segmentsByDate["2026-06-09"][0].description).toBe("Focus time");

    const result = parsePlannerDataImport(JSON.stringify(envelope));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.segmentsByDate["2026-06-09"][0].description).toBe("Focus time");
    }
  });

  it("accepts segments without a description field", () => {
    const result = parsePlannerDataImport(
      JSON.stringify({
        app: PLANNER_DATA_EXPORT_APP,
        version: PLANNER_DATA_EXPORT_VERSION,
        exportedAt: "2026-06-09T12:34:56.000Z",
        data: {
          categories: [],
          segmentsByDate: {
            "2026-06-09": [{ id: "segment-1", categoryId: "work", startSlot: 0, endSlot: 4 }]
          }
        },
        meals: { components: [], meals: [] },
        workTracker: emptyWorkTrackerData
      })
    );

    expect(result).toMatchObject({ ok: true });
  });

  it("rejects segments with a non-string description", () => {
    const result = parsePlannerDataImport(
      JSON.stringify({
        app: PLANNER_DATA_EXPORT_APP,
        version: PLANNER_DATA_EXPORT_VERSION,
        exportedAt: "2026-06-09T12:34:56.000Z",
        data: {
          categories: [],
          segmentsByDate: {
            "2026-06-09": [{ id: "segment-1", categoryId: "work", startSlot: 0, endSlot: 4, description: 42 }]
          }
        },
        meals: { components: [], meals: [] },
        workTracker: emptyWorkTrackerData
      })
    );

    expect(result).toEqual({ ok: false, error: "Import file does not contain valid planner data." });
  });

  it("rejects segments with non-string assignedMealIds entries", () => {
    const result = parsePlannerDataImport(
      JSON.stringify({
        app: PLANNER_DATA_EXPORT_APP,
        version: PLANNER_DATA_EXPORT_VERSION,
        exportedAt: "2026-06-09T12:34:56.000Z",
        data: {
          categories: [],
          segmentsByDate: {
            "2026-06-09": [{ id: "segment-1", categoryId: "eat", startSlot: 0, endSlot: 4, assignedMealIds: [42] }]
          }
        },
        meals: { components: [], meals: [] },
        workTracker: emptyWorkTrackerData
      })
    );

    expect(result).toEqual({ ok: false, error: "Import file does not contain valid planner data." });
  });
});
