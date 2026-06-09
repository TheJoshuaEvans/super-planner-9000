import { describe, expect, it } from "vitest";
import {
  isPointerInRect,
  resolveDropPreviewSlot,
  resolveMoveStart,
  resolveResizeRange,
  type MoveInteraction,
  type ResizeInteraction
} from "./timelineTrackInteractions";

describe("timelineTrackInteractions", () => {
  it("resolves move start with clamping", () => {
    const interaction: MoveInteraction = {
      mode: "move",
      segmentId: "seg-1",
      duration: 8,
      grabOffsetSlots: 2,
      previewStartSlot: 0
    };

    expect(resolveMoveStart(50, interaction, 0, 100)).toBe(46);
    expect(resolveMoveStart(-50, interaction, 0, 100)).toBe(0);
    expect(resolveMoveStart(500, interaction, 0, 100)).toBe(88);
  });

  it("resolves left and right resize ranges", () => {
    const leftResize: ResizeInteraction = {
      mode: "resize-left",
      segmentId: "seg-1",
      fixedStartSlot: 12,
      fixedEndSlot: 20,
      previewStartSlot: 12,
      previewEndSlot: 20
    };

    const rightResize: ResizeInteraction = {
      mode: "resize-right",
      segmentId: "seg-1",
      fixedStartSlot: 12,
      fixedEndSlot: 20,
      previewStartSlot: 12,
      previewEndSlot: 20
    };

    expect(resolveResizeRange(50, leftResize, 0, 100)).toEqual({ startSlot: 19, endSlot: 20 });
    expect(resolveResizeRange(20, rightResize, 0, 100)).toEqual({ startSlot: 12, endSlot: 19 });
    expect(resolveResizeRange(0, rightResize, 0, 100)).toEqual({ startSlot: 12, endSlot: 12 + 1 });
  });

  it("resolves drop preview slot with timeline bounds", () => {
    expect(resolveDropPreviewSlot(50, 0, 100)).toBe(48);
    expect(resolveDropPreviewSlot(-20, 0, 100)).toBe(0);
    expect(resolveDropPreviewSlot(500, 0, 100)).toBe(92);
  });

  it("detects pointer inclusion in a rect", () => {
    const rect = { left: 10, right: 30, top: 40, bottom: 80 };

    expect(isPointerInRect(20, 60, rect)).toBe(true);
    expect(isPointerInRect(5, 60, rect)).toBe(false);
    expect(isPointerInRect(20, 100, rect)).toBe(false);
  });
});
