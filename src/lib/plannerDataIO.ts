import { migratePlannerDataExport } from "./plannerDataMigrations";
import { TOTAL_DAY_SLOTS } from "./timeline";
import type { PlannerCategory, PlannerPersistedData, PlannerSegment, PlannerSegmentsByDate } from "../store/plannerStore";
import type { Meal, MealComponent, MealIngredient, MealPersistedData } from "../store/mealStore.types";
import type {
  UserContactInfo,
  WorkClient,
  WorkEntriesByDate,
  WorkEntry,
  WorkProject,
  WorkTrackerPersistedData
} from "../store/workTrackerStore.types";

export const PLANNER_DATA_EXPORT_APP = "super-planner-9000" as const;
export const PLANNER_DATA_EXPORT_VERSION = 7 as const;

export type PlannerDataExportEnvelope = {
  app: typeof PLANNER_DATA_EXPORT_APP;
  version: typeof PLANNER_DATA_EXPORT_VERSION;
  exportedAt: string;
  data: PlannerPersistedData;
  meals: MealPersistedData;
  workTracker: WorkTrackerPersistedData;
};

export type PlannerDataImportResult =
  | { ok: true; data: PlannerPersistedData; meals: MealPersistedData; workTracker: WorkTrackerPersistedData }
  | { ok: false; error: string };

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Returns true for plain JSON-like objects (not arrays or null).
 *
 * @param value - Unknown value to inspect.
 * @returns Whether the value is a plain object.
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Type guard for string values.
 *
 * @param value - Unknown value to inspect.
 * @returns Whether the value is a string.
 */
function isString(value: unknown): value is string {
  return typeof value === "string";
}

/**
 * Type guard for finite numeric values.
 *
 * @param value - Unknown value to inspect.
 * @returns Whether the value is a finite number.
 */
function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

/**
 * Validates planner category shape for import payloads.
 *
 * @param value - Unknown candidate category.
 * @returns Whether the value matches PlannerCategory fields.
 */
function isPlannerCategory(value: unknown): value is PlannerCategory {
  return (
    isPlainObject(value) &&
    isString(value.id) &&
    isString(value.label) &&
    isString(value.color)
  );
}

/**
 * Validates planner segment shape and slot bounds.
 *
 * @param value - Unknown candidate segment.
 * @returns Whether the value matches PlannerSegment constraints.
 */
function isPlannerSegment(value: unknown): value is PlannerSegment {
  return (
    isPlainObject(value) &&
    isString(value.id) &&
    isString(value.categoryId) &&
    isNumber(value.startSlot) &&
    isNumber(value.endSlot) &&
    value.startSlot >= 0 &&
    value.endSlot <= TOTAL_DAY_SLOTS &&
    value.startSlot < value.endSlot &&
    (value.assignedMealIds === undefined ||
      (Array.isArray(value.assignedMealIds) && value.assignedMealIds.every((id) => isString(id)))) &&
    (value.description === undefined || isString(value.description))
  );
}

/**
 * Validates per-date segment map shape for import payloads.
 *
 * @param value - Unknown candidate date map.
 * @returns Whether each key is a date and each value is a valid segment array.
 */
function isPlannerSegmentsByDate(value: unknown): value is PlannerSegmentsByDate {
  if (!isPlainObject(value)) {
    return false;
  }

  return Object.entries(value).every(([dateKey, segments]) => {
    return DATE_KEY_PATTERN.test(dateKey) && Array.isArray(segments) && segments.every((segment) => isPlannerSegment(segment));
  });
}

/**
 * Validates top-level persisted planner payload shape.
 *
 * @param value - Unknown candidate persisted payload.
 * @returns Whether categories and per-date segments are valid.
 */
function isPlannerPersistedData(value: unknown): value is PlannerPersistedData {
  return (
    isPlainObject(value) &&
    Array.isArray(value.categories) &&
    value.categories.every((category) => isPlannerCategory(category)) &&
    isPlannerSegmentsByDate(value.segmentsByDate)
  );
}

/**
 * Validates a single meal component shape.
 *
 * @param value - Unknown candidate component.
 * @returns Whether the value matches MealComponent fields.
 */
function isMealComponent(value: unknown): value is MealComponent {
  return isPlainObject(value) && isString(value.id) && isString(value.name);
}

/**
 * Validates a single meal ingredient shape.
 *
 * @param value - Unknown candidate ingredient.
 * @returns Whether the value matches MealIngredient fields.
 */
function isMealIngredient(value: unknown): value is MealIngredient {
  return (
    isPlainObject(value) &&
    isString(value.componentId) &&
    isNumber(value.quantity) &&
    isString(value.unit)
  );
}

/**
 * Validates a single meal shape.
 *
 * @param value - Unknown candidate meal.
 * @returns Whether the value matches Meal fields.
 */
