/**
 * A single upgrade step for the planner data export envelope: transforms a raw parsed envelope
 * at `fromVersion` into the shape expected at `fromVersion + 1`, including bumping the `version`
 * field itself.
 */
export type PlannerDataMigrationStep = {
  fromVersion: number;
  migrate: (raw: Record<string, unknown>) => Record<string, unknown>;
};

/**
 * Returns true for plain JSON-like objects (not arrays or null). Duplicated locally (rather than
 * imported from plannerDataIO.ts) so this module has no dependency on the rest of the import path.
 *
 * @param value - Unknown value to inspect.
 * @returns Whether the value is a plain object.
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Registered upgrade steps for the planner data export envelope, one per version bump that needs
 * to backfill or reshape data. Add a new entry here whenever `PLANNER_DATA_EXPORT_VERSION` is
 * bumped in a way that changes the persisted shape, so older exports/backups keep importing
 * cleanly instead of being rejected outright.
 */
export const PLANNER_DATA_MIGRATIONS: PlannerDataMigrationStep[] = [
  {
    // v5 -> v6: WorkClient's `contactName`/`contactEmail` went from optional to required strings.
    // Backfill a blank string for either field that's missing or not already a string, on every
    // client; preserve any value that's already a valid string (clients exported during the
    // brief window where these fields were optional-but-present keep their real values).
    fromVersion: 5,
    migrate: (raw) => {
      const workTracker = isRecord(raw.workTracker) ? raw.workTracker : {};
      const clients = Array.isArray(workTracker.clients) ? workTracker.clients : [];

      return {
        ...raw,
        version: 6,
        workTracker: {
          ...workTracker,
          clients: clients.map((client) =>
            isRecord(client)
              ? {
                  ...client,
                  contactName: typeof client.contactName === "string" ? client.contactName : "",
                  contactEmail: typeof client.contactEmail === "string" ? client.contactEmail : ""
                }
              : client
          )
        }
      };
    }
  },
  {
    // v6 -> v7: WorkTrackerPersistedData gained a required `userContactInfo` record (the user's
    // own name/email/phone/address parts, used as the "from" party on invoices). Backfill it
    // blank. Note: the address fields below were split into parts (addressLine1/addressLine2/
    // city/state/postalCode/country) while still version 7 — see plannerDataIO.ts's
    // isUserContactInfo for the authoritative current shape.
    fromVersion: 6,
    migrate: (raw) => ({
      ...raw,
      version: 7,
      workTracker: {
        ...(isRecord(raw.workTracker) ? raw.workTracker : {}),
        userContactInfo: {
          name: "",
          email: "",
          phone: "",
          addressLine1: "",
          addressLine2: "",
          city: "",
          state: "",
          postalCode: "",
          country: ""
        }
      }
    })
  }
];

/**
 * Walks a raw parsed import envelope forward through registered migration steps, one version at
 * a time, until it reaches `targetVersion` or no step is registered for its current version (in
 * which case it's returned as-is, leaving the caller's own version check to reject it).
 *
 * @param raw - Parsed JSON envelope, of unknown/older shape.
 * @param targetVersion - The version to migrate up to (normally the app's current export version).
 * @param steps - Migration steps to apply (defaults to the real registered steps; overridable for tests).
 * @returns The envelope after applying every applicable migration in sequence.
 */
export function migratePlannerDataExport(
  raw: Record<string, unknown>,
  targetVersion: number,
  steps: PlannerDataMigrationStep[] = PLANNER_DATA_MIGRATIONS
): Record<string, unknown> {
  let current = raw;

  while (typeof current.version === "number" && current.version < targetVersion) {
    const step = steps.find((candidate) => candidate.fromVersion === current.version);

    if (!step) {
      break;
    }

    current = step.migrate(current);
  }

  return current;
}
