import type { ChangeEvent } from "react";
import CategoriesPanel from "./CategoriesPanel";
import ClientsPanel from "./ClientsPanel";
import ContactInfoPanel from "./ContactInfoPanel";
import GoogleCalendarPanel from "./GoogleCalendarPanel";
import GoogleDrivePanel from "./GoogleDrivePanel";
import NotificationsPanel from "./NotificationsPanel";
import PlannerDataPanel from "./PlannerDataPanel";
import ProjectsPanel from "./ProjectsPanel";

type SettingsProps = {
  onExportPlannerData: () => void;
  onImportFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
};

/**
 * Settings page: planner categories, work-tracker clients/projects, the user's own contact info,
 * Google Calendar integration, planner data import/export, Drive cloud backup, and notification
 * preferences.
 */
function Settings({ onExportPlannerData, onImportFileChange }: SettingsProps) {
  return (
    <section className="flex flex-1 flex-col gap-5">
      <CategoriesPanel />

      <ClientsPanel />

      <ProjectsPanel />

      <ContactInfoPanel />

      <GoogleCalendarPanel />

      <PlannerDataPanel onExport={onExportPlannerData} onImportFileChange={onImportFileChange} />

      <GoogleDrivePanel />

      <NotificationsPanel />
    </section>
  );
}

export default Settings;
