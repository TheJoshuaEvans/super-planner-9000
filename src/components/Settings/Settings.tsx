import type { ChangeEvent } from "react";
import GoogleCalendarPanel from "./GoogleCalendarPanel";
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

      <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-app-border bg-app-surface/70 px-6 py-16 text-center">
        <div className="max-w-md space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight">More settings coming soon</h2>
        </div>
      </div>
    </section>
  );
}

export default Settings;
