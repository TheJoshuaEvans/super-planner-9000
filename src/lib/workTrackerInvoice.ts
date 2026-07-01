import { DEFAULT_PAYMENT_TERMS_DAYS } from "./workTrackerData";
import type { InvoiceSequenceByPeriod, WorkClient, WorkEntriesByDate, WorkProject } from "../store/workTrackerStore.types";

/** One project's logged hours and earned value within a billing period, for a single client. */
export type ProjectInvoiceLine = {
  projectId: string;
  projectName: string;
  projectColor: string;
  hours: number;
  hourlyRate: number;
  earned: number;
};

/** One client's projects (with hours/value), contact details, and totals within a billing period. */
export type ClientInvoiceGroup = {
  clientId: string;
  clientName: string;
  clientCode: string;
  contactName: string;
  contactEmail: string;
  company?: string;
  /** Number of days after invoice submission before payment is due. */
  paymentTerms: number;
  projects: ProjectInvoiceLine[];
  totalHours: number;
  totalEarned: number;
};

/** Full per-client, per-project breakdown for a billing period, plus grand totals. */
export type MonthlyInvoiceOverview = {
  clientGroups: ClientInvoiceGroup[];
  grandTotalHours: number;
  grandTotalEarned: number;
};

/**
 * Rounds a dollar value to the nearest cent, avoiding floating-point accumulation artifacts.
 *
 * @param value - Raw computed dollar amount.
 * @returns Value rounded to 2 decimal places.
 */
function roundToCents(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Builds a per-client, per-project breakdown of hours logged and value earned (hours × hourly
 * rate) within the given month, for invoicing purposes. Only projects with at least one logged
 * hour in the month are included, even if their rate is 0; clients with no such projects are
 * omitted entirely. Client groups and the projects within them are sorted alphabetically by name.
 *
 * @param monthPivot - Any Date within the target month (year/month are read off it).
 * @param entriesByDate - All persisted work entries, keyed by YYYY-MM-DD.
 * @param projects - Known projects (for name/color/hourlyRate/clientId lookups).
 * @param clients - Known clients (for name lookups).
 * @returns The monthly invoice overview: client groups plus grand totals.
 */
export function buildMonthlyInvoiceOverview(
  monthPivot: Date,
  entriesByDate: WorkEntriesByDate,
  projects: WorkProject[],
  clients: WorkClient[]
): MonthlyInvoiceOverview {
  const monthPrefix = `${monthPivot.getFullYear()}-${String(monthPivot.getMonth() + 1).padStart(2, "0")}`;

  const hoursByProjectId = new Map<string, number>();

  for (const [dateKey, entries] of Object.entries(entriesByDate)) {
    if (!dateKey.startsWith(monthPrefix)) {
      continue;
    }

    for (const entry of entries) {
      hoursByProjectId.set(entry.projectId, (hoursByProjectId.get(entry.projectId) ?? 0) + entry.hours);
    }
  }

  const groupsByClientId = new Map<string, ClientInvoiceGroup>();

  for (const project of projects) {
    const hours = hoursByProjectId.get(project.id);

    if (!hours) {
      continue;
    }

    const client = clients.find((candidate) => candidate.id === project.clientId);
    const clientId = client?.id ?? project.clientId;
    const earned = roundToCents(hours * project.hourlyRate);

    const line: ProjectInvoiceLine = {
      projectId: project.id,
      projectName: project.name,
      projectColor: project.color,
      hours,
      hourlyRate: project.hourlyRate,
      earned
    };

    const existingGroup = groupsByClientId.get(clientId);

    if (existingGroup) {
      existingGroup.projects.push(line);
      existingGroup.totalHours += hours;
      existingGroup.totalEarned = roundToCents(existingGroup.totalEarned + earned);
    } else {
      groupsByClientId.set(clientId, {
        clientId,
        clientName: client?.name ?? "No client",
        clientCode: client?.clientCode ?? "",
        contactName: client?.contactName ?? "",
        contactEmail: client?.contactEmail ?? "",
        company: client?.company,
        paymentTerms: client?.paymentTerms ?? DEFAULT_PAYMENT_TERMS_DAYS,
        projects: [line],
        totalHours: hours,
        totalEarned: earned
      });
    }
  }

  const clientGroups = Array.from(groupsByClientId.values())
    .map((group) => ({
      ...group,
      projects: [...group.projects].sort((a, b) => a.projectName.localeCompare(b.projectName))
    }))
    .sort((a, b) => a.clientName.localeCompare(b.clientName));

  const grandTotalHours = clientGroups.reduce((sum, group) => sum + group.totalHours, 0);
  const grandTotalEarned = roundToCents(clientGroups.reduce((sum, group) => sum + group.totalEarned, 0));

  return { clientGroups, grandTotalHours, grandTotalEarned };
}

/**
 * Builds the key used to track a client's invoice sequence for one billing period.
 *
 * @param clientCode - The client's unique 3-character code.
 * @param monthPivot - Any Date within the target month (year/month are read off it).
 * @returns A key of the form `"<CLIENT_CODE>-<YYYY>-<MM>"`.
 */
export function buildInvoicePeriodKey(clientCode: string, monthPivot: Date): string {
  const year = monthPivot.getFullYear();
  const month = String(monthPivot.getMonth() + 1).padStart(2, "0");
  return `${clientCode}-${year}-${month}`;
}

/**
 * Returns the next invoice index to suggest for a billing period: one more than the last
 * recorded index, or 1 if none has been recorded yet.
 *
 * @param invoiceSequenceByPeriod - Persisted last-used index per period.
 * @param periodKey - The period to look up, as built by `buildInvoicePeriodKey`.
 * @returns The suggested next index.
 */
export function getNextInvoiceIndex(invoiceSequenceByPeriod: InvoiceSequenceByPeriod, periodKey: string): number {
  return (invoiceSequenceByPeriod[periodKey] ?? 0) + 1;
}

/**
 * Builds the final, human-facing invoice code for a period and index.
 *
 * @param periodKey - The period, as built by `buildInvoicePeriodKey`.
 * @param index - The invoice index for that period (zero-padded to 3 digits in the result).
 * @returns A code of the form `"<CLIENT_CODE>-<YYYY>-<MM>-<INDEX>"`, e.g. `"ACM-2026-06-001"`.
 */
export function buildInvoiceCode(periodKey: string, index: number): string {
  return `${periodKey}-${String(index).padStart(3, "0")}`;
}

/**
 * Computes an invoice's due date: a fixed number of days after the date it was submitted.
 *
 * @param submittedDate - The date the invoice is submitted/generated.
 * @param paymentTerms - Number of days after submission before payment is due.
 * @returns A new Date, paymentTerms days after submittedDate.
 */
export function computeInvoiceDueDate(submittedDate: Date, paymentTerms: number): Date {
  const dueDate = new Date(submittedDate);
  dueDate.setDate(dueDate.getDate() + paymentTerms);
  return dueDate;
}
