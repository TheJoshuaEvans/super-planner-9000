import { formatCalendarDateLabel } from "./calendar";
import { escapeHtml } from "./htmlEscape";
import type { ShoppingListItem } from "./shoppingList";

/**
 * Builds a human-readable label describing a shopping list's date range.
 *
 * @param startDateKey - First date key (YYYY-MM-DD) in the range.
 * @param endDateKey - Last date key (YYYY-MM-DD) in the range.
 * @returns A single date label when the range is one day, or "start - end" otherwise.
 */
export function formatShoppingListDateRangeLabel(startDateKey: string, endDateKey: string): string {
  const startLabel = formatCalendarDateLabel(startDateKey);
  if (startDateKey === endDateKey) {
    return startLabel;
  }

  return `${startLabel} - ${formatCalendarDateLabel(endDateKey)}`;
}

/**
 * Formats a shopping list item's amount suffix, or an empty string when no amount was specified.
 *
 * @param item - Shopping list item to format.
 * @returns The item's quantity and unit (e.g. "2 cups"), or "" when quantity is zero.
 */
function formatItemAmount(item: ShoppingListItem): string {
  if (item.quantity <= 0) {
    return "";
  }

  return item.unit ? `${item.quantity} ${item.unit}` : `${item.quantity}`;
}

/**
 * Builds a standalone, printable HTML document rendering a shopping list as a handwritten note.
 *
 * @param items - Aggregated shopping list items to render.
 * @param dateRangeLabel - Human-readable label for the list's date range.
 * @returns A complete HTML document string ready to be written to a print window.
 */
export function buildShoppingListPrintHtml(items: ShoppingListItem[], dateRangeLabel: string): string {
  const itemsHtml =
    items.length > 0
      ? items
          .map((item) => {
            const amount = formatItemAmount(item);
            const amountHtml = amount ? ` <span class="amount">&mdash; ${escapeHtml(amount)}</span>` : "";
            return `<li class="item"><span class="box"></span><span class="label">${escapeHtml(item.name)}${amountHtml}</span></li>`;
          })
          .join("\n")
      : `<li class="item empty">Nothing on the list yet!</li>`;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Shopping List</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&display=swap" rel="stylesheet" />
    <style>
      @page { margin: 1.5cm; }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: "Caveat", cursive;
        background: #fdf8ec;
        color: #1f2933;
      }
      .page {
        min-height: 100vh;
        padding: 2rem 2.5rem;
        background-image: repeating-linear-gradient(
          to bottom,
          transparent 0,
          transparent 2.4rem,
          #c9d6e3 2.4rem,
          #c9d6e3 calc(2.4rem + 1px)
        );
        background-position: 0 4.6rem;
      }
      h1 {
        margin: 0 0 0.25rem;
        font-size: 3rem;
        font-weight: 700;
        color: #14506b;
        transform: rotate(-2deg);
        transform-origin: left;
      }
      .subtitle {
        margin: 0 0 1.5rem;
        font-size: 1.4rem;
        color: #5b6b7a;
      }
      .items {
        list-style: none;
        margin: 0;
        padding: 0;
        column-count: 2;
        column-gap: 3rem;
      }
      .item {
        display: flex;
        align-items: baseline;
        gap: 0.75rem;
        font-size: 1.4rem;
        line-height: 2.4rem;
        break-inside: avoid;
      }
      .box {
        flex: 0 0 auto;
        width: 1.1rem;
        height: 1.1rem;
        margin-bottom: 0.2rem;
        border: 2px solid #1f2933;
        border-radius: 3px;
        transform: rotate(-3deg);
      }
      .amount {
        color: #5b6b7a;
        font-size: 1.1rem;
      }
      .empty {
        color: #5b6b7a;
      }
    </style>
  </head>
  <body>
    <div class="page">
      <h1>Shopping List</h1>
      <p class="subtitle">${escapeHtml(dateRangeLabel)}</p>
      <ul class="items">
        ${itemsHtml}
      </ul>
    </div>
    <script>
      // Wait for the handwritten font to finish loading (or time out) before printing,
      // otherwise the print dialog can open while the page is still showing a fallback font.
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
