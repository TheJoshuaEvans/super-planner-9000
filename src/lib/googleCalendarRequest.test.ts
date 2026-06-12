import { beforeEach, describe, expect, it, vi } from "vitest";
import { useSettingsStore } from "../store/settingsStore";
import { GoogleCalendarApiError } from "./googleCalendarApi";
import { withGoogleCalendarAuth } from "./googleCalendarRequest";

const initialState = useSettingsStore.getState();

describe("withGoogleCalendarAuth", () => {
  beforeEach(() => {
    useSettingsStore.setState(initialState, true);
  });

  it("throws if not signed in", async () => {
    await expect(withGoogleCalendarAuth(async () => "ok")).rejects.toThrow("Not signed in");
  });

  it("returns the result on success", async () => {
    useSettingsStore.getState().setGoogleCalendarAccessToken("token-1");
    const request = vi.fn().mockResolvedValue("ok");

    const result = await withGoogleCalendarAuth(request);

    expect(result).toBe("ok");
    expect(request).toHaveBeenCalledWith("token-1");
  });

  it("marks the connection as needing reconnection on a 401, without losing googleCalendarConnected", async () => {
    useSettingsStore.getState().setGoogleCalendarStatus("signed-in");
    useSettingsStore.getState().setGoogleCalendarAccessToken("stale-token");
    useSettingsStore.getState().setGoogleCalendarTokenExpiresAt(123456);

    const error = new GoogleCalendarApiError(401);
    const request = vi.fn().mockRejectedValue(error);

    await expect(withGoogleCalendarAuth(request)).rejects.toBe(error);

    const state = useSettingsStore.getState();
    expect(state.googleCalendarStatus).toBe("signed-out");
    expect(state.googleCalendarAccessToken).toBeNull();
    expect(state.googleCalendarTokenExpiresAt).toBeNull();
    expect(state.googleCalendarConnected).toBe(true);
  });

  it("rethrows non-401 errors without changing status", async () => {
    useSettingsStore.getState().setGoogleCalendarStatus("signed-in");
    useSettingsStore.getState().setGoogleCalendarAccessToken("token-1");

    const error = new GoogleCalendarApiError(500);
    const request = vi.fn().mockRejectedValue(error);

    await expect(withGoogleCalendarAuth(request)).rejects.toBe(error);
    expect(useSettingsStore.getState().googleCalendarStatus).toBe("signed-in");
  });
});
