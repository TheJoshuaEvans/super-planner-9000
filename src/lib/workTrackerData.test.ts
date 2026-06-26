import { describe, expect, it } from "vitest";
import { COLORBLIND_SAFE_PALETTE } from "./colorPalette";
import {
  addEntryToDate,
  countEntriesUsingProject,
  countProjectsUsingClient,
  createClient,
  createEntry,
  createProject,
  isClientNameTaken,
  isMalformedEmail,
  isProjectNameTaken,
  parseHourlyRateInput,
  pickNextProjectColor,
  removeClientFromList,
  removeEntriesForProject,
  removeEntryFromDate,
  removeProjectFromList,
  removeProjectsForClient,
  updateClientInList,
  updateEntryInDate,
  updateProjectInList
} from "./workTrackerData";
import type { WorkClient, WorkEntriesByDate, WorkProject } from "../store/workTrackerStore.types";

function makeClient(id: string, name: string, contactName = "Jane Doe", contactEmail = "jane@example.com"): WorkClient {
  return { id, name, contactName, contactEmail };
}

function makeProject(id: string, name: string, color: string, clientId: string, hourlyRate = 0): WorkProject {
  return { id, name, color, clientId, hourlyRate };
}

describe("createClient", () => {
  it("trims whitespace and generates a prefixed id", () => {
    const client = createClient("  Acme  ", "Jane Doe", "jane@acme.com");
    expect(client.name).toBe("Acme");
    expect(client.id).toMatch(/^client-/);
  });

  it("trims and stores the contact name/email", () => {
    const client = createClient("Acme", "  Jane Doe  ", "  jane@acme.com  ");
    expect(client.contactName).toBe("Jane Doe");
    expect(client.contactEmail).toBe("jane@acme.com");
  });

  it("omits company when not provided", () => {
    const client = createClient("Acme", "Jane Doe", "jane@acme.com");
    expect(client.company).toBeUndefined();
  });

  it("trims and stores a provided company", () => {
    const client = createClient("Acme", "Jane Doe", "jane@acme.com", "  Acme Corp  ");
    expect(client.company).toBe("Acme Corp");
  });
});

describe("isMalformedEmail", () => {
  it("treats an empty string as not malformed (callers check emptiness separately)", () => {
    expect(isMalformedEmail("")).toBe(false);
    expect(isMalformedEmail("   ")).toBe(false);
  });

  it("accepts a plausible email address", () => {
    expect(isMalformedEmail("jane@acme.com")).toBe(false);
  });

  it("rejects a string missing an @ or domain", () => {
    expect(isMalformedEmail("jane")).toBe(true);
    expect(isMalformedEmail("jane@acme")).toBe(true);
  });
});

describe("isClientNameTaken", () => {
  const clients = [makeClient("c1", "Acme")];

  it("is case-insensitive", () => {
    expect(isClientNameTaken(clients, "acme")).toBe(true);
  });

  it("excludes the id being edited", () => {
    expect(isClientNameTaken(clients, "Acme", "c1")).toBe(false);
  });

  it("returns false for an unused name", () => {
    expect(isClientNameTaken(clients, "Globex")).toBe(false);
  });
});

describe("updateClientInList / removeClientFromList", () => {
  const clients = [makeClient("c1", "Acme"), makeClient("c2", "Globex")];

  it("updates only the matching client", () => {
    const updated = updateClientInList(clients, "c1", "Acme Corp", "John Smith", "john@acme.com");
    expect(updated.find((c) => c.id === "c1")).toMatchObject({
      name: "Acme Corp",
      contactName: "John Smith",
      contactEmail: "john@acme.com"
    });
    expect(updated.find((c) => c.id === "c2")?.name).toBe("Globex");
  });

  it("sets and clears the company", () => {
    const withCompany = updateClientInList(clients, "c1", "Acme", "Jane Doe", "jane@acme.com", "Acme Corp");
    expect(withCompany.find((c) => c.id === "c1")?.company).toBe("Acme Corp");

    const cleared = updateClientInList(withCompany, "c1", "Acme", "Jane Doe", "jane@acme.com");
    expect(cleared.find((c) => c.id === "c1")?.company).toBeUndefined();
  });

  it("removes only the matching client", () => {
    const updated = removeClientFromList(clients, "c1");
    expect(updated).toEqual([makeClient("c2", "Globex")]);
  });
});

describe("countProjectsUsingClient / removeProjectsForClient", () => {
  const projects = [
    makeProject("p1", "Website", "#000", "c1"),
    makeProject("p2", "App", "#111", "c1"),
    makeProject("p3", "Branding", "#222", "c2")
  ];

  it("counts only matching-client projects", () => {
    expect(countProjectsUsingClient(projects, "c1")).toBe(2);
    expect(countProjectsUsingClient(projects, "c2")).toBe(1);
    expect(countProjectsUsingClient(projects, "c3")).toBe(0);
  });

  it("drops only matching-client projects", () => {
    const updated = removeProjectsForClient(projects, "c1");
    expect(updated).toEqual([makeProject("p3", "Branding", "#222", "c2")]);
  });
});

