import GoogleCalendarPanel from "./GoogleCalendarPanel";

/**
 * Stub page for upcoming app settings and integrations (e.g. Google Calendar sync).
 */
function Settings() {
  return (
    <section className="flex flex-1 flex-col gap-5">
      <GoogleCalendarPanel />

      <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-app-border bg-app-surface/70 px-6 py-16 text-center">
        <div className="max-w-md space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight">More settings coming soon</h2>
        </div>
      </div>
    </section>
  );
}

export default Settings;
