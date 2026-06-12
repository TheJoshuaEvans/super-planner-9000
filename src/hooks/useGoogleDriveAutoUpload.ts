import { useEffect, useRef } from "react";
import { useGoogleDriveSync } from "./useGoogleDriveSync";
import { useMealStore } from "../store/mealStore";
import { usePlannerStore } from "../store/plannerStore";
import { useSettingsStore } from "../store/settingsStore";

/** Delay after the most recent planner/meal data change before an automatic Drive backup fires. */
export const AUTO_UPLOAD_DEBOUNCE_MS = 30_000;

/**
 * When the "automatic uploads" toggle is on and Google is connected, silently backs up planner
 * and meal data to Google Drive a short while after any change, debounced so a burst of edits
 * triggers only one upload. Skips firing while a manual upload or download is already in
 * flight. Failures still surface via the error toast shown by `useGoogleDriveSync`.
 */
export function useGoogleDriveAutoUpload(): void {
  const autoUploadEnabled = useSettingsStore((state) => state.googleDriveAutoUploadEnabled);
  const { isConnected, isUploading, isDownloading, uploadToDrive } = useGoogleDriveSync();
  const timeoutRef = useRef<number | null>(null);
  const inFlightRef = useRef({ isUploading, isDownloading });
  const uploadToDriveRef = useRef(uploadToDrive);

  useEffect(() => {
    inFlightRef.current = { isUploading, isDownloading };
    uploadToDriveRef.current = uploadToDrive;
  }, [isUploading, isDownloading, uploadToDrive]);

  useEffect(() => {
    if (!autoUploadEnabled || !isConnected) {
      return;
    }

    function scheduleUpload(): void {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = window.setTimeout(() => {
        timeoutRef.current = null;

        if (!inFlightRef.current.isUploading && !inFlightRef.current.isDownloading) {
          uploadToDriveRef.current({ silent: true });
        }
      }, AUTO_UPLOAD_DEBOUNCE_MS);
    }

    const unsubscribePlanner = usePlannerStore.subscribe(scheduleUpload);
    const unsubscribeMeal = useMealStore.subscribe(scheduleUpload);

    return () => {
      unsubscribePlanner();
      unsubscribeMeal();

      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [autoUploadEnabled, isConnected]);
}
