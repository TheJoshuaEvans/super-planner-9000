import { clampSlot } from "./timeline";
import type { PlannerSegment } from "../store/plannerStore";

export type TimelineCompleteness = "empty" | "partial" | "full";

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
 * Classifies how fully a timeline is scheduled within the day's slot bounds.
 */
export function getTimelineCompleteness(
  segments: PlannerSegment[],
  totalDaySlots: number
): TimelineCompleteness {
  if (totalDaySlots <= 0 || segments.length === 0) {
    return "empty";
  }

  const normalizedRanges = segments
    .map((segment) => ({
      startSlot: clampSlot(segment.startSlot),
      endSlot: clampSlot(segment.endSlot)
    }))
    .filter((segment) => segment.endSlot > segment.startSlot)
    .sort((left, right) => left.startSlot - right.startSlot);

  if (normalizedRanges.length === 0) {
    return "empty";
  }

  let coveredSlots = 0;
  let rangeStart = normalizedRanges[0].startSlot;
  let rangeEnd = normalizedRanges[0].endSlot;

  for (let index = 1; index < normalizedRanges.length; index += 1) {
    const next = normalizedRanges[index];

    if (next.startSlot <= rangeEnd) {
      rangeEnd = Math.max(rangeEnd, next.endSlot);
      continue;
    }

    coveredSlots += rangeEnd - rangeStart;
    rangeStart = next.startSlot;
    rangeEnd = next.endSlot;
  }

  coveredSlots += rangeEnd - rangeStart;

  if (coveredSlots <= 0) {
    return "empty";
  }

  return coveredSlots >= totalDaySlots ? "full" : "partial";
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

/**
 * Merges copied segments into an existing timeline using overwrite semantics.
 * Incoming segments are normalized and recreated with fresh ids.
 */
export function pasteSegmentsWithOverwrite(
  existingSegments: PlannerSegment[],
  copiedSegments: PlannerSegment[]
): PlannerSegment[] {
  const normalizedCopied = copiedSegments
    .map((segment) => ({
      categoryId: segment.categoryId,
      startSlot: clampSlot(segment.startSlot),
      endSlot: clampSlot(segment.endSlot)
    }))
    .filter((segment) => segment.endSlot > segment.startSlot)
    .sort((left, right) => left.startSlot - right.startSlot);

  return normalizedCopied.reduce(
    (segments, segment) =>
      applySegmentOverwrite(segments, createSegment(segment.categoryId, segment.startSlot, segment.endSlot)),
    existingSegments
  );
}

/**
 * Resizes an existing segment to a new slot range, clamping to day bounds and
 * enforcing a minimum duration of one slot. Overwrites any newly overlapping segments.
 */
export function resizeSegment(
  existingSegments: PlannerSegment[],
  segmentId: string,
  nextStartSlot: number,
  nextEndSlot: number,
  totalDaySlots: number
): PlannerSegment[] {
  const MIN_SLOTS = 1;

  const original = existingSegments.find((segment) => segment.id === segmentId);

  if (!original) {
    return existingSegments;
  }

  const clampedStart = Math.max(0, Math.min(nextStartSlot, totalDaySlots - MIN_SLOTS));
  const clampedEnd = Math.max(clampedStart + MIN_SLOTS, Math.min(nextEndSlot, totalDaySlots));

  if (clampedEnd <= clampedStart) {
    return existingSegments;
  }

  const resized = cloneSegment(original, { startSlot: clampedStart, endSlot: clampedEnd });
  const remaining = existingSegments.filter((segment) => segment.id !== segmentId);
  return applySegmentOverwrite(remaining, resized);
}

/**
 * Moves an existing segment to a new start slot while preserving duration.
 */
export function moveSegment(
  existingSegments: PlannerSegment[],
  segmentId: string,
  nextStartSlot: number,
  totalDaySlots: number
): PlannerSegment[] {
  const segmentToMove = existingSegments.find((segment) => segment.id === segmentId);

  if (!segmentToMove) {
    return existingSegments;
  }

  const duration = segmentToMove.endSlot - segmentToMove.startSlot;

  if (duration <= 0) {
    return existingSegments;
  }

  const maxStart = Math.max(0, totalDaySlots - duration);
  const clampedStart = Math.min(maxStart, Math.max(0, clampSlot(nextStartSlot)));
  const movedSegment = cloneSegment(segmentToMove, {
    startSlot: clampedStart,
    endSlot: clampedStart + duration
  });

  const remainingSegments = existingSegments.filter((segment) => segment.id !== segmentId);
  return applySegmentOverwrite(remainingSegments, movedSegment);
}
