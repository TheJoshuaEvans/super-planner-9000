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

/** Segment fields that describe placement on the timeline rather than the block's "type". */
const SEGMENT_PLACEMENT_KEYS = new Set<keyof PlannerSegment>(["id", "startSlot", "endSlot"]);

/**
 * Builds a stable signature of everything that makes a segment a particular "kind" of
 * block — its category plus any additional metadata (e.g. assigned meals) — ignoring
 * placement fields (id/startSlot/endSlot) and treating absent/empty optional fields as
 * equivalent. Arrays are order-normalized. Two segments with the same signature represent
 * the same kind of block and are candidates for merging when adjacent.
 *
 * Generalized so that future per-segment metadata fields are included automatically.
 */
export function getSegmentMetadataSignature(segment: PlannerSegment): string {
  const entries = Object.entries(segment).filter(([key, value]) => {
    if (SEGMENT_PLACEMENT_KEYS.has(key as keyof PlannerSegment)) {
      return false;
    }

    if (value === undefined || value === null) {
      return false;
    }

    return !(Array.isArray(value) && value.length === 0);
  });

  const normalized = entries
    .map(([key, value]) => [key, Array.isArray(value) ? [...value].sort() : value] as const)
    .sort(([left], [right]) => left.localeCompare(right));

  return JSON.stringify(normalized);
}

/**
 * Merges segments that sit directly adjacent to one another (one's end slot equals the
 * next's start slot) and share an identical metadata signature into a single combined
 * segment, e.g. two touching "Eat" blocks with the same assigned meals become one block.
 * The earlier segment's id is kept. Input does not need to be pre-sorted.
 */
export function mergeAdjacentSegments(segments: PlannerSegment[]): PlannerSegment[] {
  const sorted = [...segments].sort((left, right) => left.startSlot - right.startSlot);
  const merged: PlannerSegment[] = [];

  for (const segment of sorted) {
    const previous = merged[merged.length - 1];

    if (
      previous &&
      previous.endSlot === segment.startSlot &&
      getSegmentMetadataSignature(previous) === getSegmentMetadataSignature(segment)
    ) {
      merged[merged.length - 1] = cloneSegment(previous, { endSlot: segment.endSlot });
      continue;
    }

    merged.push(segment);
  }

  return merged;
}

/**
 * Inserts a segment into the timeline by trimming or splitting any overlapping segments,
 * then merges the result with any now-adjacent segments of the same kind (see
 * `mergeAdjacentSegments`).
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

  return mergeAdjacentSegments(
    [...normalizedSegments, nextSegment].filter((segment) => segment.endSlot > segment.startSlot)
  );
}

/**
 * Creates a new planner segment for the provided category and slot range.
 * Preserves assigned meal ids when provided, e.g. when pasting a copied segment.
 */
export function createSegment(
  categoryId: string,
  startSlot: number,
  endSlot: number,
  assignedMealIds?: string[]
): PlannerSegment {
  return {
    id: createSegmentId(),
    categoryId,
    startSlot,
    endSlot,
    ...(assignedMealIds && assignedMealIds.length > 0 ? { assignedMealIds: [...assignedMealIds] } : {})
  };
}

/**
 * Merges copied segments into an existing timeline using overwrite semantics.
 * Incoming segments are normalized and recreated with fresh ids, preserving any assigned meals.
 */
export function pasteSegmentsWithOverwrite(
  existingSegments: PlannerSegment[],
  copiedSegments: PlannerSegment[]
): PlannerSegment[] {
  const normalizedCopied = copiedSegments
    .map((segment) => ({
      categoryId: segment.categoryId,
      startSlot: clampSlot(segment.startSlot),
      endSlot: clampSlot(segment.endSlot),
      assignedMealIds: segment.assignedMealIds
    }))
    .filter((segment) => segment.endSlot > segment.startSlot)
    .sort((left, right) => left.startSlot - right.startSlot);

  return normalizedCopied.reduce(
    (segments, segment) =>
      applySegmentOverwrite(
        segments,
        createSegment(segment.categoryId, segment.startSlot, segment.endSlot, segment.assignedMealIds)
      ),
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

/**
 * Moves a segment from one date's segment list to another, preserving its
 * duration and any additional data (e.g. assigned meals).
 */
export function moveSegmentAcrossLists(
  sourceSegments: PlannerSegment[],
  targetSegments: PlannerSegment[],
  segmentId: string,
  nextStartSlot: number,
  totalDaySlots: number
): { sourceSegments: PlannerSegment[]; targetSegments: PlannerSegment[] } {
  const segmentToMove = sourceSegments.find((segment) => segment.id === segmentId);

  if (!segmentToMove) {
    return { sourceSegments, targetSegments };
  }

  const duration = segmentToMove.endSlot - segmentToMove.startSlot;

  if (duration <= 0) {
    return { sourceSegments, targetSegments };
  }

  const maxStart = Math.max(0, totalDaySlots - duration);
  const clampedStart = Math.min(maxStart, Math.max(0, clampSlot(nextStartSlot)));
  const movedSegment = cloneSegment(segmentToMove, {
    startSlot: clampedStart,
    endSlot: clampedStart + duration
  });

  const remainingSource = sourceSegments.filter((segment) => segment.id !== segmentId);
  const nextTargetSegments = applySegmentOverwrite(targetSegments, movedSegment);

  return { sourceSegments: remainingSource, targetSegments: nextTargetSegments };
}
