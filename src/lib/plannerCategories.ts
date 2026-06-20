import { COLORBLIND_SAFE_PALETTE } from "./colorPalette";
import type { PlannerCategory, PlannerSegmentsByDate } from "../store/plannerStore";

/**
 * Category ids that can never be removed via the Settings UI, e.g. "eat" backs the meal
 * assignment feature. Renaming and recoloring these categories is still allowed.
 */
export const PROTECTED_CATEGORY_IDS: readonly string[] = ["eat"];

/**
 * A small colorblind-safe (Okabe-Ito derived) palette suggested for newly created categories.
 */
export const DEFAULT_CATEGORY_COLOR_PALETTE: readonly string[] = COLORBLIND_SAFE_PALETTE;

/**
 * Returns true if a category id cannot be removed via Settings.
 *
 * @param categoryId - Category id to check.
 * @returns Whether the category is protected from removal.
 */
export function isProtectedCategory(categoryId: string): boolean {
  return PROTECTED_CATEGORY_IDS.includes(categoryId);
}

/**
 * Creates a lightweight unique identifier for newly added planner categories.
 *
 * @returns A new category id.
 */
export function createCategoryId(): string {
  return `category-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Picks the first palette color not already used by an existing category, cycling back to the
 * start of the palette if every color is in use.
 *
 * @param categories - Current categories.
 * @returns A suggested hex color for a new category.
 */
export function pickNextCategoryColor(categories: PlannerCategory[]): string {
  const usedColors = new Set(categories.map((category) => category.color));
  const unused = DEFAULT_CATEGORY_COLOR_PALETTE.find((color) => !usedColors.has(color));

  return unused ?? DEFAULT_CATEGORY_COLOR_PALETTE[0];
}

/**
 * Checks whether a category label is already used by another category (case-insensitive).
 *
 * @param categories - Current categories.
 * @param label - Candidate label to check.
 * @param excludeId - Category id to exclude from the check (e.g. the one being edited).
 * @returns Whether the trimmed label is already taken.
 */
export function isCategoryLabelTaken(categories: PlannerCategory[], label: string, excludeId?: string): boolean {
  const normalized = label.trim().toLowerCase();

  return categories.some((category) => category.id !== excludeId && category.label.toLowerCase() === normalized);
}

/**
 * Counts how many segments across all dates use the given category.
 *
 * @param segmentsByDate - Per-date segment map.
 * @param categoryId - Category id to count.
 * @returns Total number of matching segments.
 */
export function countSegmentsUsingCategory(segmentsByDate: PlannerSegmentsByDate, categoryId: string): number {
  return Object.values(segmentsByDate).reduce(
    (total, segments) => total + segments.filter((segment) => segment.categoryId === categoryId).length,
    0
  );
}

/**
 * Removes every segment using the given category from every date.
 *
 * @param segmentsByDate - Per-date segment map.
 * @param categoryId - Category id whose segments should be removed.
 * @returns A new per-date segment map with that category's segments filtered out.
 */
export function removeSegmentsForCategory(segmentsByDate: PlannerSegmentsByDate, categoryId: string): PlannerSegmentsByDate {
  return Object.fromEntries(
    Object.entries(segmentsByDate).map(([dateKey, segments]) => [
      dateKey,
      segments.filter((segment) => segment.categoryId !== categoryId)
    ])
  );
}
