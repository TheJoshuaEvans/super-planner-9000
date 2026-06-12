/** Google Drive API endpoint for file metadata operations (list/create/get). */
export const GOOGLE_DRIVE_FILES_ENDPOINT = "https://www.googleapis.com/drive/v3/files";

/** Google Drive API endpoint for uploading file content. */
export const GOOGLE_DRIVE_UPLOAD_ENDPOINT = "https://www.googleapis.com/upload/drive/v3/files";

/** Fixed filename for the single planner data backup stored in the app's hidden Drive folder. */
export const GOOGLE_DRIVE_BACKUP_FILENAME = "super-planner-9000-data.json";

/** A Google Drive file's id and last-modified timestamp. */
export type GoogleDriveFile = {
  id: string;
  modifiedTime: string;
};

/** Thrown when a Google Drive API request returns a non-OK response. */
export class GoogleDriveApiError extends Error {
  status: number;

  constructor(status: number) {
    super(`Google Drive API request failed with status ${status}`);
    this.name = "GoogleDriveApiError";
    this.status = status;
  }
}

/**
 * Looks up the planner data backup file in the app's hidden Drive "app data folder".
 *
 * @param accessToken - OAuth access token granted with the drive.appdata scope.
 * @returns The backup file's id and modified time, or `null` if no backup exists yet.
 * @throws {GoogleDriveApiError} If the response status is not OK.
 */
export async function findGoogleDriveBackupFile(accessToken: string): Promise<GoogleDriveFile | null> {
  const url = new URL(GOOGLE_DRIVE_FILES_ENDPOINT);
  url.searchParams.set("spaces", "appDataFolder");
  url.searchParams.set("q", `name='${GOOGLE_DRIVE_BACKUP_FILENAME}'`);
  url.searchParams.set("fields", "files(id,modifiedTime)");

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    throw new GoogleDriveApiError(response.status);
  }

  const body = (await response.json()) as { files?: GoogleDriveFile[] };
  return body.files?.[0] ?? null;
}

/**
 * Creates the planner data backup file in the app's hidden Drive "app data folder" and
 * uploads its content.
 *
 * @param accessToken - OAuth access token granted with the drive.appdata scope.
 * @param content - Serialized planner data export JSON.
 * @returns The created file's id and modified time.
 * @throws {GoogleDriveApiError} If either request's response status is not OK.
 */
export async function createGoogleDriveBackupFile(accessToken: string, content: string): Promise<GoogleDriveFile> {
  const response = await fetch(GOOGLE_DRIVE_FILES_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ name: GOOGLE_DRIVE_BACKUP_FILENAME, parents: ["appDataFolder"] })
  });

  if (!response.ok) {
    throw new GoogleDriveApiError(response.status);
  }

  const { id } = (await response.json()) as { id: string };
  return updateGoogleDriveBackupFile(accessToken, id, content);
}

/**
 * Uploads new content to an existing planner data backup file.
 *
 * @param accessToken - OAuth access token granted with the drive.appdata scope.
 * @param fileId - The backup file's Drive id.
 * @param content - Serialized planner data export JSON.
 * @returns The updated file's id and modified time.
 * @throws {GoogleDriveApiError} If the response status is not OK.
 */
export async function updateGoogleDriveBackupFile(
  accessToken: string,
  fileId: string,
  content: string
): Promise<GoogleDriveFile> {
  const url = new URL(`${GOOGLE_DRIVE_UPLOAD_ENDPOINT}/${fileId}`);
  url.searchParams.set("uploadType", "media");
  url.searchParams.set("fields", "id,modifiedTime");

  const response = await fetch(url.toString(), {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: content
  });

  if (!response.ok) {
    throw new GoogleDriveApiError(response.status);
  }

  return (await response.json()) as GoogleDriveFile;
}

/**
 * Downloads the content of the planner data backup file.
 *
 * @param accessToken - OAuth access token granted with the drive.appdata scope.
 * @param fileId - The backup file's Drive id.
 * @returns The file's raw text content.
 * @throws {GoogleDriveApiError} If the response status is not OK.
 */
export async function downloadGoogleDriveBackupFile(accessToken: string, fileId: string): Promise<string> {
  const url = new URL(`${GOOGLE_DRIVE_FILES_ENDPOINT}/${fileId}`);
  url.searchParams.set("alt", "media");

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    throw new GoogleDriveApiError(response.status);
  }

  return response.text();
}
