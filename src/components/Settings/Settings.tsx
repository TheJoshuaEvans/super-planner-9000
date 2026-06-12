import type { ChangeEvent } from "react";
import GoogleCalendarPanel from "./GoogleCalendarPanel";
import GoogleDrivePanel from "./GoogleDrivePanel";
import PlannerDataPanel from "./PlannerDataPanel";

type SettingsProps = {
  onExportPlannerData: () => void;
  onImportFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
};

/**
 * Settings page: Google Calendar integration, planner data import/export, and future settings.
 */
function Settings({ onExportPlannerData, onImportFileChange }: SettingsProps) {
  return (
    <section className="flex flex-1 flex-col gap-5">
      <GoogleCalendarPanel />

      <PlannerDataPanel onExport={onExportPlannerData} onImportFileChange={onImportFileChange} />

      <GoogleDrivePanel />

      {/* Future settings sections go here */}
    </section>
  );
}

export default Settings;
