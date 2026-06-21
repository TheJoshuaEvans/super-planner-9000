import { beforeEach, describe, expect, it } from "vitest";
import { useWorkTrackerStore } from "./workTrackerStore";

describe("workTrackerStore", () => {
  beforeEach(() => {
    localStorage.clear();
    useWorkTrackerStore.getState().resetWorkTrackerStore();
  });

  describe("clients", () => {
    it("starts with no clients", () => {
      expect(useWorkTrackerStore.getState().clients).toEqual([]);
    });

    it("adds a client with a generated id", () => {
      useWorkTrackerStore.getState().addClient("Acme Co");
      const { clients } = useWorkTrackerStore.getState();
      expect(clients).toHaveLength(1);
      expect(clients[0]).toMatchObject({ name: "Acme Co" });
      expect(clients[0].id).toBeTruthy();
    });

    it("updates a client name in place", () => {
      useWorkTrackerStore.getState().addClient("Acme Co");
      const { id } = useWorkTrackerStore.getState().clients[0];
      useWorkTrackerStore.getState().updateClient(id, "Acme Corp");
      expect(useWorkTrackerStore.getState().clients[0]).toMatchObject({ id, name: "Acme Corp" });
    });

    it("deletes a client by id, cascading to its projects and their entries", () => {
      useWorkTrackerStore.getState().addClient("Acme Co");
      const clientId = useWorkTrackerStore.getState().clients[0].id;
      useWorkTrackerStore.getState().addProject("Website", "#E69F00", clientId, 45);
      const projectId = useWorkTrackerStore.getState().projects[0].id;
      useWorkTrackerStore.getState().addEntry("2026-06-01", projectId, 4);

      useWorkTrackerStore.getState().deleteClient(clientId);

      const state = useWorkTrackerStore.getState();
      expect(state.clients).toHaveLength(0);
      expect(state.projects).toHaveLength(0);
      expect(state.entriesByDate["2026-06-01"]).toEqual([]);
    });
  });

  describe("projects", () => {
    it("adds a project with a generated id", () => {
      useWorkTrackerStore.getState().addClient("Acme Co");
      const clientId = useWorkTrackerStore.getState().clients[0].id;
      useWorkTrackerStore.getState().addProject("Website", "#E69F00", clientId, 45);

      const { projects } = useWorkTrackerStore.getState();
      expect(projects).toHaveLength(1);
      expect(projects[0]).toMatchObject({ name: "Website", color: "#E69F00", clientId, hourlyRate: 45 });
    });

    it("updates a project's name, color, client, and hourly rate in place", () => {
      useWorkTrackerStore.getState().addClient("Acme Co");
      useWorkTrackerStore.getState().addClient("Globex");
      const [clientA, clientB] = useWorkTrackerStore.getState().clients;
      useWorkTrackerStore.getState().addProject("Website", "#E69F00", clientA.id, 45);
      const projectId = useWorkTrackerStore.getState().projects[0].id;

      useWorkTrackerStore.getState().updateProject(projectId, "Website Redesign", "#56B4E9", clientB.id, 60);

      expect(useWorkTrackerStore.getState().projects[0]).toMatchObject({
        id: projectId,
        name: "Website Redesign",
        color: "#56B4E9",
        clientId: clientB.id,
        hourlyRate: 60
      });
    });

    it("deletes a project by id, cascading to remove its entries", () => {
      useWorkTrackerStore.getState().addClient("Acme Co");
      const clientId = useWorkTrackerStore.getState().clients[0].id;
      useWorkTrackerStore.getState().addProject("Website", "#E69F00", clientId, 45);
      const projectId = useWorkTrackerStore.getState().projects[0].id;
      useWorkTrackerStore.getState().addEntry("2026-06-01", projectId, 4);

      useWorkTrackerStore.getState().deleteProject(projectId);

      const state = useWorkTrackerStore.getState();
      expect(state.projects).toHaveLength(0);
      expect(state.entriesByDate["2026-06-01"]).toEqual([]);
    });
  });

  describe("entries", () => {
    it("adds an entry under the given date with a generated id", () => {
      useWorkTrackerStore.getState().addEntry("2026-06-01", "p1", 4);
      const entries = useWorkTrackerStore.getState().entriesByDate["2026-06-01"];
      expect(entries).toHaveLength(1);
      expect(entries[0]).toMatchObject({ projectId: "p1", hours: 4 });
      expect(entries[0].id).toBeTruthy();
    });

    it("updates an entry's project and hours in place", () => {
      useWorkTrackerStore.getState().addEntry("2026-06-01", "p1", 4);
      const entryId = useWorkTrackerStore.getState().entriesByDate["2026-06-01"][0].id;
      useWorkTrackerStore.getState().updateEntry("2026-06-01", entryId, "p2", 6);
      expect(useWorkTrackerStore.getState().entriesByDate["2026-06-01"][0]).toEqual({
        id: entryId,
        projectId: "p2",
        hours: 6
      });
    });

    it("deletes an entry by id from the given date", () => {
      useWorkTrackerStore.getState().addEntry("2026-06-01", "p1", 4);
      const entryId = useWorkTrackerStore.getState().entriesByDate["2026-06-01"][0].id;
      useWorkTrackerStore.getState().deleteEntry("2026-06-01", entryId);
      expect(useWorkTrackerStore.getState().entriesByDate["2026-06-01"]).toEqual([]);
    });
  });

  it("replaceWorkTrackerData replaces clients, projects, and entries wholesale", () => {
    useWorkTrackerStore.getState().addClient("Acme Co");
    useWorkTrackerStore.getState().replaceWorkTrackerData({
      clients: [{ id: "c9", name: "Replaced Co" }],
      projects: [{ id: "p9", name: "Replaced Project", color: "#000", clientId: "c9", hourlyRate: 50 }],
      entriesByDate: { "2026-06-01": [{ id: "e9", projectId: "p9", hours: 2 }] }
    });

    const state = useWorkTrackerStore.getState();
    expect(state.clients).toEqual([{ id: "c9", name: "Replaced Co" }]);
    expect(state.projects).toEqual([{ id: "p9", name: "Replaced Project", color: "#000", clientId: "c9", hourlyRate: 50 }]);
    expect(state.entriesByDate).toEqual({ "2026-06-01": [{ id: "e9", projectId: "p9", hours: 2 }] });
  });

  it("resetWorkTrackerStore clears all clients, projects, and entries", () => {
    useWorkTrackerStore.getState().addClient("Acme Co");
    useWorkTrackerStore.getState().addEntry("2026-06-01", "p1", 4);
    useWorkTrackerStore.getState().resetWorkTrackerStore();

    const state = useWorkTrackerStore.getState();
    expect(state.clients).toEqual([]);
    expect(state.projects).toEqual([]);
    expect(state.entriesByDate).toEqual({});
  });
});
