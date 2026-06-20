import type {
  PlannerDateKey,
  PlannerPersistedData,
  PlannerSegment,
  PlannerState
} from "./plannerStore.types";

/**
 * Produces a deep isolated copy of a PlannerPersistedData value.
 *
 * @param data - Persisted planner data to clone.
 * @returns Independent data copy with cloned categories and segments.
 */
export function clonePersistedData(data: PlannerPersistedData): PlannerPersistedData {
  return {
    categories: data.categories.map((category) => ({ ...category })),
    segmentsByDate: Object.fromEntries(
      Object.entries(data.segmentsByDate).map(([dateKey, segments]) => [
        dateKey,
        segments.map((segment) => ({
          ...segment,
          ...(segment.assignedMealIds ? { assignedMealIds: [...segment.assignedMealIds] } : {})
        }))
      ])
    )
  };
}

/**
 * Returns true when two optional meal id lists contain the same ids in the same order.
 *
 * @param left - First meal id list, if any.
 * @param right - Second meal id list, if any.
 * @returns Whether the lists are equivalent (treating missing and empty lists as equal).
 */
function areAssignedMealIdsEqual(left: string[] | undefined, right: string[] | undefined): boolean {
  const leftIds = left ?? [];
  const rightIds = right ?? [];

  if (leftIds.length !== rightIds.length) {
    return false;
  }

  return leftIds.every((id, index) => id === rightIds[index]);
}

/**
 * Extracts only persisted fields from full store state.
 *
 * @param state - Full planner state.
 * @returns Persisted planner data snapshot.
 */
export function toPersistedData(state: PlannerState): PlannerPersistedData {
  return {
    categories: state.categories,
    segmentsByDate: state.segmentsByDate
  };
}

/**
 * Returns true when two persisted planner data values are deeply equivalent.
 *
 * @param left - First persisted value.
 * @param right - Second persisted value.
 * @returns Whether all categories and segments match by value.
 */
export function arePersistedDataEqual(left: PlannerPersistedData, right: PlannerPersistedData): boolean {
  if (left.categories.length !== right.categories.length) {
    return false;
  }

  for (let index = 0; index < left.categories.length; index += 1) {
    const leftCategory = left.categories[index];
    const rightCategory = right.categories[index];

    if (
      leftCategory.id !== rightCategory.id ||
      leftCategory.label !== rightCategory.label ||
      leftCategory.color !== rightCategory.color
    ) {
      return false;
    }
  }

  const leftDateKeys = Object.keys(left.segmentsByDate).sort();
  const rightDateKeys = Object.keys(right.segmentsByDate).sort();

  if (leftDateKeys.length !== rightDateKeys.length) {
    return false;
  }

  for (let index = 0; index < leftDateKeys.length; index += 1) {
    if (leftDateKeys[index] !== rightDateKeys[index]) {
      return false;
    }

    const dateKey = leftDateKeys[index];
    const leftSegments = left.segmentsByDate[dateKey] ?? [];
    const rightSegments = right.segmentsByDate[dateKey] ?? [];

    if (leftSegments.length !== rightSegments.length) {
      return false;
    }

    for (let segmentIndex = 0; segmentIndex < leftSegments.length; segmentIndex += 1) {
      const leftSegment = leftSegments[segmentIndex];
      const rightSegment = rightSegments[segmentIndex];

      if (
        leftSegment.id !== rightSegment.id ||
        leftSegment.categoryId !== rightSegment.categoryId ||
        leftSegment.startSlot !== rightSegment.startSlot ||
        leftSegment.endSlot !== rightSegment.endSlot ||
        !areAssignedMealIdsEqual(leftSegment.assignedMealIds, rightSegment.assignedMealIds) ||
        (leftSegment.description ?? "") !== (rightSegment.description ?? "")
      ) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Returns segments for a date key or an empty array.
 *
 * @param state - Planner state containing segments by date.
 * @param dateKey - Date key to resolve.
 * @returns Existing segment array or empty array when missing.
 */
export function segmentsForDate(state: PlannerState, dateKey: PlannerDateKey): PlannerSegment[] {
  return state.segmentsByDate[dateKey] ?? [];
}
