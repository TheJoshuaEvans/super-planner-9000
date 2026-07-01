import { useState } from "react";
import { formatCalendarDateIdentity, parseCalendarDateKey } from "../../lib/calendar";
import { buildInvoiceCode, computeInvoiceDueDate } from "../../lib/workTrackerInvoice";
import type { ClientInvoiceGroup } from "../../lib/workTrackerInvoice";
import { formatInvoiceDateLabel } from "../../lib/workTrackerInvoicePrint";

type InvoiceConfirmDialogProps = {
  group: ClientInvoiceGroup;
  billingPeriodLabel: string;
  periodKey: string;
  defaultIndex: number;
  submittedDate: Date;
  onConfirm: (finalIndex: number, dueDate: Date) => void;
  onCancel: () => void;
};

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
 * Confirmation dialog previewing the full content of an about-to-be-generated invoice, with an
 * editable invoice index (defaulting to the next one for this client/period) so a voided or
 * re-issued invoice can reuse or deliberately override the number, and an editable due date
 * (defaulting to the client's payment terms applied to today). Purpose-built rather than routed
 * through the shared `useConfirmDialogStore`, since that store only supports a simple
 * title/message and has no concept of rich content or embedded editable fields.
 */
function InvoiceConfirmDialog({
  group,
  billingPeriodLabel,
  periodKey,
  defaultIndex,
  submittedDate,
  onConfirm,
  onCancel
}: InvoiceConfirmDialogProps) {
  const [indexText, setIndexText] = useState(String(defaultIndex));
  const [dueDateText, setDueDateText] = useState(
    formatCalendarDateIdentity(computeInvoiceDueDate(submittedDate, group.paymentTerms))
  );

  const parsedIndex = Number(indexText.trim());
  const isValidIndex = Number.isInteger(parsedIndex) && parsedIndex >= 1;
  const previewCode = isValidIndex ? buildInvoiceCode(periodKey, parsedIndex) : null;

  const parsedDueDate = parseCalendarDateKey(dueDateText);
  const isValidDueDate = parsedDueDate !== null;

  const canConfirm = isValidIndex && isValidDueDate;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      role="presentation"
      onClick={onCancel}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="invoice-confirm-title"
        className="w-full max-w-lg rounded-lg border border-app-border bg-app-surface p-5 shadow-card"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="invoice-confirm-title" className="text-lg font-semibold text-app-text">
          Generate Invoice
        </h2>

        <div className="mt-3 space-y-1 text-sm">
          <p className="font-semibold text-app-text">{group.company || group.clientName}</p>
          {group.contactName || group.contactEmail ? (
            <p className="text-app-muted">
              {[group.contactName, group.contactEmail].filter(Boolean).join(" · ")}
            </p>
          ) : null}
          <p className="text-app-muted">
            {billingPeriodLabel} · Submitted {formatInvoiceDateLabel(submittedDate)}
          </p>
        </div>

        <ul className="mt-3 max-h-40 space-y-1 overflow-y-auto rounded-md border border-app-border bg-app-panel/60 p-2">
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

        <div className="mt-2 flex items-center justify-between gap-3 text-sm">
          <p className="font-semibold uppercase tracking-wide text-app-muted">Total</p>
          <p className="font-semibold text-app-text">{formatCurrency(group.totalEarned)}</p>
        </div>

        <div className="mt-4 flex flex-wrap gap-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-app-muted" htmlFor="invoice-index">
              Invoice Index
            </label>
            <div className="flex items-center gap-2">
              <input
                id="invoice-index"
                type="number"
                min="1"
                step="1"
                value={indexText}
                onChange={(e) => setIndexText(e.target.value)}
                className="w-24 rounded-md border border-app-border bg-app-bg px-2 py-1.5 text-sm text-app-text focus:border-app-accent/60 focus:outline-none focus:ring-2 focus:ring-app-accent/20"
              />
              <p className="truncate text-sm text-app-muted">{previewCode ?? "Enter a valid index"}</p>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-app-muted" htmlFor="invoice-due-date">
              Due Date
            </label>
            <input
              id="invoice-due-date"
              type="date"
              value={dueDateText}
              onChange={(e) => setDueDateText(e.target.value)}
              className="block rounded-md border border-app-border bg-app-bg px-2 py-1.5 text-sm text-app-text focus:border-app-accent/60 focus:outline-none focus:ring-2 focus:ring-app-accent/20"
            />
            {!isValidDueDate && <p className="text-xs text-red-400">Enter a valid date.</p>}
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-app-border bg-app-panel/85 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-app-muted transition hover:border-app-accent/70 hover:text-app-text"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              if (isValidIndex && parsedDueDate) {
                onConfirm(parsedIndex, parsedDueDate);
              }
            }}
            disabled={!canConfirm}
            className="rounded-md bg-app-accent px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-app-accentStrong disabled:cursor-not-allowed disabled:opacity-40"
          >
            Confirm &amp; Print
          </button>
        </div>
      </div>
    </div>
  );
}

export default InvoiceConfirmDialog;
