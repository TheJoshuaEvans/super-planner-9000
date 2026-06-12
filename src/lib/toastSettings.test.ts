import { describe, expect, it } from "vitest";
import {
  clampToastAutoDismissSeconds,
  TOAST_AUTO_DISMISS_MAX_SECONDS,
  TOAST_AUTO_DISMISS_MIN_SECONDS
} from "./toastSettings";

describe("clampToastAutoDismissSeconds", () => {
  it("passes through values already within range", () => {
    expect(clampToastAutoDismissSeconds(10)).toBe(10);
  });

  it("clamps values below the minimum", () => {
    expect(clampToastAutoDismissSeconds(0)).toBe(TOAST_AUTO_DISMISS_MIN_SECONDS);
    expect(clampToastAutoDismissSeconds(-5)).toBe(TOAST_AUTO_DISMISS_MIN_SECONDS);
  });

  it("clamps values above the maximum", () => {
    expect(clampToastAutoDismissSeconds(999)).toBe(TOAST_AUTO_DISMISS_MAX_SECONDS);
  });

  it("rounds fractional values", () => {
    expect(clampToastAutoDismissSeconds(4.6)).toBe(5);
  });

  it("falls back to the minimum for NaN input", () => {
    expect(clampToastAutoDismissSeconds(Number.NaN)).toBe(TOAST_AUTO_DISMISS_MIN_SECONDS);
  });
});
