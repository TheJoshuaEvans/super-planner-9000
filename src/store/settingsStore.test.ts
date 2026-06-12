import { beforeEach, describe, expect, it } from "vitest";
import { useSettingsStore } from "./settingsStore";

const initialState = useSettingsStore.getState();

describe("settingsStore", () => {
  beforeEach(() => {
    useSettingsStore.setState(initialState, true);
    localStorage.clear();
  });

  it("starts signed out with no token or error", () => {
    const state = useSettingsStore.getState();

    expect(state.googleCalendarStatus).toBe("signed-out");
    expect(state.googleCalendarAccessToken).toBeNull();
    expect(state.googleCalendarError).toBeNull();
    expect(state.googleCalendarConnected).toBe(false);
  });

  it("marks the account as connected once signed in", () => {
    useSettingsStore.getState().setGoogleCalendarStatus("signed-in");

    const state = useSettingsStore.getState();
    expect(state.googleCalendarStatus).toBe("signed-in");
    expect(state.googleCalendarConnected).toBe(true);
  });

  it("retains the connected flag after signing out again", () => {
    useSettingsStore.getState().setGoogleCalendarStatus("signed-in");
    useSettingsStore.getState().setGoogleCalendarStatus("signed-out");

    expect(useSettingsStore.getState().googleCalendarConnected).toBe(true);
  });

  it("stores and clears the access token", () => {
    useSettingsStore.getState().setGoogleCalendarAccessToken("test-token");
    expect(useSettingsStore.getState().googleCalendarAccessToken).toBe("test-token");

    useSettingsStore.getState().setGoogleCalendarAccessToken(null);
    expect(useSettingsStore.getState().googleCalendarAccessToken).toBeNull();
  });

  it("stores connection error messages", () => {
    useSettingsStore.getState().setGoogleCalendarError("Something went wrong");
    expect(useSettingsStore.getState().googleCalendarError).toBe("Something went wrong");
  });

  it("stores and clears the token expiry timestamp", () => {
    useSettingsStore.getState().setGoogleCalendarTokenExpiresAt(123456);
    expect(useSettingsStore.getState().googleCalendarTokenExpiresAt).toBe(123456);

    useSettingsStore.getState().setGoogleCalendarTokenExpiresAt(null);
    expect(useSettingsStore.getState().googleCalendarTokenExpiresAt).toBeNull();
  });

  it("fully disconnects, clearing the persisted connected flag", () => {
    useSettingsStore.getState().setGoogleCalendarStatus("signed-in");
    useSettingsStore.getState().setGoogleCalendarAccessToken("test-token");
    useSettingsStore.getState().setGoogleCalendarTokenExpiresAt(123456);
    useSettingsStore.getState().setGoogleCalendarError("oops");

    useSettingsStore.getState().disconnectGoogleCalendar();

    const state = useSettingsStore.getState();
    expect(state.googleCalendarStatus).toBe("signed-out");
    expect(state.googleCalendarAccessToken).toBeNull();
    expect(state.googleCalendarTokenExpiresAt).toBeNull();
    expect(state.googleCalendarError).toBeNull();
    expect(state.googleCalendarConnected).toBe(false);
  });

  it("only persists the connected flag and Drive sync timestamps, not the access token, expiry, or live status", () => {
    useSettingsStore.getState().setGoogleCalendarStatus("signed-in");
    useSettingsStore.getState().setGoogleCalendarAccessToken("test-token");
    useSettingsStore.getState().setGoogleCalendarTokenExpiresAt(123456);
    useSettingsStore.getState().setGoogleCalendarError("oops");

    const persisted = JSON.parse(localStorage.getItem("sp9000-settings") ?? "{}");

    expect(persisted.state).toEqual({
      googleCalendarConnected: true,
      googleDriveLastUploadedAt: null,
      googleDriveLastDownloadedAt: null,
      googleDriveAutoUploadEnabled: false
    });
  });

  it("stores and clears the Drive sync timestamps", () => {
    useSettingsStore.getState().setGoogleDriveLastUploadedAt("2026-06-01T00:00:00.000Z");
    useSettingsStore.getState().setGoogleDriveLastDownloadedAt("2026-06-02T00:00:00.000Z");

    expect(useSettingsStore.getState().googleDriveLastUploadedAt).toBe("2026-06-01T00:00:00.000Z");
    expect(useSettingsStore.getState().googleDriveLastDownloadedAt).toBe("2026-06-02T00:00:00.000Z");

    useSettingsStore.getState().setGoogleDriveLastUploadedAt(null);
    useSettingsStore.getState().setGoogleDriveLastDownloadedAt(null);

    expect(useSettingsStore.getState().googleDriveLastUploadedAt).toBeNull();
    expect(useSettingsStore.getState().googleDriveLastDownloadedAt).toBeNull();
  });

  it("defaults the auto-upload toggle to off and allows enabling/disabling it", () => {
    expect(useSettingsStore.getState().googleDriveAutoUploadEnabled).toBe(false);

    useSettingsStore.getState().setGoogleDriveAutoUploadEnabled(true);
    expect(useSettingsStore.getState().googleDriveAutoUploadEnabled).toBe(true);

    useSettingsStore.getState().setGoogleDriveAutoUploadEnabled(false);
    expect(useSettingsStore.getState().googleDriveAutoUploadEnabled).toBe(false);
  });
});
