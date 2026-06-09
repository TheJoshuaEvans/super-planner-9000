import { describe, expect, it } from "vitest";
import { applySegmentOverwrite, createSegment } from "./plannerSegments";

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
});
