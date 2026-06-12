import {
  createGoogleDriveBackupFile,
  downloadGoogleDriveBackupFile,
  findGoogleDriveBackupFile,
  updateGoogleDriveBackupFile
} from "./googleDriveApi";

/**
 * Uploads planner data content to the app's Drive backup file, creating it on first use and
 * overwriting it on subsequent uploads.
 *
 * @param accessToken - OAuth access token granted with the drive.appdata scope.
 * @param content - Serialized planner data export JSON.
 * @returns The backup file's modified time after the upload.
 */
export async function uploadPlannerDataBackup(accessToken: string, content: string): Promise<string> {
  const existing = await findGoogleDriveBackupFile(accessToken);

  const file = existing
    ? await updateGoogleDriveBackupFile(accessToken, existing.id, content)
    : await createGoogleDriveBackupFile(accessToken, content);

  return file.modifiedTime;
}

/**
 * Downloads planner data content from the app's Drive backup file, if one exists.
 *
 * @param accessToken - OAuth access token granted with the drive.appdata scope.
 * @returns The backup file's content, or `null` if no backup has been uploaded yet.
 */
export async function downloadPlannerDataBackup(accessToken: string): Promise<string | null> {
  const existing = await findGoogleDriveBackupFile(accessToken);

  if (!existing) {
    return null;
  }

  return downloadGoogleDriveBackupFile(accessToken, existing.id);
}
