import { useCallback, useState } from "react";
import { GoogleDriveApiError } from "../lib/googleDriveApi";
import { downloadPlannerDataBackup, uploadPlannerDataBackup } from "../lib/googleDriveSync";
import { withGoogleCalendarAuth } from "../lib/googleCalendarRequest";
import { parsePlannerDataImport, serializePlannerDataExport } from "../lib/plannerDataIO";
import { useMealStore } from "../store/mealStore";
import { usePlannerStore } from "../store/plannerStore";
import { useSettingsStore } from "../store/settingsStore";
import { useToastStore } from "../store/toastStore";
import { useWorkTrackerStore } from "../store/workTrackerStore";

export type UseGoogleDriveSyncResult = {
  isConnected: boolean;
  isUploading: boolean;
  isDownloading: boolean;
  lastUploadedAt: string | null;
  lastDownloadedAt: string | null;
  uploadToDrive: (options?: { silent?: boolean }) => void;
  downloadFromDrive: () => void;
};

/**
 * Returns a user-facing message for a failed Drive request, calling out the case where the
 * connected account hasn't yet granted the Drive scope added alongside an earlier Calendar-only
 * connection.
 *
 * @param caughtError - The error thrown by a Drive request.
 * @returns A message suitable for a toast.
 */
function describeDriveError(caughtError: unknown): string {
  if (caughtError instanceof GoogleDriveApiError && caughtError.status === 403) {
    return "Google Drive access wasn't granted. Click \"Reconnect to Google\" to grant Drive access.";
  }

  return caughtError instanceof Error ? caughtError.message : "Unknown error.";
}

/**
 * Manages manual "Upload to Drive" / "Download from Drive" actions for backing up planner and
 * meal data to a private app-only Google Drive file (see `lib/googleDriveSync.ts`).
 *
 * Reuses the shared Google access token (requested with combined Calendar + Drive scopes) via
 * `withGoogleCalendarAuth`, so the same connection covers both APIs.
 *
 * @returns Connection/loading state, last-synced timestamps, and the upload/download actions.
 */
export function useGoogleDriveSync(): UseGoogleDriveSyncResult {
  const googleCalendarStatus = useSettingsStore((state) => state.googleCalendarStatus);
  const lastUploadedAt = useSettingsStore((state) => state.googleDriveLastUploadedAt);
  const lastDownloadedAt = useSettingsStore((state) => state.googleDriveLastDownloadedAt);
  const setLastUploadedAt = useSettingsStore((state) => state.setGoogleDriveLastUploadedAt);
  const setLastDownloadedAt = useSettingsStore((state) => state.setGoogleDriveLastDownloadedAt);
  const [isUploading, setIsUploading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const showToast = useToastStore((state) => state.showToast);

  const uploadToDrive = useCallback((options?: { silent?: boolean }) => {
    setIsUploading(true);

    const plannerState = usePlannerStore.getState();
    const mealState = useMealStore.getState();
    const workTrackerState = useWorkTrackerStore.getState();
    const exportedJson = serializePlannerDataExport(
      { categories: plannerState.categories, segmentsByDate: plannerState.segmentsByDate },
      { components: mealState.components, meals: mealState.meals },
      {
        clients: workTrackerState.clients,
        projects: workTrackerState.projects,
        entriesByDate: workTrackerState.entriesByDate
      }
    );

    withGoogleCalendarAuth((accessToken) => uploadPlannerDataBackup(accessToken, exportedJson))
      .then(() => {
        setLastUploadedAt(new Date().toISOString());
        if (!options?.silent) {
          showToast({
            title: "Uploaded to Drive",
            message: "Your planner and meal data was backed up to Google Drive.",
            level: "success"
          });
        }
      })
      .catch((caughtError: unknown) => {
        showToast({
          title: "Drive upload failed",
          message: describeDriveError(caughtError),
          level: "error"
        });
      })
      .finally(() => {
        setIsUploading(false);
      });
  }, [setLastUploadedAt, showToast]);

  const downloadFromDrive = useCallback(() => {
    setIsDownloading(true);

    withGoogleCalendarAuth((accessToken) => downloadPlannerDataBackup(accessToken))
      .then((content) => {
        if (content === null) {
          showToast({
            title: "No backup found",
            message: "No backup was found in Google Drive yet.",
            level: "info"
          });
          return;
        }

        const parsed = parsePlannerDataImport(content);

        if (!parsed.ok) {
          showToast({
            title: "Drive download failed",
            message: parsed.error,
            level: "error"
          });
          return;
        }

        usePlannerStore.getState().replacePlannerData(parsed.data);
        useMealStore.getState().replaceMealData(parsed.meals);
        useWorkTrackerStore.getState().replaceWorkTrackerData(parsed.workTracker);
        setLastDownloadedAt(new Date().toISOString());
        showToast({
          title: "Downloaded from Drive",
          message: "The current planner state was replaced with your Google Drive backup.",
          level: "success"
        });
      })
      .catch((caughtError: unknown) => {
        showToast({
          title: "Drive download failed",
          message: describeDriveError(caughtError),
          level: "error"
        });
      })
      .finally(() => {
        setIsDownloading(false);
      });
  }, [setLastDownloadedAt, showToast]);

  return {
    isConnected: googleCalendarStatus === "signed-in",
    isUploading,
    isDownloading,
    lastUploadedAt,
    lastDownloadedAt,
    uploadToDrive,
    downloadFromDrive
  };
}
