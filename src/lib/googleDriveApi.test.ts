import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createGoogleDriveBackupFile,
  downloadGoogleDriveBackupFile,
  findGoogleDriveBackupFile,
  GOOGLE_DRIVE_BACKUP_FILENAME,
  GOOGLE_DRIVE_FILES_ENDPOINT,
  GOOGLE_DRIVE_UPLOAD_ENDPOINT,
  GoogleDriveApiError,
  updateGoogleDriveBackupFile
} from "./googleDriveApi";

describe("findGoogleDriveBackupFile", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("queries the app data folder for the backup filename and returns the first match", async () => {
    const json = vi.fn().mockResolvedValue({ files: [{ id: "file-1", modifiedTime: "2026-06-01T00:00:00.000Z" }] });
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, json });
    vi.stubGlobal("fetch", fetchMock);

    const result = await findGoogleDriveBackupFile("test-token");

    const requestedUrl = new URL(fetchMock.mock.calls[0][0] as string);
    expect(requestedUrl.origin + requestedUrl.pathname).toBe(GOOGLE_DRIVE_FILES_ENDPOINT);
    expect(requestedUrl.searchParams.get("spaces")).toBe("appDataFolder");
    expect(requestedUrl.searchParams.get("q")).toBe(`name='${GOOGLE_DRIVE_BACKUP_FILENAME}'`);
    expect(fetchMock.mock.calls[0][1]).toEqual({ headers: { Authorization: "Bearer test-token" } });
    expect(result).toEqual({ id: "file-1", modifiedTime: "2026-06-01T00:00:00.000Z" });
  });

  it("returns null when no backup file exists", async () => {
    const json = vi.fn().mockResolvedValue({ files: [] });
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, json });
    vi.stubGlobal("fetch", fetchMock);

    const result = await findGoogleDriveBackupFile("test-token");

    expect(result).toBeNull();
  });

  it("throws a GoogleDriveApiError with the status code when the response is not ok", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 401, json: vi.fn() });
    vi.stubGlobal("fetch", fetchMock);

    await expect(findGoogleDriveBackupFile("bad-token")).rejects.toThrow(GoogleDriveApiError);
    await expect(findGoogleDriveBackupFile("bad-token")).rejects.toMatchObject({ status: 401 });
  });
});

describe("createGoogleDriveBackupFile", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("creates the file in the app data folder, then uploads its content", async () => {
    const createJson = vi.fn().mockResolvedValue({ id: "file-1" });
    const uploadJson = vi.fn().mockResolvedValue({ id: "file-1", modifiedTime: "2026-06-02T00:00:00.000Z" });
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, status: 200, json: createJson })
      .mockResolvedValueOnce({ ok: true, status: 200, json: uploadJson });
    vi.stubGlobal("fetch", fetchMock);

    const result = await createGoogleDriveBackupFile("test-token", '{"hello":"world"}');

    expect(fetchMock).toHaveBeenCalledTimes(2);

    const [createUrl, createInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(createUrl).toBe(GOOGLE_DRIVE_FILES_ENDPOINT);
    expect(createInit.method).toBe("POST");
    expect(JSON.parse(createInit.body as string)).toEqual({
      name: GOOGLE_DRIVE_BACKUP_FILENAME,
      parents: ["appDataFolder"]
    });

    const [uploadUrl, uploadInit] = fetchMock.mock.calls[1] as [string, RequestInit];
    const uploadUrlObject = new URL(uploadUrl);
    expect(uploadUrlObject.origin + uploadUrlObject.pathname).toBe(`${GOOGLE_DRIVE_UPLOAD_ENDPOINT}/file-1`);
    expect(uploadInit.method).toBe("PATCH");
    expect(uploadInit.body).toBe('{"hello":"world"}');

    expect(result).toEqual({ id: "file-1", modifiedTime: "2026-06-02T00:00:00.000Z" });
  });

  it("throws a GoogleDriveApiError if the create request is not ok", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 403, json: vi.fn() });
    vi.stubGlobal("fetch", fetchMock);

    await expect(createGoogleDriveBackupFile("bad-token", "{}")).rejects.toMatchObject({ status: 403 });
  });
});

describe("updateGoogleDriveBackupFile", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("uploads new content to the given file id with uploadType=media", async () => {
    const json = vi.fn().mockResolvedValue({ id: "file-1", modifiedTime: "2026-06-03T00:00:00.000Z" });
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, json });
    vi.stubGlobal("fetch", fetchMock);

    const result = await updateGoogleDriveBackupFile("test-token", "file-1", '{"hello":"world"}');

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const urlObject = new URL(url);
    expect(urlObject.origin + urlObject.pathname).toBe(`${GOOGLE_DRIVE_UPLOAD_ENDPOINT}/file-1`);
    expect(urlObject.searchParams.get("uploadType")).toBe("media");
    expect(init.method).toBe("PATCH");
    expect(init.body).toBe('{"hello":"world"}');
    expect(result).toEqual({ id: "file-1", modifiedTime: "2026-06-03T00:00:00.000Z" });
  });

  it("throws a GoogleDriveApiError if the response is not ok", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 404, json: vi.fn() });
    vi.stubGlobal("fetch", fetchMock);

    await expect(updateGoogleDriveBackupFile("test-token", "missing", "{}")).rejects.toMatchObject({ status: 404 });
  });
});

describe("downloadGoogleDriveBackupFile", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("requests the file content with alt=media and returns the raw text", async () => {
    const text = vi.fn().mockResolvedValue('{"hello":"world"}');
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, text });
    vi.stubGlobal("fetch", fetchMock);

    const result = await downloadGoogleDriveBackupFile("test-token", "file-1");

    const [url] = fetchMock.mock.calls[0] as [string];
    const urlObject = new URL(url);
    expect(urlObject.origin + urlObject.pathname).toBe(`${GOOGLE_DRIVE_FILES_ENDPOINT}/file-1`);
    expect(urlObject.searchParams.get("alt")).toBe("media");
    expect(result).toBe('{"hello":"world"}');
  });

  it("throws a GoogleDriveApiError if the response is not ok", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 500, text: vi.fn() });
    vi.stubGlobal("fetch", fetchMock);

    await expect(downloadGoogleDriveBackupFile("test-token", "file-1")).rejects.toMatchObject({ status: 500 });
  });
});
