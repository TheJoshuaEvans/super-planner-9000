import { TOTAL_DAY_SLOTS } from "./timeline";
import type { PlannerCategory, PlannerPersistedData, PlannerSegment, PlannerSegmentsByDate } from "../store/plannerStore";

export const PLANNER_DATA_EXPORT_APP = "super-planner-9000" as const;
export const PLANNER_DATA_EXPORT_VERSION = 1 as const;

export type PlannerDataExportEnvelope = {
  app: typeof PLANNER_DATA_EXPORT_APP;
  version: typeof PLANNER_DATA_EXPORT_VERSION;
  exportedAt: string;
  data: PlannerPersistedData;
};

export type PlannerDataImportResult =
  | { ok: true; data: PlannerPersistedData }
  | { ok: false; error: string };

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isPlannerCategory(value: unknown): value is PlannerCategory {
  return (
    isPlainObject(value) &&
    isString(value.id) &&
    isString(value.label) &&
    isString(value.color)
  );
}

function isPlannerSegment(value: unknown): value is PlannerSegment {
  return (
    isPlainObject(value) &&
    isString(value.id) &&
    isString(value.categoryId) &&
    isNumber(value.startSlot) &&
    isNumber(value.endSlot) &&
    value.startSlot >= 0 &&
    value.endSlot <= TOTAL_DAY_SLOTS &&
    value.startSlot < value.endSlot
  );
}

function isPlannerSegmentsByDate(value: unknown): value is PlannerSegmentsByDate {
  if (!isPlainObject(value)) {
    return false;
  }

  return Object.entries(value).every(([dateKey, segments]) => {
    return DATE_KEY_PATTERN.test(dateKey) && Array.isArray(segments) && segments.every((segment) => isPlannerSegment(segment));
  });
}

function isPlannerPersistedData(value: unknown): value is PlannerPersistedData {
  return (
    isPlainObject(value) &&
    Array.isArray(value.categories) &&
    value.categories.every((category) => isPlannerCategory(category)) &&
    isPlannerSegmentsByDate(value.segmentsByDate)
  );
}

/**
 * Creates a versioned export envelope for the current planner data.
 */
export function createPlannerDataExportEnvelope(
  data: PlannerPersistedData,
  exportedAt: Date = new Date()
): PlannerDataExportEnvelope {
  return {
    app: PLANNER_DATA_EXPORT_APP,
    version: PLANNER_DATA_EXPORT_VERSION,
    exportedAt: exportedAt.toISOString(),
    data
  };
}

/**
 * Serializes planner data into a formatted JSON export string.
 */
export function serializePlannerDataExport(
  data: PlannerPersistedData,
  exportedAt: Date = new Date()
): string {
  return JSON.stringify(createPlannerDataExportEnvelope(data, exportedAt), null, 2);
}

/**
 * Builds a predictable JSON filename for planner exports.
 */
export function buildPlannerExportFilename(exportedAt: Date = new Date()): string {
  const timestamp = exportedAt.toISOString().replace(/[:.]/g, "-");
  return `super-planner-9000-export-${timestamp}.json`;
}

/**
 * Parses and validates a planner export file, rejecting unsupported versions before deeper validation.
 */
export function parsePlannerDataImport(text: string): PlannerDataImportResult {
  let parsed: unknown;

  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, error: "Import file is not valid JSON." };
  }

  if (!isPlainObject(parsed)) {
    return { ok: false, error: "Import file must be a JSON object." };
  }

  if (parsed.app !== PLANNER_DATA_EXPORT_APP) {
    return { ok: false, error: "Import file was not created by this app." };
  }

  if (parsed.version !== PLANNER_DATA_EXPORT_VERSION) {
    return { ok: false, error: `Unsupported import version: ${String(parsed.version)}.` };
  }

  if (!isString(parsed.exportedAt)) {
    return { ok: false, error: "Import file is missing export metadata." };
  }

  if (!isPlannerPersistedData(parsed.data)) {
    return { ok: false, error: "Import file does not contain valid planner data." };
  }

  return { ok: true, data: parsed.data };
}
