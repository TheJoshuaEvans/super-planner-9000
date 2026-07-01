import { describe, expect, it } from "vitest";
import { migratePlannerDataExport, PLANNER_DATA_MIGRATIONS, type PlannerDataMigrationStep } from "./plannerDataMigrations";

describe("migratePlannerDataExport — generic chaining engine", () => {
  const steps: PlannerDataMigrationStep[] = [
    { fromVersion: 1, migrate: (raw) => ({ ...raw, version: 2, addedAtV2: true }) },
    { fromVersion: 2, migrate: (raw) => ({ ...raw, version: 3, addedAtV3: true }) }
  ];

  it("applies a single matching step", () => {
    const result = migratePlannerDataExport({ version: 1 }, 2, steps);
    expect(result).toEqual({ version: 2, addedAtV2: true });
  });

  it("chains multiple steps to reach the target version", () => {
    const result = migratePlannerDataExport({ version: 1 }, 3, steps);
    expect(result).toEqual({ version: 3, addedAtV2: true, addedAtV3: true });
  });

  it("does nothing when already at the target version", () => {
    const input = { version: 3, untouched: "value" };
    const result = migratePlannerDataExport(input, 3, steps);
    expect(result).toEqual(input);
  });

  it("does nothing when above the target version", () => {
    const input = { version: 5, untouched: "value" };
    const result = migratePlannerDataExport(input, 3, steps);
    expect(result).toEqual(input);
  });

  it("stops and returns as-is when no step is registered for the current version", () => {
    const input = { version: 7, untouched: "value" };
    const result = migratePlannerDataExport(input, 9, steps);
    expect(result).toEqual(input);
  });

  it("stops and returns as-is when version is missing or non-numeric", () => {
    expect(migratePlannerDataExport({ untouched: "value" }, 3, steps)).toEqual({ untouched: "value" });
    expect(migratePlannerDataExport({ version: "not-a-number" }, 3, steps)).toEqual({ version: "not-a-number" });
  });
});

describe("migratePlannerDataExport — registered v6 -> v7 step", () => {
  const blankUserContactInfo = {
    name: "",
    email: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: ""
  };

  it("backfills a blank userContactInfo and bumps the version", () => {
    const v6Envelope = {
      app: "super-planner-9000",
      version: 6,
      exportedAt: "2026-06-09T12:34:56.000Z",
      data: { categories: [], segmentsByDate: {} },
      meals: { components: [], meals: [] },
      workTracker: {
        clients: [{ id: "client-1", name: "Acme Co", contactName: "Jane Doe", contactEmail: "jane@acme.com" }],
        projects: [],
        entriesByDate: {}
      }
    };

    const migrated = migratePlannerDataExport(v6Envelope, 7, PLANNER_DATA_MIGRATIONS);

    expect(migrated.version).toBe(7);
    expect(migrated.workTracker).toEqual({
      clients: v6Envelope.workTracker.clients,
      projects: [],
      entriesByDate: {},
      userContactInfo: blankUserContactInfo
    });
    expect(migrated.data).toBe(v6Envelope.data);
    expect(migrated.meals).toBe(v6Envelope.meals);
    expect(migrated.app).toBe(v6Envelope.app);
    expect(migrated.exportedAt).toBe(v6Envelope.exportedAt);
  });

  it("tolerates a missing or malformed workTracker without throwing", () => {
    const migrated = migratePlannerDataExport({ version: 6 }, 7, PLANNER_DATA_MIGRATIONS);

    expect(migrated.version).toBe(7);
    expect(migrated.workTracker).toEqual({ userContactInfo: blankUserContactInfo });
  });

  it("leaves a v4 (or older) envelope untouched, since no migration is registered for it", () => {
    const v4Envelope = { version: 4, workTracker: { clients: [], projects: [], entriesByDate: {} } };
    const migrated = migratePlannerDataExport(v4Envelope, 7, PLANNER_DATA_MIGRATIONS);

    expect(migrated).toEqual(v4Envelope);
  });
});

