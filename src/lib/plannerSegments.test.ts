import { describe, expect, it } from "vitest";
import {
  applySegmentOverwrite,
  createSegment,
  getTimelineCompleteness,
  moveSegment,
  pasteSegmentsWithOverwrite,
  resizeSegment
} from "./plannerSegments";

describe("plannerSegments", () => {
  it("creates a segment with expected fields", () => {
    const segment = createSegment("work", 4, 8);

    expect(segment.categoryId).toBe("work");
    expect(segment.startSlot).toBe(4);
    expect(segment.endSlot).toBe(8);
    expect(segment.id.startsWith("segment-")).toBe(true);
  });

  it("inserts non-overlapping segment and sorts by start slot", () => {
    const updated = applySegmentOverwrite(
      [
        { id: "a", categoryId: "sleep", startSlot: 8, endSlot: 12 },
        { id: "b", categoryId: "eat", startSlot: 0, endSlot: 4 }
      ],
      { id: "c", categoryId: "work", startSlot: 4, endSlot: 8 }
    );

    expect(updated.map((segment) => segment.id)).toEqual(["b", "c", "a"]);
  });

  it("splits an overlapping segment into left and right pieces", () => {
    const updated = applySegmentOverwrite(
      [{ id: "a", categoryId: "sleep", startSlot: 0, endSlot: 12 }],
      { id: "c", categoryId: "work", startSlot: 4, endSlot: 8 }
    );

    expect(updated).toHaveLength(3);
    expect(updated[0]).toMatchObject({ id: "a", startSlot: 0, endSlot: 4 });
    expect(updated[1]).toMatchObject({ id: "c", startSlot: 4, endSlot: 8 });
    expect(updated[2]).toMatchObject({ startSlot: 8, endSlot: 12, categoryId: "sleep" });
    expect(updated[2].id).not.toBe("a");
  });

  it("moves a segment to a new slot while preserving duration", () => {
    const updated = moveSegment(
      [{ id: "a", categoryId: "work", startSlot: 4, endSlot: 8 }],
      "a",
      20,
      96
    );

    expect(updated).toHaveLength(1);
    expect(updated[0]).toMatchObject({ id: "a", startSlot: 20, endSlot: 24, categoryId: "work" });
  });

  it("moves a segment and overwrites overlapping ranges", () => {
    const updated = moveSegment(
      [
        { id: "a", categoryId: "work", startSlot: 4, endSlot: 8 },
        { id: "b", categoryId: "sleep", startSlot: 10, endSlot: 16 }
      ],
      "a",
      12,
      96
    );

    expect(updated).toHaveLength(2);
    expect(updated[0]).toMatchObject({ id: "b", startSlot: 10, endSlot: 12 });
    expect(updated[1]).toMatchObject({ id: "a", startSlot: 12, endSlot: 16 });
  });

  it("resizes the right edge of a segment", () => {
    const updated = resizeSegment(
      [{ id: "a", categoryId: "work", startSlot: 4, endSlot: 8 }],
      "a", 4, 12, 96
    );

    expect(updated).toHaveLength(1);
    expect(updated[0]).toMatchObject({ id: "a", startSlot: 4, endSlot: 12 });
  });

  it("resizes the left edge of a segment", () => {
    const updated = resizeSegment(
      [{ id: "a", categoryId: "work", startSlot: 8, endSlot: 16 }],
      "a", 4, 16, 96
    );

    expect(updated).toHaveLength(1);
    expect(updated[0]).toMatchObject({ id: "a", startSlot: 4, endSlot: 16 });
  });

  it("enforces minimum size of one slot when resizing", () => {
    const updated = resizeSegment(
      [{ id: "a", categoryId: "work", startSlot: 4, endSlot: 8 }],
      "a", 4, 4, 96
    );

    expect(updated[0]).toMatchObject({ startSlot: 4, endSlot: 5 });
  });

  it("resize overwrites an adjacent segment that is now overlapped", () => {
    const updated = resizeSegment(
      [
        { id: "a", categoryId: "work", startSlot: 4, endSlot: 8 },
        { id: "b", categoryId: "sleep", startSlot: 8, endSlot: 12 }
      ],
      "a", 4, 10, 96
    );

    expect(updated).toHaveLength(2);
    expect(updated[0]).toMatchObject({ id: "a", startSlot: 4, endSlot: 10 });
    expect(updated[1]).toMatchObject({ categoryId: "sleep", startSlot: 10, endSlot: 12 });
  });

  it("pastes copied segments into a timeline using overwrite semantics", () => {
    const updated = pasteSegmentsWithOverwrite(
      [
        { id: "a", categoryId: "sleep", startSlot: 0, endSlot: 8 },
        { id: "b", categoryId: "eat", startSlot: 16, endSlot: 20 }
      ],
      [
        { id: "copy-1", categoryId: "work", startSlot: 4, endSlot: 12 },
        { id: "copy-2", categoryId: "travel", startSlot: 12, endSlot: 18 }
      ]
    );

    expect(updated).toHaveLength(4);
    expect(updated[0]).toMatchObject({ categoryId: "sleep", startSlot: 0, endSlot: 4 });
    expect(updated[1]).toMatchObject({ categoryId: "work", startSlot: 4, endSlot: 12 });
    expect(updated[2]).toMatchObject({ categoryId: "travel", startSlot: 12, endSlot: 18 });
    expect(updated[3]).toMatchObject({ categoryId: "eat", startSlot: 18, endSlot: 20 });
  });

  it("creates fresh ids for pasted segments", () => {
    const copied = [
      { id: "copy-1", categoryId: "work", startSlot: 4, endSlot: 8 }
    ];

    const updated = pasteSegmentsWithOverwrite([], copied);

    expect(updated).toHaveLength(1);
    expect(updated[0].id).not.toBe("copy-1");
    expect(updated[0].id.startsWith("segment-")).toBe(true);
  });

  it("classifies an empty timeline as empty", () => {
    expect(getTimelineCompleteness([], 96)).toBe("empty");
  });

  it("classifies a partially scheduled timeline as partial", () => {
    expect(
      getTimelineCompleteness([
        { id: "a", categoryId: "work", startSlot: 8, endSlot: 24 }
      ], 96)
    ).toBe("partial");
  });

  it("classifies a fully covered timeline as full", () => {
    expect(
      getTimelineCompleteness([
        { id: "a", categoryId: "sleep", startSlot: 0, endSlot: 40 },
        { id: "b", categoryId: "work", startSlot: 40, endSlot: 96 }
      ], 96)
    ).toBe("full");
  });

  it("merges overlaps when determining completeness", () => {
    expect(
      getTimelineCompleteness([
        { id: "a", categoryId: "work", startSlot: 0, endSlot: 70 },
        { id: "b", categoryId: "play", startSlot: 50, endSlot: 96 }
      ], 96)
    ).toBe("full");
  });
});
