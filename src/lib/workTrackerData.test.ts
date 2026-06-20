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
  isProjectNameTaken,
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

function makeClient(id: string, name: string): WorkClient {
  return { id, name };
}

function makeProject(id: string, name: string, color: string, clientId: string): WorkProject {
  return { id, name, color, clientId };
}

describe("createClient", () => {
  it("trims whitespace and generates a prefixed id", () => {
    const client = createClient("  Acme  ");
    expect(client.name).toBe("Acme");
    expect(client.id).toMatch(/^client-/);
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
    const updated = updateClientInList(clients, "c1", "Acme Corp");
    expect(updated.find((c) => c.id === "c1")?.name).toBe("Acme Corp");
    expect(updated.find((c) => c.id === "c2")?.name).toBe("Globex");
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
    const project = createProject("  Website  ", "#E69F00", "c1");
    expect(project.name).toBe("Website");
    expect(project.id).toMatch(/^project-/);
    expect(project.color).toBe("#E69F00");
    expect(project.clientId).toBe("c1");
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
    const updated = updateProjectInList(projects, "p1", "Website Redesign", "#222", "c2");
    expect(updated.find((p) => p.id === "p1")).toEqual(makeProject("p1", "Website Redesign", "#222", "c2"));
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
