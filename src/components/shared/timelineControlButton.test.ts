import { describe, expect, it } from "vitest";
import { getTimelineControlButtonClassName } from "./timelineControlButton";

describe("getTimelineControlButtonClassName", () => {
  it("returns enabled class tokens", () => {
    const className = getTimelineControlButtonClassName(true);

    expect(className).toContain("rounded-md border border-app-border");
    expect(className).toContain("hover:border-app-accent/70");
    expect(className).toContain("hover:text-app-text");
  });

  it("returns disabled class tokens", () => {
    const className = getTimelineControlButtonClassName(false);

    expect(className).toContain("rounded-md border border-app-border");
    expect(className).toContain("cursor-not-allowed opacity-50");
  });
});