function isMeal(value: unknown): value is Meal {
  return (
    isPlainObject(value) &&
    isString(value.id) &&
    isString(value.name) &&
    isString(value.description) &&
    Array.isArray(value.ingredients) &&
    value.ingredients.every((ingredient) => isMealIngredient(ingredient))
  );
}

/**
 * Validates the persisted meal store payload shape.
 *
 * @param value - Unknown candidate meal store data.
 * @returns Whether components and meals arrays are valid.
 */
function isMealPersistedData(value: unknown): value is MealPersistedData {
  return (
    isPlainObject(value) &&
    Array.isArray(value.components) &&
    value.components.every((component) => isMealComponent(component)) &&
    Array.isArray(value.meals) &&
    value.meals.every((meal) => isMeal(meal))
  );
}

/**
 * Validates a single work client shape, including its required contact name/email fields and
 * optional company name.
 *
 * @param value - Unknown candidate client.
 * @returns Whether the value matches WorkClient fields.
 */
function isWorkClient(value: unknown): value is WorkClient {
  return (
    isPlainObject(value) &&
    isString(value.id) &&
    isString(value.name) &&
    isString(value.contactName) &&
    isString(value.contactEmail) &&
    (value.company === undefined || isString(value.company))
  );
}

/**
 * Validates a single work project shape, including its required client reference and hourly rate.
 *
 * @param value - Unknown candidate project.
 * @returns Whether the value matches WorkProject fields.
 */
function isWorkProject(value: unknown): value is WorkProject {
  return (
    isPlainObject(value) &&
    isString(value.id) &&
    isString(value.name) &&
    isString(value.color) &&
    isString(value.clientId) &&
    isNumber(value.hourlyRate) &&
    value.hourlyRate >= 0
  );
}

/**
 * Validates a single work entry shape.
 *
 * @param value - Unknown candidate entry.
 * @returns Whether the value matches WorkEntry fields.
 */
function isWorkEntry(value: unknown): value is WorkEntry {
  return (
    isPlainObject(value) &&
    isString(value.id) &&
    isString(value.projectId) &&
    isNumber(value.hours) &&
    value.hours >= 0
  );
}

/**
 * Validates per-date work entry map shape for import payloads.
 *
 * @param value - Unknown candidate date map.
 * @returns Whether each key is a date and each value is a valid entry array.
 */
function isWorkEntriesByDate(value: unknown): value is WorkEntriesByDate {
  if (!isPlainObject(value)) {
    return false;
  }

  return Object.entries(value).every(([dateKey, entries]) => {
    return DATE_KEY_PATTERN.test(dateKey) && Array.isArray(entries) && entries.every((entry) => isWorkEntry(entry));
  });
}

/**
 * Validates the user's own contact info shape. Fields are always present strings but may be blank.
 *
 * @param value - Unknown candidate contact info.
 * @returns Whether the value matches UserContactInfo fields.
 */
function isUserContactInfo(value: unknown): value is UserContactInfo {
  return (
    isPlainObject(value) &&
    isString(value.name) &&
    isString(value.email) &&
    isString(value.phone) &&
    isString(value.addressLine1) &&
    isString(value.addressLine2) &&
    isString(value.city) &&
    isString(value.state) &&
    isString(value.postalCode) &&
    isString(value.country)
  );
}

/**
 * Validates the persisted work tracker payload shape. Does not check that a project's clientId
 * or an entry's projectId resolves to an existing record, matching the same referential leniency
 * already used for segment categoryId and meal ingredient componentId references.
 *
 * @param value - Unknown candidate persisted payload.
 * @returns Whether clients, projects, per-date entries, and the user's contact info are valid.
 */
function isWorkTrackerPersistedData(value: unknown): value is WorkTrackerPersistedData {
  return (
    isPlainObject(value) &&
    Array.isArray(value.clients) &&
    value.clients.every((client) => isWorkClient(client)) &&
    Array.isArray(value.projects) &&
    value.projects.every((project) => isWorkProject(project)) &&
    isWorkEntriesByDate(value.entriesByDate) &&
    isUserContactInfo(value.userContactInfo)
  );
}

/**
 * Produces a deep-cloned, JSON-safe persisted planner payload.
 *
 * @param data - Persisted planner data to normalize.
 * @returns Cloned payload suitable for export.
 */
function normalizePlannerPersistedData(data: PlannerPersistedData): PlannerPersistedData {
  return {
    categories: data.categories.map((category) => ({
      id: category.id,
      label: category.label,
      color: category.color
    })),
    segmentsByDate: Object.fromEntries(
      Object.entries(data.segmentsByDate).map(([dateKey, segments]) => [
        dateKey,
        segments.map((segment) => ({
          id: segment.id,
          categoryId: segment.categoryId,
          startSlot: segment.startSlot,
          endSlot: segment.endSlot,
          ...(segment.assignedMealIds && segment.assignedMealIds.length > 0
            ? { assignedMealIds: [...segment.assignedMealIds] }
            : {}),
          ...(segment.description ? { description: segment.description } : {})
        }))
      ])
    )
  };
}

