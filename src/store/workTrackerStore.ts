import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  addEntryToDate,
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
  entriesByDate: {}
};

/**
 * Local persisted Zustand store for work-tracker clients, projects, and logged hour entries.
 */
export const useWorkTrackerStore = create<WorkTrackerStore>()(
  persist(
    (set) => ({
      ...initialState,
      addClient: (name) => set((state) => ({ clients: [...state.clients, createClient(name)] })),
      updateClient: (id, name) => set((state) => ({ clients: updateClientInList(state.clients, id, name) })),
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

      addProject: (name, color, clientId) =>
        set((state) => ({ projects: [...state.projects, createProject(name, color, clientId)] })),
      updateProject: (id, name, color, clientId) =>
        set((state) => ({ projects: updateProjectInList(state.projects, id, name, color, clientId) })),
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

      replaceWorkTrackerData: (data) =>
        set({ clients: data.clients, projects: data.projects, entriesByDate: data.entriesByDate }),
      resetWorkTrackerStore: () => set({ clients: [], projects: [], entriesByDate: {} })
    }),
    {
      name: "sp9000-work-tracker-state",
      storage: createJSONStorage(() => localStorage)
    }
  )
);
