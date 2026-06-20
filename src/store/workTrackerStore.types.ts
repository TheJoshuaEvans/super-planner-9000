/**
 * A billing client that projects are associated with. Not used by hour calculations directly,
 * but required when creating a project so client-based reporting can be added later.
 */
export type WorkClient = {
  id: string;
  name: string;
};

/**
 * A project that work hours are logged against, scoped to exactly one client.
 */
export type WorkProject = {
  id: string;
  name: string;
  color: string;
  clientId: string;
};

/** Calendar identity string in YYYY-MM-DD format (matches PlannerDateKey's shape). */
export type WorkDateKey = string;

/**
 * A single logged block of hours worked on one project on one date. Multiple entries per
 * project per day are allowed (not merged).
 */
export type WorkEntry = {
  id: string;
  projectId: string;
  /** Normalized decimal hours, rounded to the nearest quarter hour (e.g. 1, 1.25, 7.5). */
  hours: number;
};

/** Per-date entry list map for the work tracker, keyed by YYYY-MM-DD. */
export type WorkEntriesByDate = Record<WorkDateKey, WorkEntry[]>;

/**
 * Persisted work tracker data that should be exported/imported as a unit.
 */
export type WorkTrackerPersistedData = {
  clients: WorkClient[];
  projects: WorkProject[];
  entriesByDate: WorkEntriesByDate;
};

/**
 * Work tracker store state plus all actions exposed to the UI.
 */
export type WorkTrackerStore = WorkTrackerPersistedData & {
  /** Adds a new client to the library. */
  addClient: (name: string) => void;
  /** Updates the name of an existing client by id. */
  updateClient: (id: string, name: string) => void;
  /** Removes a client, cascading to remove its projects and any entries logged against them. */
  deleteClient: (id: string) => void;

  /** Adds a new project to the library, scoped to a client. */
  addProject: (name: string, color: string, clientId: string) => void;
  /** Updates the name, color, and/or client assignment of an existing project by id. */
  updateProject: (id: string, name: string, color: string, clientId: string) => void;
  /** Removes a project, cascading to remove any entries logged against it across all dates. */
  deleteProject: (id: string) => void;

  /** Adds a new hours entry for a project on a given date. */
  addEntry: (dateKey: WorkDateKey, projectId: string, hours: number) => void;
  /** Updates an existing entry's project and/or hours by id, on a given date. */
  updateEntry: (dateKey: WorkDateKey, entryId: string, projectId: string, hours: number) => void;
  /** Removes a single entry by id from a given date. */
  deleteEntry: (dateKey: WorkDateKey, entryId: string) => void;

  /** Replaces the entire persisted state (used by data import). */
  replaceWorkTrackerData: (data: WorkTrackerPersistedData) => void;
  /** Resets the store to an empty state. */
  resetWorkTrackerStore: () => void;
};
