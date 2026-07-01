import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  addEntryToDate,
  BLANK_USER_CONTACT_INFO,
  createClient,
  createEntry,
  createProject,
  removeClientFromList,
  removeEntriesForProject,
  removeEntryFromDate,
  removeProjectFromList,
  removeProjectsForClient,
  updateClientInList,
  updateEntryInDate,
  updateProjectInList
} from "../lib/workTrackerData";
import type { WorkTrackerPersistedData, WorkTrackerStore } from "./workTrackerStore.types";

export type {
  InvoiceSequenceByPeriod,
  UserContactInfo,
  WorkClient,
  WorkDateKey,
  WorkEntriesByDate,
  WorkEntry,
  WorkProject,
  WorkTrackerPersistedData
} from "./workTrackerStore.types";

const initialState: WorkTrackerPersistedData = {
  clients: [],
  projects: [],
  entriesByDate: {},
  userContactInfo: BLANK_USER_CONTACT_INFO,
  invoiceSequenceByPeriod: {}
};

/**
 * Local persisted Zustand store for work-tracker clients, projects, logged hour entries, and the
 * user's own contact info (used as the "from" party on invoices).
 */
export const useWorkTrackerStore = create<WorkTrackerStore>()(
  persist(
    (set) => ({
      ...initialState,
      addClient: (name, contactName, contactEmail, clientCode, paymentTerms, company) =>
        set((state) => ({
          clients: [
            ...state.clients,
            createClient(name, contactName, contactEmail, clientCode, paymentTerms, company)
          ]
        })),
      updateClient: (id, name, contactName, contactEmail, clientCode, paymentTerms, company) =>
        set((state) => ({
          clients: updateClientInList(state.clients, id, name, contactName, contactEmail, clientCode, paymentTerms, company)
        })),
      deleteClient: (id) =>
        set((state) => {
          const orphanedProjectIds = state.projects
            .filter((project) => project.clientId === id)
            .map((project) => project.id);
          const entriesByDate = orphanedProjectIds.reduce(
            (acc, projectId) => removeEntriesForProject(acc, projectId),
            state.entriesByDate
          );

          return {
            clients: removeClientFromList(state.clients, id),
            projects: removeProjectsForClient(state.projects, id),
            entriesByDate
          };
        }),

      addProject: (name, color, clientId, hourlyRate) =>
        set((state) => ({ projects: [...state.projects, createProject(name, color, clientId, hourlyRate)] })),
      updateProject: (id, name, color, clientId, hourlyRate) =>
        set((state) => ({ projects: updateProjectInList(state.projects, id, name, color, clientId, hourlyRate) })),
      deleteProject: (id) =>
        set((state) => ({
          projects: removeProjectFromList(state.projects, id),
          entriesByDate: removeEntriesForProject(state.entriesByDate, id)
        })),

      addEntry: (dateKey, projectId, hours) =>
        set((state) => ({ entriesByDate: addEntryToDate(state.entriesByDate, dateKey, createEntry(projectId, hours)) })),
      updateEntry: (dateKey, entryId, projectId, hours) =>
        set((state) => ({ entriesByDate: updateEntryInDate(state.entriesByDate, dateKey, entryId, projectId, hours) })),
      deleteEntry: (dateKey, entryId) =>
        set((state) => ({ entriesByDate: removeEntryFromDate(state.entriesByDate, dateKey, entryId) })),

      updateUserContactInfo: (patch) =>
        set((state) => ({ userContactInfo: { ...state.userContactInfo, ...patch } })),

      recordInvoiceIndex: (periodKey, index) =>
        set((state) => ({ invoiceSequenceByPeriod: { ...state.invoiceSequenceByPeriod, [periodKey]: index } })),

      replaceWorkTrackerData: (data) =>
        set({
          clients: data.clients,
          projects: data.projects,
          entriesByDate: data.entriesByDate,
          userContactInfo: data.userContactInfo,
          invoiceSequenceByPeriod: data.invoiceSequenceByPeriod
        }),
      resetWorkTrackerStore: () =>
        set({
          clients: [],
          projects: [],
          entriesByDate: {},
          userContactInfo: BLANK_USER_CONTACT_INFO,
          invoiceSequenceByPeriod: {}
        })
    }),
    {
      name: "sp9000-work-tracker-state",
      storage: createJSONStorage(() => localStorage)
    }
  )
);