describe("migratePlannerDataExport — registered v5 -> v6 step", () => {
  it("backfills blank contactName/contactEmail on a client missing them, and bumps the version", () => {
    const v5Envelope = {
      version: 5,
      workTracker: {
        clients: [{ id: "client-1", name: "Acme Co" }],
        projects: [{ id: "project-1", name: "Website", color: "#E69F00", clientId: "client-1", hourlyRate: 45 }],
        entriesByDate: {}
      }
    };

    const migrated = migratePlannerDataExport(v5Envelope, 6, PLANNER_DATA_MIGRATIONS);

    expect(migrated.version).toBe(6);
    expect(migrated.workTracker).toEqual({
      clients: [{ id: "client-1", name: "Acme Co", contactName: "", contactEmail: "" }],
      projects: v5Envelope.workTracker.projects,
      entriesByDate: {}
    });
  });

  it("preserves a client's existing contactName/contactEmail if already present", () => {
    const v5Envelope = {
      version: 5,
      workTracker: {
        clients: [{ id: "client-1", name: "Acme Co", contactName: "Jane Doe", contactEmail: "jane@acme.com" }],
        projects: [],
        entriesByDate: {}
      }
    };

    const migrated = migratePlannerDataExport(v5Envelope, 6, PLANNER_DATA_MIGRATIONS);

    expect(migrated.workTracker).toMatchObject({
      clients: [{ id: "client-1", name: "Acme Co", contactName: "Jane Doe", contactEmail: "jane@acme.com" }]
    });
  });

  it("backfills only the missing field when one of contactName/contactEmail is already present", () => {
    const v5Envelope = {
      version: 5,
      workTracker: {
        clients: [{ id: "client-1", name: "Acme Co", contactName: "Jane Doe" }],
        projects: [],
        entriesByDate: {}
      }
    };

    const migrated = migratePlannerDataExport(v5Envelope, 6, PLANNER_DATA_MIGRATIONS);

    expect(migrated.workTracker).toMatchObject({
      clients: [{ id: "client-1", name: "Acme Co", contactName: "Jane Doe", contactEmail: "" }]
    });
  });

  it("tolerates a missing workTracker or clients array without throwing", () => {
    expect(() => migratePlannerDataExport({ version: 5 }, 6, PLANNER_DATA_MIGRATIONS)).not.toThrow();

    const migrated = migratePlannerDataExport({ version: 5, workTracker: {} }, 6, PLANNER_DATA_MIGRATIONS);
    expect(migrated.workTracker).toEqual({ clients: [] });
  });

  it("chains through v6 to reach v7, backfilling both clients and userContactInfo", () => {
    const v5Envelope = {
      version: 5,
      workTracker: {
        clients: [{ id: "client-1", name: "Acme Co" }],
        projects: [],
        entriesByDate: {}
      }
    };

    const migrated = migratePlannerDataExport(v5Envelope, 7, PLANNER_DATA_MIGRATIONS);

    expect(migrated.version).toBe(7);
    expect(migrated.workTracker).toMatchObject({
      clients: [{ id: "client-1", name: "Acme Co", contactName: "", contactEmail: "" }],
      userContactInfo: { name: "", email: "", phone: "" }
    });
  });
});

describe("migratePlannerDataExport — registered v7 -> v8 step", () => {
  it("backfills a placeholder clientCode on a client missing one, and bumps the version", () => {
    const v7Envelope = {
      version: 7,
      workTracker: {
        clients: [{ id: "client-1", name: "Acme Co", contactName: "Jane Doe", contactEmail: "jane@acme.com" }],
        projects: [],
        entriesByDate: {}
      }
    };

    const migrated = migratePlannerDataExport(v7Envelope, 8, PLANNER_DATA_MIGRATIONS);

    expect(migrated.version).toBe(8);
    expect(migrated.workTracker).toEqual({
      clients: [
        { id: "client-1", name: "Acme Co", contactName: "Jane Doe", contactEmail: "jane@acme.com", clientCode: "C01" }
      ],
      projects: [],
      entriesByDate: {},
      invoiceSequenceByPeriod: {}
    });
  });

  it("preserves a client's existing valid clientCode", () => {
    const v7Envelope = {
      version: 7,
      workTracker: {
        clients: [{ id: "client-1", name: "Acme Co", clientCode: "XYZ" }],
        projects: [],
        entriesByDate: {}
      }
    };

    const migrated = migratePlannerDataExport(v7Envelope, 8, PLANNER_DATA_MIGRATIONS);

    expect(migrated.workTracker).toMatchObject({ clients: [{ id: "client-1", clientCode: "XYZ" }] });
  });

  it("assigns different placeholder codes to multiple clients that both lack one", () => {
    const v7Envelope = {
      version: 7,
      workTracker: {
        clients: [
          { id: "client-1", name: "Acme Co" },
          { id: "client-2", name: "Globex" }
        ],
        projects: [],
        entriesByDate: {}
      }
    };

    const migrated = migratePlannerDataExport(v7Envelope, 8, PLANNER_DATA_MIGRATIONS);
    const workTracker = migrated.workTracker as { clients: { id: string; clientCode: string }[] };
    const codes = workTracker.clients.map((client) => client.clientCode);

    expect(codes).toEqual(["C01", "C02"]);
  });

  it("skips a placeholder code that collides with a client's existing real code", () => {
    const v7Envelope = {
      version: 7,
      workTracker: {
        clients: [
          { id: "client-1", name: "Has a real code", clientCode: "C01" },
          { id: "client-2", name: "Needs a placeholder" }
        ],
        projects: [],
        entriesByDate: {}
      }
    };

    const migrated = migratePlannerDataExport(v7Envelope, 8, PLANNER_DATA_MIGRATIONS);
    const workTracker = migrated.workTracker as { clients: { id: string; clientCode: string }[] };

    expect(workTracker.clients.find((client) => client.id === "client-2")?.clientCode).toBe("C02");
  });

  it("backfills an empty invoiceSequenceByPeriod", () => {
    const migrated = migratePlannerDataExport({ version: 7, workTracker: { clients: [] } }, 8, PLANNER_DATA_MIGRATIONS);

    expect(migrated.workTracker).toMatchObject({ invoiceSequenceByPeriod: {} });
  });

  it("tolerates a missing workTracker or clients array without throwing", () => {
    expect(() => migratePlannerDataExport({ version: 7 }, 8, PLANNER_DATA_MIGRATIONS)).not.toThrow();

    const migrated = migratePlannerDataExport({ version: 7, workTracker: {} }, 8, PLANNER_DATA_MIGRATIONS);
    expect(migrated.workTracker).toMatchObject({ clients: [], invoiceSequenceByPeriod: {} });
  });

  it("chains all the way from v5 to v8 in one call", () => {
    const v5Envelope = {
      version: 5,
      workTracker: {
        clients: [{ id: "client-1", name: "Acme Co" }],
        projects: [],
        entriesByDate: {}
      }
    };

    const migrated = migratePlannerDataExport(v5Envelope, 8, PLANNER_DATA_MIGRATIONS);

    expect(migrated.version).toBe(8);
    expect(migrated.workTracker).toMatchObject({
      clients: [{ id: "client-1", name: "Acme Co", contactName: "", contactEmail: "", clientCode: "C01" }],
      userContactInfo: { name: "", email: "", phone: "" },
      invoiceSequenceByPeriod: {}
    });
  });
});

