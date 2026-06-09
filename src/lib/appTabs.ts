/**
 * Application tab configuration model.
 *
 * Tabs are defined here as a single source of truth.
 *
 * To add a new tab:
 * 1. Add an entry to APP_TABS with id, label, kicker, description, and contentKind.
 * 2. Handle the new contentKind in the tab content branching in App.tsx.
 */

/** Registered application tab definitions. */
export const APP_TABS = [
  {
    id: "day-planner",
    label: "Day Planner",
    kicker: "Daily Timeline Planner",
    description:
      "Plan your day with draggable timeline blocks, copy and paste patterns across dates, and preview how each calendar day is filling up at a glance. Today and tomorrow stay pinned up top, while any date you select from the calendar opens in the docked editor below.",
    contentKind: "day-planner"
  },
  {
    id: "meal-planner",
    label: "Meal Planner",
    kicker: "Meal Planner",
    description:
      "Review your day through a meal-planning lens, with food blocks emphasized and everything else subdued.",
    contentKind: "meal-planner"
  },
  {
    id: "meal-creator",
    label: "Meal Creator",
    kicker: "Meal Creator",
    description: "Stub page for upcoming meal creation workflows.",
    contentKind: "meal-creator"
  }
] as const;

/** Union of all valid tab identifiers derived from APP_TABS. */
export type AppTab = (typeof APP_TABS)[number]["id"];

/** Full type for a single tab definition entry from APP_TABS. */
export type AppTabDefinition = (typeof APP_TABS)[number];

/** localStorage key used to persist the active tab between sessions. */
export const ACTIVE_TAB_LOCAL_STORAGE_KEY = "sp9000-active-tab";

/**
 * Returns true if the given value is a known registered AppTab id.
 * Intended for validating values read from localStorage.
 *
 * @param value - An arbitrary string or null to check.
 * @returns Whether the value matches any registered tab id.
 */
export function isAppTab(value: string | null): value is AppTab {
  return APP_TABS.some((tab) => tab.id === value);
}

/**
 * Returns the tab definition for the given id, falling back to the first tab if not found.
 *
 * @param tabId - A valid AppTab id.
 * @returns The matching AppTabDefinition, or APP_TABS[0] as a safe fallback.
 */
export function getAppTabDefinition(tabId: AppTab): AppTabDefinition {
  return APP_TABS.find((tab) => tab.id === tabId) ?? APP_TABS[0];
}
