import type { PlannerSegment } from "../store/plannerStore";

/**
 * Creates a lightweight unique identifier for planner segments.
 */
function createSegmentId(): string {
  return `segment-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Returns a cloned segment with the provided field overrides applied.
 */
function cloneSegment(segment: PlannerSegment, overrides: Partial<PlannerSegment>): PlannerSegment {
  return {
    ...segment,
    ...overrides
  };
}

/**
 * Inserts a segment into the timeline by trimming or splitting any overlapping segments.
 */
export function applySegmentOverwrite(
  existingSegments: PlannerSegment[],
  nextSegment: PlannerSegment
): PlannerSegment[] {
  const normalizedSegments = existingSegments.flatMap((segment) => {
    const hasNoOverlap = segment.endSlot <= nextSegment.startSlot || segment.startSlot >= nextSegment.endSlot;

    if (hasNoOverlap) {
      return [segment];
    }

    const trimmedSegments: PlannerSegment[] = [];

    if (segment.startSlot < nextSegment.startSlot) {
      trimmedSegments.push(cloneSegment(segment, { endSlot: nextSegment.startSlot }));
    }

    if (segment.endSlot > nextSegment.endSlot) {
      trimmedSegments.push(
        cloneSegment(segment, {
          id: createSegmentId(),
          startSlot: nextSegment.endSlot
        })
      );
    }

    return trimmedSegments;
  });

  return [...normalizedSegments, nextSegment]
    .filter((segment) => segment.endSlot > segment.startSlot)
    .sort((left, right) => left.startSlot - right.startSlot);
}

/**
 * Creates a new planner segment for the provided category and slot range.
 */
export function createSegment(categoryId: string, startSlot: number, endSlot: number): PlannerSegment {
  return {
    id: createSegmentId(),
    categoryId,
    startSlot,
    endSlot
  };
}