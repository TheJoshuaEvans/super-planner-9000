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

  it("only persists the connected flag, not the access token, expiry, or live status", () => {
    useSettingsStore.getState().setGoogleCalendarStatus("signed-in");
    useSettingsStore.getState().setGoogleCalendarAccessToken("test-token");
    useSettingsStore.getState().setGoogleCalendarTokenExpiresAt(123456);
    useSettingsStore.getState().setGoogleCalendarError("oops");

    const persisted = JSON.parse(localStorage.getItem("sp9000-settings") ?? "{}");

    expect(persisted.state).toEqual({ googleCalendarConnected: true });
  });
});
