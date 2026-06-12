import { describe, expect, it } from "vitest";
import { buildShoppingListPrintHtml, formatShoppingListDateRangeLabel } from "./shoppingListPrint";
import type { ShoppingListItem } from "./shoppingList";

describe("formatShoppingListDateRangeLabel", () => {
  it("returns a single label when start and end are the same day", () => {
    expect(formatShoppingListDateRangeLabel("2026-06-11", "2026-06-11")).toBe(
      "Thursday, June 11, 2026"
    );
  });

  it("returns a combined label for a multi-day range", () => {
    expect(formatShoppingListDateRangeLabel("2026-06-11", "2026-06-14")).toBe(
      "Thursday, June 11, 2026 - Sunday, June 14, 2026"
    );
  });
});

describe("buildShoppingListPrintHtml", () => {
  const items: ShoppingListItem[] = [
    { componentId: "chicken", name: "Chicken", quantity: 200, unit: "g" },
    { componentId: "garlic", name: "Garlic", quantity: 0, unit: "" }
  ];

  it("includes the title and date range label", () => {
    const html = buildShoppingListPrintHtml(items, "Thursday, June 11, 2026");

    expect(html).toContain("<h1>Shopping List</h1>");
    expect(html).toContain("Thursday, June 11, 2026");
  });

  it("renders each item with its quantity and unit", () => {
    const html = buildShoppingListPrintHtml(items, "Thursday, June 11, 2026");

    expect(html).toContain("Chicken");
    expect(html).toContain("200 g");
  });

  it("renders items with no quantity without an amount suffix", () => {
    const html = buildShoppingListPrintHtml(items, "Thursday, June 11, 2026");

    const garlicLine = html.split("\n").find((line) => line.includes("Garlic"));
    expect(garlicLine).toBeDefined();
    expect(garlicLine).not.toContain("amount");
  });

  it("shows a placeholder message when the list is empty", () => {
    const html = buildShoppingListPrintHtml([], "Thursday, June 11, 2026");

    expect(html).toContain("Nothing on the list yet!");
  });

  it("defers printing until the handwritten font has loaded or timed out", () => {
    const html = buildShoppingListPrintHtml(items, "Thursday, June 11, 2026");

    expect(html).toContain("document.fonts.ready");
    expect(html).toContain("window.print()");
  });

  it("escapes HTML-sensitive characters in item names and date labels", () => {
    const html = buildShoppingListPrintHtml(
      [{ componentId: "x", name: "<Tags> & \"Stuff\"", quantity: 1, unit: "g" }],
      "<range>"
    );

    expect(html).not.toContain("<Tags>");
    expect(html).toContain("&lt;Tags&gt; &amp; &quot;Stuff&quot;");
    expect(html).toContain("&lt;range&gt;");
  });
});
