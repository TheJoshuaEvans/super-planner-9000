import { useState } from "react";
import InvoiceConfirmDialog from "./InvoiceConfirmDialog";
import { isValidClientCode } from "../../lib/workTrackerData";
import { buildInvoiceCode, buildInvoicePeriodKey, getNextInvoiceIndex } from "../../lib/workTrackerInvoice";
import type { ClientInvoiceGroup, MonthlyInvoiceOverview } from "../../lib/workTrackerInvoice";
import { buildInvoicePrintHtml, formatInvoiceDateLabel } from "../../lib/workTrackerInvoicePrint";
import { useToastStore } from "../../store/toastStore";
import { useWorkTrackerStore } from "../../store/workTrackerStore";

type InvoiceOverviewProps = {
  overview: MonthlyInvoiceOverview;
  monthLabel: string;
  visibleMonth: Date;
};

const generateInvoiceButtonClassName =
  "shrink-0 rounded-md bg-app-accent px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-app-accentStrong";

/**
 * Formats a dollar amount with two decimal places and a leading "$".
 *
 * @param value - Raw dollar amount.
 * @returns Formatted currency string, e.g. "$1,234.50".
 */
function formatCurrency(value: number): string {
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Work Tracker card showing a per-client, per-project breakdown of hours and value earned for
 * the visible month, with subtotals per client/project, a grand total, and a "Generate Invoice"
 * button per client that previews and prints an actual invoice document.
 */
function InvoiceOverview({ overview, monthLabel, visibleMonth }: InvoiceOverviewProps) {
  const { clientGroups, grandTotalEarned } = overview;

  const userContactInfo = useWorkTrackerStore((state) => state.userContactInfo);
  const invoiceSequenceByPeriod = useWorkTrackerStore((state) => state.invoiceSequenceByPeriod);
  const recordInvoiceIndex = useWorkTrackerStore((state) => state.recordInvoiceIndex);
  const showToast = useToastStore((state) => state.showToast);

  const [pendingInvoice, setPendingInvoice] = useState<{ group: ClientInvoiceGroup; submittedDate: Date } | null>(
    null
  );

  /**
   * Opens the invoice confirmation dialog for a client group, or shows a guidance toast instead
   * if the client doesn't have a valid client code yet (e.g. it predates this feature and the
   * live store was never migrated — migrations only run on JSON import/Drive restore). Captures
   * "now" as the submitted date once, here, so it stays consistent between the dialog's default
   * due-date calculation and the final printed document.
   *
   * @param group - The client group to generate an invoice for.
   */
  function handleGenerateInvoiceClick(group: ClientInvoiceGroup): void {
    if (!isValidClientCode(group.clientCode)) {
      showToast({
        title: "Client code required",
        message: `Add a client code for ${group.clientName} in Settings → Clients first.`,
        level: "error"
      });
      return;
    }

    setPendingInvoice({ group, submittedDate: new Date() });
  }

  /**
   * Records the confirmed invoice index for this client/period, then opens a new window with the
   * printable invoice document and triggers its print dialog.
   *
   * @param finalIndex - The invoice index the user confirmed (default or manually overridden).
   * @param dueDate - The due date the user confirmed (default or manually overridden).
   */
  function handleConfirmInvoice(finalIndex: number, dueDate: Date): void {
    if (!pendingInvoice) {
      return;
    }

    const { group, submittedDate } = pendingInvoice;
    const periodKey = buildInvoicePeriodKey(group.clientCode, visibleMonth);
    recordInvoiceIndex(periodKey, finalIndex);

    const invoiceCode = buildInvoiceCode(periodKey, finalIndex);
    const printWindow = window.open("", "_blank");

    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(
        buildInvoicePrintHtml(
          group,
          monthLabel,
          userContactInfo,
          formatInvoiceDateLabel(submittedDate),
          formatInvoiceDateLabel(dueDate),
          invoiceCode
        )
      );
      printWindow.document.close();
      printWindow.focus();
    }

    setPendingInvoice(null);
  }

  return (
    <section className="rounded-lg border border-app-border bg-app-surface p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold tracking-tight sm:text-lg">Invoice Overview</h3>
        <p className="text-sm text-app-muted">{monthLabel}</p>
      </div>

      {clientGroups.length === 0 ? (
        <p className="py-6 text-center text-sm text-app-muted">No hours logged this month yet.</p>
      ) : (
        <div className="space-y-3">
          {clientGroups.map((group) => (
            <div key={group.clientId} className="space-y-2 rounded-md border border-app-border bg-app-panel/60 p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="truncate text-sm font-semibold text-app-text">{group.clientName}</p>
                <div className="flex shrink-0 items-center gap-2">
                  <p className="text-sm font-semibold text-app-text">{formatCurrency(group.totalEarned)}</p>
                  <button
                    type="button"
                    onClick={() => handleGenerateInvoiceClick(group)}
                    aria-label={`Generate invoice for ${group.clientName}`}
                    className={generateInvoiceButtonClassName}
                  >
                    Generate Invoice
                  </button>
                </div>
              </div>

              <ul className="space-y-1">
                {group.projects.map((line) => (
                  <li key={line.projectId} className="flex items-center justify-between gap-3 text-sm">
                    <span className="flex min-w-0 items-center gap-2">
                      <span
                        aria-hidden="true"
                        className="h-3 w-3 shrink-0 rounded-full border border-app-border"
                        style={{ backgroundColor: line.projectColor }}
                      />
                      <span className="truncate text-app-text">{line.projectName}</span>
                      <span className="shrink-0 text-xs text-app-muted">
                        {line.hours}h @ {formatCurrency(line.hourlyRate)}/hr
                      </span>
                    </span>
                    <span className="shrink-0 text-app-muted">{formatCurrency(line.earned)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="flex items-center justify-between gap-3 border-t border-app-border pt-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-app-muted">Total Earned</p>
            <p className="text-lg font-bold text-app-text">{formatCurrency(grandTotalEarned)}</p>
          </div>
        </div>
      )}

      {pendingInvoice ? (
        <InvoiceConfirmDialog
          group={pendingInvoice.group}
          billingPeriodLabel={monthLabel}
          periodKey={buildInvoicePeriodKey(pendingInvoice.group.clientCode, visibleMonth)}
          defaultIndex={getNextInvoiceIndex(
            invoiceSequenceByPeriod,
            buildInvoicePeriodKey(pendingInvoice.group.clientCode, visibleMonth)
          )}
          submittedDate={pendingInvoice.submittedDate}
          onConfirm={handleConfirmInvoice}
          onCancel={() => setPendingInvoice(null)}
        />
      ) : null}
    </section>
  );
}

export default InvoiceOverview;
