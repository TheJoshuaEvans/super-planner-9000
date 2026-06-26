import { describe, expect, it } from "vitest";
import { buildMonthlyInvoiceOverview } from "./workTrackerInvoice";
import type { WorkClient, WorkEntriesByDate, WorkProject } from "../store/workTrackerStore.types";

function makeClient(id: string, name: string): WorkClient {
  return { id, name, contactName: "Jane Doe", contactEmail: "jane@example.com" };
}

function makeProject(id: string, name: string, clientId: string, hourlyRate: number, color = "#000"): WorkProject {
  return { id, name, color, clientId, hourlyRate };
}

const june = new Date(2026, 5, 15);

describe("buildMonthlyInvoiceOverview", () => {
  it("returns empty groups and zero totals when no entries exist", () => {
    const result = buildMonthlyInvoiceOverview(june, {}, [], []);
    expect(result).toEqual({ clientGroups: [], grandTotalHours: 0, grandTotalEarned: 0 });
  });

  it("groups a single project's hours under its client, computing earned as hours * rate", () => {
    const clients = [makeClient("c1", "Acme Co")];
    const projects = [makeProject("p1", "Website", "c1", 50)];
    const entriesByDate: WorkEntriesByDate = {
      "2026-06-01": [{ id: "e1", projectId: "p1", hours: 4 }],
      "2026-06-05": [{ id: "e2", projectId: "p1", hours: 3 }]
    };

    const result = buildMonthlyInvoiceOverview(june, entriesByDate, projects, clients);

    expect(result.clientGroups).toEqual([
      {
        clientId: "c1",
        clientName: "Acme Co",
        totalHours: 7,
        totalEarned: 350,
        projects: [
          { projectId: "p1", projectName: "Website", projectColor: "#000", hours: 7, hourlyRate: 50, earned: 350 }
        ]
      }
    ]);
    expect(result.grandTotalHours).toBe(7);
    expect(result.grandTotalEarned).toBe(350);
  });

  it("ignores entries outside the target month", () => {
    const clients = [makeClient("c1", "Acme Co")];
    const projects = [makeProject("p1", "Website", "c1", 50)];
    const entriesByDate: WorkEntriesByDate = {
      "2026-05-31": [{ id: "e1", projectId: "p1", hours: 8 }],
      "2026-07-01": [{ id: "e2", projectId: "p1", hours: 8 }]
    };

    const result = buildMonthlyInvoiceOverview(june, entriesByDate, projects, clients);

    expect(result.clientGroups).toEqual([]);
    expect(result.grandTotalHours).toBe(0);
  });

  it("groups multiple projects under the same client, and sorts both clients and projects alphabetically", () => {
    const clients = [makeClient("c2", "Zeta Inc"), makeClient("c1", "Acme Co")];
    const projects = [
      makeProject("p2", "Branding", "c1", 40),
      makeProject("p1", "Website", "c1", 50),
      makeProject("p3", "Backend", "c2", 60)
    ];
    const entriesByDate: WorkEntriesByDate = {
      "2026-06-01": [
        { id: "e1", projectId: "p1", hours: 2 },
        { id: "e2", projectId: "p2", hours: 1 },
        { id: "e3", projectId: "p3", hours: 3 }
      ]
    };

    const result = buildMonthlyInvoiceOverview(june, entriesByDate, projects, clients);

    expect(result.clientGroups.map((g) => g.clientName)).toEqual(["Acme Co", "Zeta Inc"]);
    expect(result.clientGroups[0].projects.map((p) => p.projectName)).toEqual(["Branding", "Website"]);
    expect(result.grandTotalEarned).toBe(1 * 40 + 2 * 50 + 3 * 60);
  });

  it("includes a project with logged hours even when its hourly rate is 0", () => {
    const clients = [makeClient("c1", "Acme Co")];
    const projects = [makeProject("p1", "Volunteer Work", "c1", 0)];
    const entriesByDate: WorkEntriesByDate = {
      "2026-06-01": [{ id: "e1", projectId: "p1", hours: 5 }]
    };

    const result = buildMonthlyInvoiceOverview(june, entriesByDate, projects, clients);

    expect(result.clientGroups[0].projects[0]).toMatchObject({ hours: 5, hourlyRate: 0, earned: 0 });
  });

  it("omits projects with no logged hours in the target month", () => {
    const clients = [makeClient("c1", "Acme Co")];
    const projects = [makeProject("p1", "Website", "c1", 50), makeProject("p2", "Idle Project", "c1", 30)];
    const entriesByDate: WorkEntriesByDate = {
      "2026-06-01": [{ id: "e1", projectId: "p1", hours: 2 }]
    };

    const result = buildMonthlyInvoiceOverview(june, entriesByDate, projects, clients);

    expect(result.clientGroups[0].projects).toHaveLength(1);
    expect(result.clientGroups[0].projects[0].projectId).toBe("p1");
  });

  it("falls back to 'No client' when a project's clientId has no matching client", () => {
    const projects = [makeProject("p1", "Orphan Project", "missing-client", 25)];
    const entriesByDate: WorkEntriesByDate = {
      "2026-06-01": [{ id: "e1", projectId: "p1", hours: 4 }]
    };

    const result = buildMonthlyInvoiceOverview(june, entriesByDate, projects, []);

    expect(result.clientGroups[0]).toMatchObject({ clientId: "missing-client", clientName: "No client" });
  });

  it("rounds earned value to the nearest cent, avoiding floating-point noise", () => {
    const clients = [makeClient("c1", "Acme Co")];
    const projects = [makeProject("p1", "Website", "c1", 33.33)];
    const entriesByDate: WorkEntriesByDate = {
      "2026-06-01": [{ id: "e1", projectId: "p1", hours: 0.25 }],
      "2026-06-02": [{ id: "e2", projectId: "p1", hours: 0.25 }],
      "2026-06-03": [{ id: "e3", projectId: "p1", hours: 0.25 }]
    };

    const result = buildMonthlyInvoiceOverview(june, entriesByDate, projects, clients);

    // 0.75 total hours * $33.33/hr = $24.9975 raw, which rounds to a clean $25.00
    expect(result.clientGroups[0].totalEarned).toBe(25);
    expect(result.grandTotalEarned).toBe(25);
  });
});
