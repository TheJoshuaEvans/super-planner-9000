import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

const DEFAULT_DRAFT_START_TIME = "09:00";
const DEFAULT_DRAFT_END_TIME = "17:00";

type WorkEntryDraftStore = {
  draftStartTime: string;
  draftEndTime: string;
  setDraftRange: (startTime: string, endTime: string) => void;
};

/**
 * Persisted draft for the work-entry time-range slider, shared across every date's dock instead
 * of being scoped to one. This lets a user set the start handle when beginning a task and come
 * back later — even after a page reload or the tab going to sleep — to set the end handle before
 * saving, without losing the in-progress range.
 */
export const useWorkEntryDraftStore = create<WorkEntryDraftStore>()(
  persist(
    (set) => ({
      draftStartTime: DEFAULT_DRAFT_START_TIME,
      draftEndTime: DEFAULT_DRAFT_END_TIME,
      setDraftRange: (startTime, endTime) => set({ draftStartTime: startTime, draftEndTime: endTime })
    }),
    {
      name: "sp9000-work-entry-draft",
      storage: createJSONStorage(() => localStorage)
    }
  )
);
