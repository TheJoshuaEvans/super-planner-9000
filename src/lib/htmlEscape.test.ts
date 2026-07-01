import { describe, expect, it } from "vitest";
import { escapeHtml } from "./htmlEscape";

describe("escapeHtml", () => {
  it("leaves plain text untouched", () => {
    expect(escapeHtml("Hello, world!")).toBe("Hello, world!");
  });

  it("escapes ampersands, angle brackets, and double quotes", () => {
    expect(escapeHtml(`<script>alert("hi")</script> & friends`)).toBe(
      "&lt;script&gt;alert(&quot;hi&quot;)&lt;/script&gt; &amp; friends"
    );
  });

  it("escapes ampersands before other entities, avoiding double-escaping", () => {
    expect(escapeHtml("&lt;")).toBe("&amp;lt;");
  });
});
