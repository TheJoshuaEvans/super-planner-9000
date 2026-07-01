import { describe, expect, it } from "vitest";
import { buildInvoicePrintHtml, formatInvoiceDateLabel } from "./workTrackerInvoicePrint";
import type { ClientInvoiceGroup } from "./workTrackerInvoice";
import type { UserContactInfo } from "../store/workTrackerStore.types";

const fromContact: UserContactInfo = {
  name: "Jane Smith",
  email: "jane@example.com",
  phone: "555-1234",
  addressLine1: "1 Main St",
  addressLine2: "Suite 2",
  city: "Springfield",
  state: "IL",
  postalCode: "62701",
  country: "USA"
};

const blankContact: UserContactInfo = {
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

function makeGroup(overrides: Partial<ClientInvoiceGroup> = {}): ClientInvoiceGroup {
  return {
    clientId: "c1",
    clientName: "Acme Co",
    clientCode: "ABC",
    contactName: "John Buyer",
    contactEmail: "john@acme.com",
    company: undefined,
    paymentTerms: 30,
    projects: [
      { projectId: "p1", projectName: "Website", projectColor: "#000", hours: 4, hourlyRate: 50, earned: 200 },
      { projectId: "p2", projectName: "Branding", projectColor: "#111", hours: 2, hourlyRate: 40, earned: 80 }
    ],
    totalHours: 6,
    totalEarned: 280,
    ...overrides
  };
}

describe("formatInvoiceDateLabel", () => {
  it("formats a date as a long-form label", () => {
    expect(formatInvoiceDateLabel(new Date(2026, 5, 15))).toBe("June 15, 2026");
  });
});

describe("buildInvoicePrintHtml", () => {
  it("includes the invoice code, date, and billing period", () => {
    const html = buildInvoicePrintHtml(makeGroup(), "June 2026", fromContact, "June 15, 2026", "July 15, 2026", "ABC-2026-06-001");

    expect(html).toContain("ABC-2026-06-001");
    expect(html).toContain("June 15, 2026");
    expect(html).toContain("June 2026");
  });

  it("labels the submitted date and due date distinctly", () => {
    const html = buildInvoicePrintHtml(makeGroup(), "June 2026", fromContact, "June 15, 2026", "July 15, 2026", "ABC-2026-06-001");

    expect(html).toContain("Date Submitted: June 15, 2026");
    expect(html).toContain("Payment Due: July 15, 2026");
  });

  it("uses the client's company as the Bill To headline when present", () => {
    const html = buildInvoicePrintHtml(
      makeGroup({ company: "Acme Corporation" }),
      "June 2026",
      fromContact,
      "June 15, 2026",
      "July 15, 2026",
      "ABC-2026-06-001"
    );

    expect(html).toContain("Acme Corporation");
  });

  it("falls back to the client's name as the Bill To headline when no company is set", () => {
    const html = buildInvoicePrintHtml(makeGroup(), "June 2026", fromContact, "June 15, 2026", "July 15, 2026", "ABC-2026-06-001");

    expect(html).toContain("Acme Co");
  });

  it("includes the client's contact name and email", () => {
    const html = buildInvoicePrintHtml(makeGroup(), "June 2026", fromContact, "June 15, 2026", "July 15, 2026", "ABC-2026-06-001");

    expect(html).toContain("John Buyer");
    expect(html).toContain("john@acme.com");
  });

  it("includes the From party's full address", () => {
    const html = buildInvoicePrintHtml(makeGroup(), "June 2026", fromContact, "June 15, 2026", "July 15, 2026", "ABC-2026-06-001");

    expect(html).toContain("Jane Smith");
    expect(html).toContain("1 Main St");
    expect(html).toContain("Suite 2");
    expect(html).toContain("Springfield, IL 62701");
    expect(html).toContain("USA");
    expect(html).toContain("jane@example.com");
    expect(html).toContain("555-1234");
  });

  it("omits blank From fields without rendering literal blanks", () => {
    const html = buildInvoicePrintHtml(makeGroup(), "June 2026", blankContact, "June 15, 2026", "July 15, 2026", "ABC-2026-06-001");

    expect(html).not.toContain("<p></p>");
    expect(html).not.toContain("undefined");
  });

  it("renders one table row per project line with hours, rate, and amount", () => {
    const html = buildInvoicePrintHtml(makeGroup(), "June 2026", fromContact, "June 15, 2026", "July 15, 2026", "ABC-2026-06-001");

    expect(html).toContain("Website");
    expect(html).toContain("Branding");
    expect(html).toContain("$50.00");
    expect(html).toContain("$200.00");
    expect(html).toContain("$40.00");
    expect(html).toContain("$80.00");
  });

  it("shows total hours and the grand total, correctly formatted", () => {
    const html = buildInvoicePrintHtml(makeGroup(), "June 2026", fromContact, "June 15, 2026", "July 15, 2026", "ABC-2026-06-001");

    expect(html).toContain("Total Hours: 6");
    expect(html).toContain("$280.00");
  });

  it("includes break-inside: avoid and a font-ready-then-print script", () => {
    const html = buildInvoicePrintHtml(makeGroup(), "June 2026", fromContact, "June 15, 2026", "July 15, 2026", "ABC-2026-06-001");

    expect(html).toContain("break-inside: avoid");
    expect(html).toContain("document.fonts.ready");
    expect(html).toContain("window.print()");
  });

  it("escapes HTML-sensitive characters in client, contact, and project names", () => {
    const html = buildInvoicePrintHtml(
      makeGroup({
        clientName: "<script>alert(1)</script>",
        contactName: '"Quoted" & Co',
        projects: [{ projectId: "p1", projectName: "<b>Bold</b>", projectColor: "#000", hours: 1, hourlyRate: 1, earned: 1 }]
      }),
      "June 2026",
      fromContact,
      "June 15, 2026",
      "July 15, 2026",
      "ABC-2026-06-001"
    );

    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).not.toContain("<b>Bold</b>");
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(html).toContain("&quot;Quoted&quot; &amp; Co");
    expect(html).toContain("&lt;b&gt;Bold&lt;/b&gt;");
  });
});