/**
 * Produces a deep-cloned, JSON-safe persisted meal payload.
 *
 * @param meals - Persisted meal data to normalize.
 * @returns Cloned payload suitable for export.
 */
function normalizeMealPersistedData(meals: MealPersistedData): MealPersistedData {
  return {
    components: meals.components.map((component) => ({
      id: component.id,
      name: component.name
    })),
    meals: meals.meals.map((meal) => ({
      id: meal.id,
      name: meal.name,
      description: meal.description,
      ingredients: meal.ingredients.map((ingredient) => ({
        componentId: ingredient.componentId,
        quantity: ingredient.quantity,
        unit: ingredient.unit
      }))
    }))
  };
}

/**
 * Produces a deep-cloned, JSON-safe persisted work tracker payload.
 *
 * @param workTracker - Persisted work tracker data to normalize.
 * @returns Cloned payload suitable for export.
 */
function normalizeWorkTrackerPersistedData(workTracker: WorkTrackerPersistedData): WorkTrackerPersistedData {
  return {
    clients: workTracker.clients.map((client) => ({
      id: client.id,
      name: client.name,
      contactName: client.contactName,
      contactEmail: client.contactEmail,
      ...(client.company ? { company: client.company } : {})
    })),
    projects: workTracker.projects.map((project) => ({
      id: project.id,
      name: project.name,
      color: project.color,
      clientId: project.clientId,
      hourlyRate: project.hourlyRate ?? 0
    })),
    entriesByDate: Object.fromEntries(
      Object.entries(workTracker.entriesByDate).map(([dateKey, entries]) => [
        dateKey,
        entries.map((entry) => ({ id: entry.id, projectId: entry.projectId, hours: entry.hours }))
      ])
    ),
    userContactInfo: {
      name: workTracker.userContactInfo.name,
      email: workTracker.userContactInfo.email,
      phone: workTracker.userContactInfo.phone,
      addressLine1: workTracker.userContactInfo.addressLine1,
      addressLine2: workTracker.userContactInfo.addressLine2,
      city: workTracker.userContactInfo.city,
      state: workTracker.userContactInfo.state,
      postalCode: workTracker.userContactInfo.postalCode,
      country: workTracker.userContactInfo.country
    }
  };
}

/**
 * Creates a versioned export envelope for the current planner, meal, and work tracker data.
 */
export function createPlannerDataExportEnvelope(
  plannerData: PlannerPersistedData,
  mealData: MealPersistedData,
  workTrackerData: WorkTrackerPersistedData,
  exportedAt: Date = new Date()
): PlannerDataExportEnvelope {
  return {
    app: PLANNER_DATA_EXPORT_APP,
    version: PLANNER_DATA_EXPORT_VERSION,
    exportedAt: exportedAt.toISOString(),
    data: normalizePlannerPersistedData(plannerData),
    meals: normalizeMealPersistedData(mealData),
    workTracker: normalizeWorkTrackerPersistedData(workTrackerData)
  };
}

/**
 * Serializes planner, meal, and work tracker data into a formatted JSON export string.
 */
export function serializePlannerDataExport(
  plannerData: PlannerPersistedData,
  mealData: MealPersistedData,
  workTrackerData: WorkTrackerPersistedData,
  exportedAt: Date = new Date()
): string {
  return JSON.stringify(createPlannerDataExportEnvelope(plannerData, mealData, workTrackerData, exportedAt), null, 2);
}

/**
 * Builds a predictable JSON filename for planner exports.
 */
export function buildPlannerExportFilename(exportedAt: Date = new Date()): string {
  const timestamp = exportedAt.toISOString().replace(/[:.]/g, "-");
  return `super-planner-9000-export-${timestamp}.json`;
}

/**
 * Parses and validates a planner export file. Older but migratable versions are upgraded to the
 * current shape first (see plannerDataMigrations.ts); versions with no migration path are
 * rejected as unsupported, before deeper validation.
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

  const migrated = migratePlannerDataExport(parsed, PLANNER_DATA_EXPORT_VERSION);

  if (migrated.version !== PLANNER_DATA_EXPORT_VERSION) {
    return { ok: false, error: `Unsupported import version: ${String(migrated.version)}.` };
  }

  if (!isString(migrated.exportedAt)) {
    return { ok: false, error: "Import file is missing export metadata." };
  }

  if (!isPlannerPersistedData(migrated.data)) {
    return { ok: false, error: "Import file does not contain valid planner data." };
  }

  if (!isMealPersistedData(migrated.meals)) {
    return { ok: false, error: "Import file does not contain valid meal data." };
  }

  if (!isWorkTrackerPersistedData(migrated.workTracker)) {
    return { ok: false, error: "Import file does not contain valid work tracker data." };
  }

  return { ok: true, data: migrated.data, meals: migrated.meals, workTracker: migrated.workTracker };
}