describe("migratePlannerDataExport — registered v8 -> v9 step", () => {
  it("backfills paymentTerms to 30 on a client missing it, and bumps the version", () => {
    const v8Envelope = {
      version: 8,
      workTracker: {
        clients: [{ id: "client-1", name: "Acme Co", clientCode: "ABC" }],
        projects: [],
        entriesByDate: {},
        invoiceSequenceByPeriod: {}
      }
    };

    const migrated = migratePlannerDataExport(v8Envelope, 9, PLANNER_DATA_MIGRATIONS);

    expect(migrated.version).toBe(9);
    expect(migrated.workTracker).toEqual({
      clients: [{ id: "client-1", name: "Acme Co", clientCode: "ABC", paymentTerms: 30 }],
      projects: [],
      entriesByDate: {},
      invoiceSequenceByPeriod: {}
    });
  });

  it("preserves a client's existing valid paymentTerms", () => {
    const v8Envelope = {
      version: 8,
      workTracker: {
        clients: [{ id: "client-1", name: "Acme Co", clientCode: "ABC", paymentTerms: 14 }],
        projects: [],
        entriesByDate: {}
      }
    };

    const migrated = migratePlannerDataExport(v8Envelope, 9, PLANNER_DATA_MIGRATIONS);

    expect(migrated.workTracker).toMatchObject({ clients: [{ id: "client-1", paymentTerms: 14 }] });
  });

  it("backfills paymentTerms when it is present but negative or non-numeric", () => {
    const v8Envelope = {
      version: 8,
      workTracker: {
        clients: [
          { id: "client-1", name: "Negative", clientCode: "ABC", paymentTerms: -5 },
          { id: "client-2", name: "Non-numeric", clientCode: "XYZ", paymentTerms: "thirty" }
        ],
        projects: [],
        entriesByDate: {}
      }
    };

    const migrated = migratePlannerDataExport(v8Envelope, 9, PLANNER_DATA_MIGRATIONS);

    expect(migrated.workTracker).toMatchObject({
      clients: [
        { id: "client-1", paymentTerms: 30 },
        { id: "client-2", paymentTerms: 30 }
      ]
    });
  });

  it("tolerates a missing workTracker or clients array without throwing", () => {
    expect(() => migratePlannerDataExport({ version: 8 }, 9, PLANNER_DATA_MIGRATIONS)).not.toThrow();

    const migrated = migratePlannerDataExport({ version: 8, workTracker: {} }, 9, PLANNER_DATA_MIGRATIONS);
    expect(migrated.workTracker).toMatchObject({ clients: [] });
  });

  it("chains all the way from v5 to v9 in one call", () => {
    const v5Envelope = {
      version: 5,
      workTracker: {
        clients: [{ id: "client-1", name: "Acme Co" }],
        projects: [],
        entriesByDate: {}
      }
    };

    const migrated = migratePlannerDataExport(v5Envelope, 9, PLANNER_DATA_MIGRATIONS);

    expect(migrated.version).toBe(9);
    expect(migrated.workTracker).toMatchObject({
      clients: [
        { id: "client-1", name: "Acme Co", contactName: "", contactEmail: "", clientCode: "C01", paymentTerms: 30 }
      ],
      userContactInfo: { name: "", email: "", phone: "" },
      invoiceSequenceByPeriod: {}
    });
  });
});
