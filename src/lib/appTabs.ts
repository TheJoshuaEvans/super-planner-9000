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
    id: "dashboard",
    label: "Dashboard",
    kicker: "Weekly Dashboard",
    description:
      "Plan your week with draggable timeline blocks for the next 7 days, click an Eat block to assign meals, copy and paste patterns across dates, and keep an eye on your shopping list. Any date you select from the calendar opens in the docked editor below.",
    contentKind: "dashboard"
  },
  {
    id: "meal-creator",
    label: "Meal Creator",
    kicker: "Meal Creator",
    description: "Stub page for upcoming meal creation workflows.",
    contentKind: "meal-creator"
  },
  {
    id: "settings",
    label: "Settings",
    kicker: "Settings",
    description: "Stub page for upcoming app settings and integrations, such as Google Calendar sync.",
    contentKind: "settings"
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