describe("pickNextProjectColor", () => {
  it("returns the first palette color when no projects exist", () => {
    expect(pickNextProjectColor([])).toBe(COLORBLIND_SAFE_PALETTE[0]);
  });

  it("returns the first unused palette color", () => {
    const projects = [makeProject("p1", "A", COLORBLIND_SAFE_PALETTE[0], "c1")];
    expect(pickNextProjectColor(projects)).toBe(COLORBLIND_SAFE_PALETTE[1]);
  });

  it("cycles back to the first color when all are used", () => {
    const projects = COLORBLIND_SAFE_PALETTE.map((color, index) => makeProject(`p${index}`, `P${index}`, color, "c1"));
    expect(pickNextProjectColor(projects)).toBe(COLORBLIND_SAFE_PALETTE[0]);
  });
});

describe("createProject", () => {
  it("trims whitespace and generates a prefixed id", () => {
    const project = createProject("  Website  ", "#E69F00", "c1", 45);
    expect(project.name).toBe("Website");
    expect(project.id).toMatch(/^project-/);
    expect(project.color).toBe("#E69F00");
    expect(project.clientId).toBe("c1");
    expect(project.hourlyRate).toBe(45);
  });
});

describe("parseHourlyRateInput", () => {
  it("parses a valid non-negative number", () => {
    expect(parseHourlyRateInput("45")).toBe(45);
  });

  it("rounds to the nearest cent", () => {
    expect(parseHourlyRateInput("45.999")).toBe(46);
    expect(parseHourlyRateInput("45.001")).toBe(45);
  });

  it("allows zero", () => {
    expect(parseHourlyRateInput("0")).toBe(0);
  });

  it("returns null for empty, negative, or non-numeric input", () => {
    expect(parseHourlyRateInput("")).toBeNull();
    expect(parseHourlyRateInput("  ")).toBeNull();
    expect(parseHourlyRateInput("-5")).toBeNull();
    expect(parseHourlyRateInput("abc")).toBeNull();
  });
});

describe("isProjectNameTaken", () => {
  const projects = [makeProject("p1", "Website", "#000", "c1")];

  it("is case-insensitive", () => {
    expect(isProjectNameTaken(projects, "website")).toBe(true);
  });

  it("excludes the id being edited", () => {
    expect(isProjectNameTaken(projects, "Website", "p1")).toBe(false);
  });
});

describe("updateProjectInList / removeProjectFromList", () => {
  const projects = [makeProject("p1", "Website", "#000", "c1"), makeProject("p2", "App", "#111", "c1")];

  it("updates only the matching project", () => {
    const updated = updateProjectInList(projects, "p1", "Website Redesign", "#222", "c2", 60);
    expect(updated.find((p) => p.id === "p1")).toEqual(makeProject("p1", "Website Redesign", "#222", "c2", 60));
    expect(updated.find((p) => p.id === "p2")).toEqual(makeProject("p2", "App", "#111", "c1"));
  });

  it("removes only the matching project", () => {
    expect(removeProjectFromList(projects, "p1")).toEqual([makeProject("p2", "App", "#111", "c1")]);
  });
});

describe("countEntriesUsingProject / removeEntriesForProject", () => {
  const entriesByDate: WorkEntriesByDate = {
    "2026-06-01": [createEntry("p1", 4), createEntry("p2", 2)],
    "2026-06-02": [createEntry("p1", 3)]
  };

  it("counts entries for a project across all dates", () => {
    expect(countEntriesUsingProject(entriesByDate, "p1")).toBe(2);
    expect(countEntriesUsingProject(entriesByDate, "p2")).toBe(1);
    expect(countEntriesUsingProject(entriesByDate, "p3")).toBe(0);
  });

  it("strips entries for a project across multiple dates", () => {
    const updated = removeEntriesForProject(entriesByDate, "p1");
    expect(updated["2026-06-01"].map((e) => e.projectId)).toEqual(["p2"]);
    expect(updated["2026-06-02"]).toEqual([]);
  });
});

describe("addEntryToDate / updateEntryInDate / removeEntryFromDate", () => {
  it("appends a new entry under the given date", () => {
    const entry = createEntry("p1", 4);
    const updated = addEntryToDate({}, "2026-06-01", entry);
    expect(updated["2026-06-01"]).toEqual([entry]);
  });

  it("updates the matching entry's project and hours", () => {
    const entry = createEntry("p1", 4);
    const entriesByDate: WorkEntriesByDate = { "2026-06-01": [entry] };
    const updated = updateEntryInDate(entriesByDate, "2026-06-01", entry.id, "p2", 6);
    expect(updated["2026-06-01"]).toEqual([{ id: entry.id, projectId: "p2", hours: 6 }]);
  });

  it("removes the matching entry from the given date", () => {
    const entry = createEntry("p1", 4);
    const entriesByDate: WorkEntriesByDate = { "2026-06-01": [entry] };
    const updated = removeEntryFromDate(entriesByDate, "2026-06-01", entry.id);
    expect(updated["2026-06-01"]).toEqual([]);
  });
});
