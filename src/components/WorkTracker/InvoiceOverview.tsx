import type { MonthlyInvoiceOverview } from "../../lib/workTrackerInvoice";

type InvoiceOverviewProps = {
  overview: MonthlyInvoiceOverview;
  monthLabel: string;
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
 * Work Tracker card showing a per-client, per-project breakdown of hours and value earned for
 * the visible month, with subtotals per client/project and a grand total — a lightweight
 * precursor to generating an actual invoice document.
 */
function InvoiceOverview({ overview, monthLabel }: InvoiceOverviewProps) {
  const { clientGroups, grandTotalEarned } = overview;

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
                <p className="shrink-0 text-sm font-semibold text-app-text">{formatCurrency(group.totalEarned)}</p>
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
    </section>
  );
}

export default InvoiceOverview;
