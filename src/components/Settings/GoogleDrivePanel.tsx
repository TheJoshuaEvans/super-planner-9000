import { useGoogleDriveSync } from "../../hooks/useGoogleDriveSync";
import { useSettingsStore } from "../../store/settingsStore";

const SECONDARY_BUTTON_CLASSES =
  "rounded-md border border-app-border bg-app-panel/85 px-2.5 py-1.5 text-xs font-semibold uppercase tracking-wide text-app-muted transition hover:border-app-accent/70 hover:text-app-text disabled:cursor-not-allowed disabled:opacity-40";

/**
 * Formats an ISO timestamp for display as a short local date/time string.
 *
 * @param isoTimestamp - ISO timestamp, or `null` if no sync has happened yet.
 * @returns A localized date/time string, or `null` if `isoTimestamp` is `null`.
 */
function formatSyncTimestamp(isoTimestamp: string | null): string | null {
  if (!isoTimestamp) {
    return null;
  }

  return new Date(isoTimestamp).toLocaleString();
}

/**
 * Settings panel for backing up planner and meal data to (and restoring it from) a private,
 * app-only file in the signed-in user's Google Drive. "Upload to Drive" and "Download from
 * Drive" are manual, with no conflict resolution; an optional toggle additionally enables
 * automatic, debounced uploads after planner/meal data changes.
 */
function GoogleDrivePanel() {
  const { isConnected, isUploading, isDownloading, lastUploadedAt, lastDownloadedAt, uploadToDrive, downloadFromDrive } =
    useGoogleDriveSync();
  const autoUploadEnabled = useSettingsStore((state) => state.googleDriveAutoUploadEnabled);
  const setAutoUploadEnabled = useSettingsStore((state) => state.setGoogleDriveAutoUploadEnabled);

  const formattedLastUploadedAt = formatSyncTimestamp(lastUploadedAt);
  const formattedLastDownloadedAt = formatSyncTimestamp(lastDownloadedAt);

  return (
    <section className="space-y-3 rounded-lg border border-app-border bg-app-surface/70 p-4">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-app-muted">Cloud Backup (Google Drive)</h3>
        <p className="text-sm text-app-text">
          Manually back up your planner and meal data to a private file in your Google Drive, or restore it from
          there. Downloading replaces all current local data.
        </p>
        {!isConnected ? (
          <p className="text-xs text-app-muted">Connect your Google account above to enable cloud backup.</p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => uploadToDrive()}
          disabled={!isConnected || isUploading || isDownloading}
          className={SECONDARY_BUTTON_CLASSES}
        >
          {isUploading ? "Uploading…" : "Upload to Drive"}
        </button>
        <button
          type="button"
          onClick={downloadFromDrive}
          disabled={!isConnected || isUploading || isDownloading}
          className={SECONDARY_BUTTON_CLASSES}
        >
          {isDownloading ? "Downloading…" : "Download from Drive"}
        </button>
      </div>

      <label className="flex items-start gap-2 text-sm text-app-text">
        <input
          type="checkbox"
          checked={autoUploadEnabled}
          onChange={(event) => setAutoUploadEnabled(event.target.checked)}
          disabled={!isConnected}
          className="mt-0.5 h-4 w-4 shrink-0 accent-app-accent"
        />
        <span>
          Automatically back up to Drive after changes
          <span className="block text-xs text-app-muted">
            Quietly uploads about 30 seconds after you stop editing planner or meal data.
          </span>
        </span>
      </label>

      {formattedLastUploadedAt || formattedLastDownloadedAt ? (
        <div className="space-y-0.5 text-xs text-app-muted">
          {formattedLastUploadedAt ? <p>Last uploaded: {formattedLastUploadedAt}</p> : null}
          {formattedLastDownloadedAt ? <p>Last downloaded: {formattedLastDownloadedAt}</p> : null}
        </div>
      ) : null}
    </section>
  );
}

export default GoogleDrivePanel;
