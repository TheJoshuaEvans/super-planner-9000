import { beforeEach, describe, expect, it } from "vitest";
import { BLANK_USER_CONTACT_INFO } from "../lib/workTrackerData";
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
      useWorkTrackerStore.getState().addClient("Acme Co", "Jane Doe", "jane@acme.com", "ABC", 30);
      const { clients } = useWorkTrackerStore.getState();
      expect(clients).toHaveLength(1);
      expect(clients[0]).toMatchObject({ name: "Acme Co" });
      expect(clients[0].id).toBeTruthy();
    });

    it("updates a client name in place", () => {
      useWorkTrackerStore.getState().addClient("Acme Co", "Jane Doe", "jane@acme.com", "ABC", 30);
      const { id } = useWorkTrackerStore.getState().clients[0];
      useWorkTrackerStore.getState().updateClient(id, "Acme Corp", "Jane Doe", "jane@acme.com", "ABC", 30);
      expect(useWorkTrackerStore.getState().clients[0]).toMatchObject({ id, name: "Acme Corp" });
    });

    it("adds and updates a client's contact name/email", () => {
      useWorkTrackerStore.getState().addClient("Acme Co", "Jane Doe", "jane@acme.com", "ABC", 30);
      const { id } = useWorkTrackerStore.getState().clients[0];
      expect(useWorkTrackerStore.getState().clients[0]).toMatchObject({
        contactName: "Jane Doe",
        contactEmail: "jane@acme.com"
      });

      useWorkTrackerStore.getState().updateClient(id, "Acme Co", "John Smith", "john@acme.com", "ABC", 30);
      expect(useWorkTrackerStore.getState().clients[0]).toMatchObject({
        contactName: "John Smith",
        contactEmail: "john@acme.com"
      });
    });

    it("adds and updates a client's unique client code", () => {
      useWorkTrackerStore.getState().addClient("Acme Co", "Jane Doe", "jane@acme.com", "abc", 30);
      const { id } = useWorkTrackerStore.getState().clients[0];
      expect(useWorkTrackerStore.getState().clients[0].clientCode).toBe("ABC");

      useWorkTrackerStore.getState().updateClient(id, "Acme Co", "Jane Doe", "jane@acme.com", "xy1", 30);
      expect(useWorkTrackerStore.getState().clients[0].clientCode).toBe("XY1");
    });

    it("adds and updates a client's payment terms", () => {
      useWorkTrackerStore.getState().addClient("Acme Co", "Jane Doe", "jane@acme.com", "ABC", 30);
      const { id } = useWorkTrackerStore.getState().clients[0];
      expect(useWorkTrackerStore.getState().clients[0].paymentTerms).toBe(30);

      useWorkTrackerStore.getState().updateClient(id, "Acme Co", "Jane Doe", "jane@acme.com", "ABC", 14);
      expect(useWorkTrackerStore.getState().clients[0].paymentTerms).toBe(14);
    });

    it("adds and updates a client's optional company", () => {
      useWorkTrackerStore.getState().addClient("Acme Co", "Jane Doe", "jane@acme.com", "ABC", 30, "Acme Corp");
      const { id } = useWorkTrackerStore.getState().clients[0];
      expect(useWorkTrackerStore.getState().clients[0].company).toBe("Acme Corp");

      useWorkTrackerStore.getState().updateClient(id, "Acme Co", "Jane Doe", "jane@acme.com", "ABC", 30, "Acme Industries");
      expect(useWorkTrackerStore.getState().clients[0].company).toBe("Acme Industries");
    });

    it("leaves company undefined when not provided", () => {
      useWorkTrackerStore.getState().addClient("Acme Co", "Jane Doe", "jane@acme.com", "ABC", 30);
      expect(useWorkTrackerStore.getState().clients[0].company).toBeUndefined();
    });

    it("deletes a client by id, cascading to its projects and their entries", () => {
      useWorkTrackerStore.getState().addClient("Acme Co", "Jane Doe", "jane@acme.com", "ABC", 30);
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
      useWorkTrackerStore.getState().addClient("Acme Co", "Jane Doe", "jane@acme.com", "ABC", 30);
      const clientId = useWorkTrackerStore.getState().clients[0].id;
      useWorkTrackerStore.getState().addProject("Website", "#E69F00", clientId, 45);

      const { projects } = useWorkTrackerStore.getState();
      expect(projects).toHaveLength(1);
      expect(projects[0]).toMatchObject({ name: "Website", color: "#E69F00", clientId, hourlyRate: 45 });
    });

    it("updates a project's name, color, client, and hourly rate in place", () => {
      useWorkTrackerStore.getState().addClient("Acme Co", "Jane Doe", "jane@acme.com", "ABC", 30);
      useWorkTrackerStore.getState().addClient("Globex", "Joe Bloggs", "joe@globex.com", "XYZ", 30);
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
      useWorkTrackerStore.getState().addClient("Acme Co", "Jane Doe", "jane@acme.com", "ABC", 30);
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

  describe("userContactInfo", () => {
    it("starts blank", () => {
      expect(useWorkTrackerStore.getState().userContactInfo).toEqual(BLANK_USER_CONTACT_INFO);
    });

    it("updates one or more fields, leaving the rest untouched", () => {
      useWorkTrackerStore.getState().updateUserContactInfo({ name: "Jane Doe", email: "jane@example.com" });
      expect(useWorkTrackerStore.getState().userContactInfo).toEqual({
        ...BLANK_USER_CONTACT_INFO,
        name: "Jane Doe",
        email: "jane@example.com"
      });

      useWorkTrackerStore.getState().updateUserContactInfo({ phone: "555-1234" });
      expect(useWorkTrackerStore.getState().userContactInfo).toEqual({
        ...BLANK_USER_CONTACT_INFO,
        name: "Jane Doe",
        email: "jane@example.com",
        phone: "555-1234"
      });
    });
  });

  describe("invoiceSequenceByPeriod", () => {
    it("starts empty", () => {
      expect(useWorkTrackerStore.getState().invoiceSequenceByPeriod).toEqual({});
    });

    it("records an index for a period without touching other periods", () => {
      useWorkTrackerStore.getState().recordInvoiceIndex("ABC-2026-06", 1);
      useWorkTrackerStore.getState().recordInvoiceIndex("XYZ-2026-06", 1);
      expect(useWorkTrackerStore.getState().invoiceSequenceByPeriod).toEqual({
        "ABC-2026-06": 1,
        "XYZ-2026-06": 1
      });

      useWorkTrackerStore.getState().recordInvoiceIndex("ABC-2026-06", 2);
      expect(useWorkTrackerStore.getState().invoiceSequenceByPeriod).toEqual({
        "ABC-2026-06": 2,
        "XYZ-2026-06": 1
      });
    });
  });

  it("replaceWorkTrackerData replaces clients, projects, entries, contact info, and invoice sequence wholesale", () => {
    const replacedContactInfo = { ...BLANK_USER_CONTACT_INFO, name: "Replaced User", email: "user@replaced.co", phone: "555-0000" };
    useWorkTrackerStore.getState().addClient("Acme Co", "Jane Doe", "jane@acme.com", "ABC", 30);
    useWorkTrackerStore.getState().recordInvoiceIndex("ABC-2026-06", 1);
    useWorkTrackerStore.getState().replaceWorkTrackerData({
      clients: [
        { id: "c9", name: "Replaced Co", contactName: "Pat Lee", contactEmail: "pat@replaced.co", clientCode: "C09", paymentTerms: 45 }
      ],
      projects: [{ id: "p9", name: "Replaced Project", color: "#000", clientId: "c9", hourlyRate: 50 }],
      entriesByDate: { "2026-06-01": [{ id: "e9", projectId: "p9", hours: 2 }] },
      userContactInfo: replacedContactInfo,
      invoiceSequenceByPeriod: { "C09-2026-07": 4 }
    });

    const state = useWorkTrackerStore.getState();
    expect(state.clients).toEqual([
      { id: "c9", name: "Replaced Co", contactName: "Pat Lee", contactEmail: "pat@replaced.co", clientCode: "C09", paymentTerms: 45 }
    ]);
    expect(state.projects).toEqual([{ id: "p9", name: "Replaced Project", color: "#000", clientId: "c9", hourlyRate: 50 }]);
    expect(state.entriesByDate).toEqual({ "2026-06-01": [{ id: "e9", projectId: "p9", hours: 2 }] });
    expect(state.userContactInfo).toEqual(replacedContactInfo);
    expect(state.invoiceSequenceByPeriod).toEqual({ "C09-2026-07": 4 });
  });

  it("resetWorkTrackerStore clears all clients, projects, entries, contact info, and invoice sequence", () => {
    useWorkTrackerStore.getState().addClient("Acme Co", "Jane Doe", "jane@acme.com", "ABC", 30);
    useWorkTrackerStore.getState().addEntry("2026-06-01", "p1", 4);
    useWorkTrackerStore.getState().updateUserContactInfo({ name: "Jane Doe" });
    useWorkTrackerStore.getState().recordInvoiceIndex("ABC-2026-06", 1);
    useWorkTrackerStore.getState().resetWorkTrackerStore();

    const state = useWorkTrackerStore.getState();
    expect(state.clients).toEqual([]);
    expect(state.projects).toEqual([]);
    expect(state.entriesByDate).toEqual({});
    expect(state.userContactInfo).toEqual(BLANK_USER_CONTACT_INFO);
    expect(state.invoiceSequenceByPeriod).toEqual({});
  });
});
