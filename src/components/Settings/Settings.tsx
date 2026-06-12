import type { ChangeEvent } from "react";
import CategoriesPanel from "./CategoriesPanel";
import GoogleCalendarPanel from "./GoogleCalendarPanel";
import GoogleDrivePanel from "./GoogleDrivePanel";
import NotificationsPanel from "./NotificationsPanel";
import PlannerDataPanel from "./PlannerDataPanel";

type SettingsProps = {
  onExportPlannerData: () => void;
  onImportFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
};

/**
 * Settings page: planner categories, Google Calendar integration, planner data import/export,
 * Drive cloud backup, and notification preferences.
 */
function Settings({ onExportPlannerData, onImportFileChange }: SettingsProps) {
  return (
    <section className="flex flex-1 flex-col gap-5">
      <CategoriesPanel />

      <GoogleCalendarPanel />

      <PlannerDataPanel onExport={onExportPlannerData} onImportFileChange={onImportFileChange} />

      <GoogleDrivePanel />

      <NotificationsPanel />
    </section>
  );
}

export default Settings;
