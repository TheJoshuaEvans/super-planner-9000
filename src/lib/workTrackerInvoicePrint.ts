import { escapeHtml } from "./htmlEscape";
import type { ClientInvoiceGroup } from "./workTrackerInvoice";
import type { UserContactInfo } from "../store/workTrackerStore.types";

/**
 * Formats a Date as a human-readable invoice date label.
 *
 * @param date - Date to format.
 * @returns A label like "June 15, 2026".
 */
export function formatInvoiceDateLabel(date: Date): string {
  return new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(date);
}

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
 * Builds the "From" address block's lines, omitting any that are blank.
 *
 * @param fromContact - The user's own contact info.
 * @returns Non-empty, escaped lines to render in order.
 */
function buildFromLines(fromContact: UserContactInfo): string[] {
  const stateAndPostal = [fromContact.state, fromContact.postalCode].filter(Boolean).join(" ");
  const cityLine = [fromContact.city, stateAndPostal].filter(Boolean).join(", ");

  return [fromContact.name, fromContact.addressLine1, fromContact.addressLine2, cityLine, fromContact.country, fromContact.email, fromContact.phone]
    .filter((line) => line.trim() !== "")
    .map((line) => escapeHtml(line));
}

/**
 * Builds the "Bill To" block's lines: the client's company (falling back to their name) as the
 * headline, then their point of contact's name/email if present.
 *
 * @param clientGroup - The client/billing-period data being invoiced.
 * @returns Non-empty, escaped lines to render in order.
 */
function buildBillToLines(clientGroup: ClientInvoiceGroup): string[] {
  const headline = clientGroup.company || clientGroup.clientName;

  return [headline, clientGroup.contactName, clientGroup.contactEmail]
    .filter((line) => line.trim() !== "")
    .map((line) => escapeHtml(line));
}

/**
 * Builds a standalone, printable HTML invoice document for one client's billing period: a
 * professional business-document layout (not the Shopping List's handwritten-note styling),
 * reusing the same print mechanism — inline styles, a `@page` margin, and a font-ready-then-print
 * script — but the app's own system font stack on a white background, for a reliable,
 * no-network-dependency document.
 *
 * @param clientGroup - The client's projects/totals for the billing period being invoiced.
 * @param billingPeriodLabel - Human-readable label for the billing period, e.g. "June 2026".
 * @param fromContact - The user's own contact info, shown as the "from" party.
 * @param invoiceDateLabel - Pre-formatted date the invoice was submitted, e.g. "June 15, 2026".
 * @param dueDateLabel - Pre-formatted date payment is due, e.g. "July 15, 2026".
 * @param invoiceCode - The finalized invoice code, e.g. "ACM-2026-06-001".
 * @returns A complete HTML document string ready to be written to a print window.
 */
export function buildInvoicePrintHtml(
  clientGroup: ClientInvoiceGroup,
  billingPeriodLabel: string,
  fromContact: UserContactInfo,
  invoiceDateLabel: string,
  dueDateLabel: string,
  invoiceCode: string
): string {
  const fromLines = buildFromLines(fromContact);
  const billToLines = buildBillToLines(clientGroup);

  const rowsHtml = clientGroup.projects
    .map(
      (line) => `<tr>
            <td>${escapeHtml(line.projectName)}</td>
            <td class="num">${line.hours}</td>
            <td class="num">${formatCurrency(line.hourlyRate)}</td>
            <td class="num">${formatCurrency(line.earned)}</td>
          </tr>`
    )
    .join("\n");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Invoice ${escapeHtml(invoiceCode)}</title>
    <style>
      @page { margin: 2cm; }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: "Avenir Next", "Segoe UI", "Noto Sans", sans-serif;
        background: #ffffff;
        color: #1f2933;
      }
      .page {
        max-width: 48rem;
        margin: 0 auto;
        padding: 2.5rem;
      }
      .header {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        border-bottom: 2px solid #0f9488;
        padding-bottom: 1rem;
        margin-bottom: 1.5rem;
      }
      h1 {
        margin: 0;
        font-size: 1.75rem;
        letter-spacing: 0.08em;
        color: #0f9488;
      }
      .meta {
        text-align: right;
        font-size: 0.85rem;
        color: #52606d;
      }
      .meta strong {
        color: #1f2933;
      }
      .parties {
        display: flex;
        justify-content: space-between;
        gap: 2rem;
        margin-bottom: 2rem;
      }
      .party {
        flex: 1;
      }
      .party-label {
        margin: 0 0 0.35rem;
        font-size: 0.75rem;
        font-weight: 700;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: #52606d;
      }
      .party p {
        margin: 0;
        font-size: 0.95rem;
        line-height: 1.5;
      }
      .party p.headline {
        font-weight: 700;
        font-size: 1.05rem;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 1.5rem;
      }
      th, td {
        padding: 0.5rem 0.6rem;
        font-size: 0.9rem;
        text-align: left;
      }
      th {
        border-bottom: 2px solid #1f2933;
        font-size: 0.75rem;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        color: #52606d;
      }
      tr {
        break-inside: avoid;
      }
      tbody tr {
        border-bottom: 1px solid #e4e7eb;
      }
      .num {
        text-align: right;
      }
      .totals {
        display: flex;
        justify-content: flex-end;
        gap: 2rem;
        border-top: 2px solid #1f2933;
        padding-top: 0.75rem;
      }
      .totals-label {
        font-size: 0.9rem;
        color: #52606d;
      }
      .totals-value {
        font-size: 1.3rem;
        font-weight: 700;
      }
      .footer {
        margin-top: 2.5rem;
        text-align: center;
        font-size: 0.85rem;
        color: #52606d;
      }
    </style>
  </head>
  <body>
    <div class="page">
      <div class="header">
        <h1>INVOICE</h1>
        <div class="meta">
          <p><strong>${escapeHtml(invoiceCode)}</strong></p>
          <p>Date Submitted: ${escapeHtml(invoiceDateLabel)}</p>
          <p>Payment Due: ${escapeHtml(dueDateLabel)}</p>
          <p>Billing Period: ${escapeHtml(billingPeriodLabel)}</p>
        </div>
      </div>

      <div class="parties">
        <div class="party">
          <p class="party-label">From</p>
          ${fromLines.map((line, index) => `<p${index === 0 ? ' class="headline"' : ""}>${line}</p>`).join("\n          ")}
        </div>
        <div class="party">
          <p class="party-label">Bill To</p>
          ${billToLines.map((line, index) => `<p${index === 0 ? ' class="headline"' : ""}>${line}</p>`).join("\n          ")}
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Project</th>
            <th class="num">Hours</th>
            <th class="num">Rate</th>
            <th class="num">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>

      <div class="totals">
        <p class="totals-label">Total Hours: ${clientGroup.totalHours}</p>
        <p class="totals-value">${formatCurrency(clientGroup.totalEarned)}</p>
      </div>

      <p class="footer">Thank you for your business!</p>
    </div>
    <script>
      var printNow = function () { window.print(); };
      if (document.fonts && document.fonts.ready) {
        Promise.race([
          document.fonts.ready,
          new Promise(function (resolve) { setTimeout(resolve, 2000); })
        ]).then(printNow);
      } else {
        printNow();
      }
    </script>
  </body>
</html>`;
}
