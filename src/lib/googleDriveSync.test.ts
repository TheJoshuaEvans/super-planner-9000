import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createGoogleDriveBackupFile,
  downloadGoogleDriveBackupFile,
  findGoogleDriveBackupFile,
  updateGoogleDriveBackupFile
} from "./googleDriveApi";
import { downloadPlannerDataBackup, uploadPlannerDataBackup } from "./googleDriveSync";

vi.mock("./googleDriveApi", () => ({
  findGoogleDriveBackupFile: vi.fn(),
  createGoogleDriveBackupFile: vi.fn(),
  updateGoogleDriveBackupFile: vi.fn(),
  downloadGoogleDriveBackupFile: vi.fn()
}));

describe("uploadPlannerDataBackup", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("creates a new backup file when none exists yet", async () => {
    vi.mocked(findGoogleDriveBackupFile).mockResolvedValue(null);
    vi.mocked(createGoogleDriveBackupFile).mockResolvedValue({ id: "file-1", modifiedTime: "2026-06-01T00:00:00.000Z" });

    const result = await uploadPlannerDataBackup("test-token", '{"hello":"world"}');

    expect(createGoogleDriveBackupFile).toHaveBeenCalledWith("test-token", '{"hello":"world"}');
    expect(updateGoogleDriveBackupFile).not.toHaveBeenCalled();
    expect(result).toBe("2026-06-01T00:00:00.000Z");
  });

  it("updates the existing backup file when one is found", async () => {
    vi.mocked(findGoogleDriveBackupFile).mockResolvedValue({ id: "file-1", modifiedTime: "2026-06-01T00:00:00.000Z" });
    vi.mocked(updateGoogleDriveBackupFile).mockResolvedValue({ id: "file-1", modifiedTime: "2026-06-02T00:00:00.000Z" });

    const result = await uploadPlannerDataBackup("test-token", '{"hello":"world"}');

    expect(updateGoogleDriveBackupFile).toHaveBeenCalledWith("test-token", "file-1", '{"hello":"world"}');
    expect(createGoogleDriveBackupFile).not.toHaveBeenCalled();
    expect(result).toBe("2026-06-02T00:00:00.000Z");
  });
});

describe("downloadPlannerDataBackup", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when no backup file exists", async () => {
    vi.mocked(findGoogleDriveBackupFile).mockResolvedValue(null);

    const result = await downloadPlannerDataBackup("test-token");

    expect(result).toBeNull();
    expect(downloadGoogleDriveBackupFile).not.toHaveBeenCalled();
  });

  it("downloads the backup file's content when one exists", async () => {
    vi.mocked(findGoogleDriveBackupFile).mockResolvedValue({ id: "file-1", modifiedTime: "2026-06-01T00:00:00.000Z" });
    vi.mocked(downloadGoogleDriveBackupFile).mockResolvedValue('{"hello":"world"}');

    const result = await downloadPlannerDataBackup("test-token");

    expect(downloadGoogleDriveBackupFile).toHaveBeenCalledWith("test-token", "file-1");
    expect(result).toBe('{"hello":"world"}');
  });
});
