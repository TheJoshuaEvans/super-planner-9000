import { useMemo, useState, type ChangeEvent } from "react";
import { getRelativeCalendarDateKey } from "../../lib/calendar";
import { buildDateKeyRange, buildShoppingList } from "../../lib/shoppingList";
import { buildShoppingListPrintHtml, formatShoppingListDateRangeLabel } from "../../lib/shoppingListPrint";
import { useMealStore } from "../../store/mealStore";
import { usePlannerStore } from "../../store/plannerStore";

const dateInputClassName =
  "rounded-md border border-app-border bg-app-surface px-2.5 py-1.5 text-sm text-app-text focus:outline-none focus:ring-2 focus:ring-app-accent";

const printButtonClassName =
  "rounded-md bg-app-accent px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-app-accentStrong disabled:cursor-not-allowed disabled:opacity-40";

type ShoppingListPanelProps = {
  /** How many days past today the end-date picker defaults to (0 = today only). */
  defaultEndDateOffsetDays?: number;
};

/**
 * Card that lets the user pick an upcoming date range and generates an aggregated shopping
 * list for the meals assigned to "eat" segments within that range.
 */
function ShoppingListPanel({ defaultEndDateOffsetDays = 0 }: ShoppingListPanelProps) {
  const segmentsByDate = usePlannerStore((state) => state.segmentsByDate);
  const meals = useMealStore((state) => state.meals);
  const components = useMealStore((state) => state.components);

  const todayKey = useMemo(() => getRelativeCalendarDateKey(0), []);
  const defaultEndDateKey = useMemo(
    () => getRelativeCalendarDateKey(defaultEndDateOffsetDays),
    [defaultEndDateOffsetDays]
  );
  const [startDateKey, setStartDateKey] = useState(todayKey);
  const [endDateKey, setEndDateKey] = useState(defaultEndDateKey);

  /** Updates the range start date, pulling the end date forward if it would precede it. */
  function handleStartDateChange(event: ChangeEvent<HTMLInputElement>): void {
    const value = event.target.value;
    setStartDateKey(value);
    if (endDateKey < value) {
      setEndDateKey(value);
    }
  }

  /** Updates the range end date, pulling the start date back if it would follow it. */
  function handleEndDateChange(event: ChangeEvent<HTMLInputElement>): void {
    const value = event.target.value;
    setEndDateKey(value);
    if (startDateKey > value) {
      setStartDateKey(value);
    }
  }

  const shoppingList = useMemo(() => {
    const dateKeys = buildDateKeyRange(startDateKey, endDateKey);
    return buildShoppingList(dateKeys, segmentsByDate, meals, components);
  }, [startDateKey, endDateKey, segmentsByDate, meals, components]);

  /** Opens a new window with a printable, handwritten-style shopping list and triggers the print dialog. */
  function handlePrint(): void {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      return;
    }

    const dateRangeLabel = formatShoppingListDateRangeLabel(startDateKey, endDateKey);
    printWindow.document.open();
    printWindow.document.write(buildShoppingListPrintHtml(shoppingList, dateRangeLabel));
    printWindow.document.close();
    printWindow.focus();
  }

  return (
    <section className="rounded-lg border border-app-border bg-app-surface p-4">
      <header className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-md border border-app-border bg-app-panel px-3 py-2">
        <h3 className="text-base font-semibold tracking-tight sm:text-lg">Shopping List</h3>
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-app-muted">
          <label className="flex items-center gap-2">
            From
            <input
              type="date"
              value={startDateKey}
              min={todayKey}
              onChange={handleStartDateChange}
              className={dateInputClassName}
              aria-label="Shopping list start date"
            />
          </label>
          <label className="flex items-center gap-2">
            To
            <input
              type="date"
              value={endDateKey}
              min={startDateKey}
              onChange={handleEndDateChange}
              className={dateInputClassName}
              aria-label="Shopping list end date"
            />
          </label>
        </div>
      </header>

      {shoppingList.length === 0 ? (
        <p className="py-4 text-center text-sm text-app-muted">
          No meals are assigned to this date range yet.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-1.5">
          {shoppingList.map((item) => (
            <li
              key={`${item.componentId}::${item.unit}`}
              className="flex items-center justify-between gap-3 rounded-md border border-app-border bg-app-panel/60 px-3 py-2 text-sm"
            >
              <span className="text-app-text">{item.name}</span>
              {item.quantity > 0 ? (
                <span className="font-semibold text-app-muted">
                  {item.quantity}
                  {item.unit ? ` ${item.unit}` : ""}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3 flex justify-end">
        <button
          type="button"
          onClick={handlePrint}
          disabled={shoppingList.length === 0}
          className={printButtonClassName}
        >
          Print Shopping List
        </button>
      </div>
    </section>
  );
}

export default ShoppingListPanel;
