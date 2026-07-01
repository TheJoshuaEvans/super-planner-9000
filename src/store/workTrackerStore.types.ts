/**
 * A billing client that projects are associated with. Not used by hour calculations directly,
 * but required when creating a project so client-based reporting can be added later.
 */
export type WorkClient = {
  id: string;
  name: string;
  /** Point-of-contact name for this client. */
  contactName: string;
  /** Point-of-contact email address for this client. */
  contactEmail: string;
  /** Unique 3-character (letters/digits) code identifying this client on invoice numbers. */
  clientCode: string;
  /** Number of days after an invoice is submitted before payment is due (e.g. 30 for "Net 30"). */
  paymentTerms: number;
  /** Optional company/organization name for this client. */
  company?: string;
};

/**
 * A project that work hours are logged against, scoped to exactly one client.
 */
export type WorkProject = {
  id: string;
  name: string;
  color: string;
  clientId: string;
  /** Billing rate in dollars per hour, set when the project is created and editable afterward. */
  hourlyRate: number;
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
 * The user's own contact details, used as the "from" party when generating invoices and other
 * billing documents. A single record, not a list — fields may be blank until filled in. Address
 * parts are stored separately (rather than as one free-text field) so they can be formatted
 * however invoices/documents need later.
 */
export type UserContactInfo = {
  name: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

/**
 * Tracks the last-used invoice index per billing period, keyed by `"<CLIENT_CODE>-<YYYY>-<MM>"`.
 * The next invoice for that period defaults to one more than the stored value.
 */
export type InvoiceSequenceByPeriod = Record<string, number>;

/**
 * Persisted work tracker data that should be exported/imported as a unit.
 */
export type WorkTrackerPersistedData = {
  clients: WorkClient[];
  projects: WorkProject[];
  entriesByDate: WorkEntriesByDate;
  userContactInfo: UserContactInfo;
  invoiceSequenceByPeriod: InvoiceSequenceByPeriod;
};

/**
 * Work tracker store state plus all actions exposed to the UI.
 */
export type WorkTrackerStore = WorkTrackerPersistedData & {
  /** Adds a new client to the library, with a point-of-contact name/email, a unique client code, payment terms, and an optional company name. */
  addClient: (
    name: string,
    contactName: string,
    contactEmail: string,
    clientCode: string,
    paymentTerms: number,
    company?: string
  ) => void;
  /** Updates the name, point-of-contact name/email, client code, payment terms, and company name of an existing client by id. */
  updateClient: (
    id: string,
    name: string,
    contactName: string,
    contactEmail: string,
    clientCode: string,
    paymentTerms: number,
    company?: string
  ) => void;
  /** Removes a client, cascading to remove its projects and any entries logged against them. */
  deleteClient: (id: string) => void;

  /** Adds a new project to the library, scoped to a client, with a billing rate in dollars/hour. */
  addProject: (name: string, color: string, clientId: string, hourlyRate: number) => void;
  /** Updates the name, color, client assignment, and/or hourly rate of an existing project by id. */
  updateProject: (id: string, name: string, color: string, clientId: string, hourlyRate: number) => void;
  /** Removes a project, cascading to remove any entries logged against it across all dates. */
  deleteProject: (id: string) => void;

  /** Adds a new hours entry for a project on a given date. */
  addEntry: (dateKey: WorkDateKey, projectId: string, hours: number) => void;
  /** Updates an existing entry's project and/or hours by id, on a given date. */
  updateEntry: (dateKey: WorkDateKey, entryId: string, projectId: string, hours: number) => void;
  /** Removes a single entry by id from a given date. */
  deleteEntry: (dateKey: WorkDateKey, entryId: string) => void;

  /** Updates one or more fields of the user's own contact info (name/email/phone/address parts). */
  updateUserContactInfo: (patch: Partial<UserContactInfo>) => void;

  /** Records the last-used invoice index for a billing period (e.g. after generating an invoice). */
  recordInvoiceIndex: (periodKey: string, index: number) => void;

  /** Replaces the entire persisted state (used by data import). */
  replaceWorkTrackerData: (data: WorkTrackerPersistedData) => void;
  /** Resets the store to an empty state. */
  resetWorkTrackerStore: () => void;
};
