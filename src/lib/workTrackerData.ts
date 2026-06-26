import { COLORBLIND_SAFE_PALETTE } from "./colorPalette";
import type { UserContactInfo, WorkClient, WorkEntriesByDate, WorkEntry, WorkProject } from "../store/workTrackerStore.types";

/** Default blank value for the user's own contact info, before they've filled anything in. */
export const BLANK_USER_CONTACT_INFO: UserContactInfo = {
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

/**
 * Generates a unique identifier with the given prefix.
 *
 * @param prefix - Prefix string for the id.
 * @returns A unique id string.
 */
function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Creates a new WorkClient with a generated id.
 *
 * @param name - Display name for the client.
 * @param contactName - Point-of-contact name.
 * @param contactEmail - Point-of-contact email address.
 * @param company - Optional company/organization name.
 * @returns A new WorkClient.
 */
export function createClient(name: string, contactName: string, contactEmail: string, company = ""): WorkClient {
  return {
    id: createId("client"),
    name: name.trim(),
    contactName: contactName.trim(),
    contactEmail: contactEmail.trim(),
    company: company.trim() || undefined
  };
}

/**
 * Returns true if any client other than the one being edited shares the given name (case-insensitive).
 *
 * @param clients - Existing client list to check against.
 * @param name - Name to test for a conflict.
 * @param excludeId - Id of the client being edited, if any, so it is not matched against itself.
 * @returns Whether the name is already taken by another client.
 */
export function isClientNameTaken(clients: WorkClient[], name: string, excludeId?: string): boolean {
  const normalized = name.trim().toLowerCase();
  return clients.some((client) => client.id !== excludeId && client.name.toLowerCase() === normalized);
}

/**
 * Returns true if the given email string is non-empty but not a plausible email address. Used to
 * gate form submission on an obviously malformed value without being a full RFC validator.
 *
 * @param email - Candidate email address.
 * @returns Whether the non-empty string fails a basic "text@text.text" shape check.
 */
export function isMalformedEmail(email: string): boolean {
  const trimmed = email.trim();
  return trimmed !== "" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

/**
 * Returns a new list with the target client's name, contact name, contact email, and company updated.
 *
 * @param clients - Existing client list.
 * @param id - Id of the client to update.
 * @param name - New name value.
 * @param contactName - New point-of-contact name.
 * @param contactEmail - New point-of-contact email address.
 * @param company - New company/organization name (empty string clears it).
 * @returns Updated client list.
 */
export function updateClientInList(
  clients: WorkClient[],
  id: string,
  name: string,
  contactName: string,
  contactEmail: string,
  company = ""
): WorkClient[] {
  return clients.map((client) =>
    client.id === id
      ? {
          ...client,
          name: name.trim(),
          contactName: contactName.trim(),
          contactEmail: contactEmail.trim(),
          company: company.trim() || undefined
        }
      : client
  );
}

/**
 * Returns a new list with the target client removed.
 *
 * @param clients - Existing client list.
 * @param id - Id of the client to remove.
 * @returns Filtered client list.
 */
export function removeClientFromList(clients: WorkClient[], id: string): WorkClient[] {
  return clients.filter((client) => client.id !== id);
}

/**
 * Counts how many projects reference the given client.
 *
 * @param projects - Existing project list.
 * @param clientId - Client id to count usages of.
 * @returns Total number of matching projects.
 */
export function countProjectsUsingClient(projects: WorkProject[], clientId: string): number {
  return projects.filter((project) => project.clientId === clientId).length;
}

/**
 * Returns a new list with every project belonging to the given client removed.
 *
 * @param projects - Existing project list.
 * @param clientId - Client id whose projects should be removed.
 * @returns Filtered project list.
 */
export function removeProjectsForClient(projects: WorkProject[], clientId: string): WorkProject[] {
  return projects.filter((project) => project.clientId !== clientId);
}

/**
 * Picks the first palette color not already used by an existing project, cycling back to the
 * start of the palette if every color is in use.
 *
 * @param projects - Current projects.
 * @returns A suggested hex color for a new project.
 */
export function pickNextProjectColor(projects: WorkProject[]): string {
  const usedColors = new Set(projects.map((project) => project.color));
  const unused = COLORBLIND_SAFE_PALETTE.find((color) => !usedColors.has(color));

  return unused ?? COLORBLIND_SAFE_PALETTE[0];
}

/**
 * Parses a raw numeric hourly-rate input string into a normalized, cent-rounded value.
 *
 * @param raw - Raw text from a numeric hourly-rate input.
 * @returns A non-negative number rounded to the nearest cent, or null if not a valid non-negative number.
 */
export function parseHourlyRateInput(raw: string): number | null {
  const trimmed = raw.trim();

  if (trimmed === "") {
    return null;
  }

  const value = Number(trimmed);

  if (!Number.isFinite(value) || value < 0) {
    return null;
  }

  return Math.round(value * 100) / 100;
}

/**
 * Creates a new WorkProject with a generated id.
 *
 * @param name - Display name for the project.
 * @param color - Hex color used to render the project on the chart and calendar.
 * @param clientId - Id of the client this project is scoped to.
 * @param hourlyRate - Billing rate in dollars per hour.
 * @returns A new WorkProject.
 */
export function createProject(name: string, color: string, clientId: string, hourlyRate: number): WorkProject {
  return { id: createId("project"), name: name.trim(), color, clientId, hourlyRate };
}

/**
 * Returns true if any project other than the one being edited shares the given name (case-insensitive).
 *
 * @param projects - Existing project list to check against.
 * @param name - Name to test for a conflict.
 * @param excludeId - Id of the project being edited, if any, so it is not matched against itself.
 * @returns Whether the name is already taken by another project.
 */
export function isProjectNameTaken(projects: WorkProject[], name: string, excludeId?: string): boolean {
  const normalized = name.trim().toLowerCase();
  return projects.some((project) => project.id !== excludeId && project.name.toLowerCase() === normalized);
}

/**
 * Returns a new list with the target project's name, color, client, and hourly rate updated.
 *
 * @param projects - Existing project list.
 * @param id - Id of the project to update.
 * @param name - New name value.
 * @param color - New color value.
 * @param clientId - New client id value.
 * @param hourlyRate - New billing rate in dollars per hour.
 * @returns Updated project list.
 */
export function updateProjectInList(
  projects: WorkProject[],
  id: string,
  name: string,
  color: string,
  clientId: string,
  hourlyRate: number
): WorkProject[] {
  return projects.map((project) =>
    project.id === id ? { ...project, name: name.trim(), color, clientId, hourlyRate } : project
  );
}

/**
 * Returns a new list with the target project removed.
 *
 * @param projects - Existing project list.
 * @param id - Id of the project to remove.
 * @returns Filtered project list.
 */
export function removeProjectFromList(projects: WorkProject[], id: string): WorkProject[] {
  return projects.filter((project) => project.id !== id);
}

/**
 * Counts how many entries across all dates reference the given project.
 *
 * @param entriesByDate - Per-date entry map.
 * @param projectId - Project id to count.
 * @returns Total number of matching entries.
 */
export function countEntriesUsingProject(entriesByDate: WorkEntriesByDate, projectId: string): number {
  return Object.values(entriesByDate).reduce(
    (total, entries) => total + entries.filter((entry) => entry.projectId === projectId).length,
    0
  );
}

/**
 * Returns a new entries-by-date map with every entry referencing the given project removed,
 * across every date.
 *
 * @param entriesByDate - Per-date entry map.
 * @param projectId - Project id whose entries should be removed.
 * @returns Updated per-date entry map with that project's entries filtered out.
 */
export function removeEntriesForProject(entriesByDate: WorkEntriesByDate, projectId: string): WorkEntriesByDate {
  return Object.fromEntries(
    Object.entries(entriesByDate).map(([dateKey, entries]) => [
      dateKey,
      entries.filter((entry) => entry.projectId !== projectId)
    ])
  );
}

/**
 * Creates a new WorkEntry with a generated id.
 *
 * @param projectId - Id of the project this entry logs hours against.
 * @param hours - Decimal hours logged.
 * @returns A new WorkEntry.
 */
export function createEntry(projectId: string, hours: number): WorkEntry {
  return { id: createId("entry"), projectId, hours };
}

/**
 * Returns a new entries-by-date map with the given entry appended under dateKey.
 *
 * @param entriesByDate - Per-date entry map.
 * @param dateKey - Date key to append the entry under.
 * @param entry - Entry to add.
 * @returns Updated per-date entry map.
 */
export function addEntryToDate(entriesByDate: WorkEntriesByDate, dateKey: string, entry: WorkEntry): WorkEntriesByDate {
  return {
    ...entriesByDate,
    [dateKey]: [...(entriesByDate[dateKey] ?? []), entry]
  };
}

/**
 * Returns a new entries-by-date map with the matching entry's project and hours updated.
 *
 * @param entriesByDate - Per-date entry map.
 * @param dateKey - Date key the entry belongs to.
 * @param entryId - Id of the entry to update.
 * @param projectId - New project id value.
 * @param hours - New hours value.
 * @returns Updated per-date entry map.
 */
export function updateEntryInDate(
  entriesByDate: WorkEntriesByDate,
  dateKey: string,
  entryId: string,
  projectId: string,
  hours: number
): WorkEntriesByDate {
  return {
    ...entriesByDate,
    [dateKey]: (entriesByDate[dateKey] ?? []).map((entry) =>
      entry.id === entryId ? { ...entry, projectId, hours } : entry
    )
  };
}

/**
 * Returns a new entries-by-date map with the matching entry removed from dateKey.
 *
 * @param entriesByDate - Per-date entry map.
 * @param dateKey - Date key the entry belongs to.
 * @param entryId - Id of the entry to remove.
 * @returns Updated per-date entry map.
 */
export function removeEntryFromDate(entriesByDate: WorkEntriesByDate, dateKey: string, entryId: string): WorkEntriesByDate {
  return {
    ...entriesByDate,
    [dateKey]: (entriesByDate[dateKey] ?? []).filter((entry) => entry.id !== entryId)
  };
}
