import { useState, type FormEvent } from "react";
import { parseHoursInput, parseTimeRangeToHours } from "../../lib/workHours";
import { useWorkTrackerStore } from "../../store/workTrackerStore";
import type { WorkEntry, WorkProject } from "../../store/workTrackerStore";

const inputClassName =
  "w-full rounded-md border border-app-border bg-app-bg px-3 py-2 text-sm text-app-text placeholder:text-app-muted/60 focus:border-app-accent/60 focus:outline-none focus:ring-2 focus:ring-app-accent/20";

const primaryButtonClassName =
  "rounded-md bg-app-accent px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-app-accentStrong disabled:cursor-not-allowed disabled:opacity-40";

const secondaryButtonClassName =
  "rounded-md border border-app-border bg-app-panel/85 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-app-muted transition hover:border-app-accent/70 hover:text-app-text";

const rowButtonClassName =
  "rounded-sm border border-app-border px-2 py-0.5 text-xs text-app-muted transition hover:border-app-accent/60 hover:text-app-text";

const rowDangerButtonClassName =
  "rounded-sm border border-app-border px-2 py-0.5 text-xs text-app-muted transition hover:border-red-400/60 hover:text-red-300";

function toggleButtonClassName(isActive: boolean): string {
  return isActive ? primaryButtonClassName : secondaryButtonClassName;
}

type FormMode = "list" | "add" | "edit";
type InputMode = "hours" | "range";

type WorkEntryDockProps = {
  dateKey: string;
  dateLabel: string;
  entries: WorkEntry[];
  projects: WorkProject[];
  onClose: () => void;
};

/**
 * Docked editor for a single selected calendar date: lists logged hour entries for that day and
 * provides an add/edit form supporting both a raw-hours input and a time-range input, both of
 * which resolve to the same stored decimal hours value before being saved.
 */
function WorkEntryDock({ dateKey, dateLabel, entries, projects, onClose }: WorkEntryDockProps) {
  const addEntry = useWorkTrackerStore((state) => state.addEntry);
  const updateEntry = useWorkTrackerStore((state) => state.updateEntry);
  const deleteEntry = useWorkTrackerStore((state) => state.deleteEntry);

  const [mode, setMode] = useState<FormMode>("list");
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState<InputMode>("hours");
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [hoursText, setHoursText] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const parsedHours = inputMode === "hours" ? parseHoursInput(hoursText) : parseTimeRangeToHours(startTime, endTime);
  const canSave = selectedProjectId.length > 0 && parsedHours !== null;

  /**
   * Opens the add form with an empty state and a default project selection.
   */
  function handleStartAdd(): void {
    setMode("add");
    setEditingEntryId(null);
    setInputMode("hours");
    setSelectedProjectId(projects[0]?.id ?? "");
    setHoursText("");
    setStartTime("");
    setEndTime("");
  }

  /**
   * Opens the edit form pre-populated with the given entry's project and hours.
   *
   * @param entry - The entry to edit.
   */
  function handleStartEdit(entry: WorkEntry): void {
    setMode("edit");
    setEditingEntryId(entry.id);
    setInputMode("hours");
    setSelectedProjectId(entry.projectId);
    setHoursText(String(entry.hours));
    setStartTime("");
    setEndTime("");
  }

  /**
   * Discards the active form and returns to list mode.
   */
  function handleCancel(): void {
    setMode("list");
    setEditingEntryId(null);
  }

  /**
   * Commits the add or edit form, then returns to list mode.
   *
   * @param event - The form submit event.
   */
  function handleSubmit(event: FormEvent): void {
    event.preventDefault();
    if (!canSave || parsedHours === null) return;

    if (mode === "add") {
      addEntry(dateKey, selectedProjectId, parsedHours);
    } else if (mode === "edit" && editingEntryId) {
      updateEntry(dateKey, editingEntryId, selectedProjectId, parsedHours);
    }

    handleCancel();
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-app-muted">Logging hours for {dateLabel}</p>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md border border-app-border px-2 py-1 text-xs font-medium text-app-muted transition hover:border-app-text hover:text-app-text"
          aria-label="Close hours editor"
        >
          Close
        </button>
      </div>

      {projects.length === 0 ? (
        <p className="text-sm text-app-muted">Add a project in Settings first to start logging hours.</p>
      ) : (
        <>
          {mode === "list" && (
            <button type="button" onClick={handleStartAdd} className={primaryButtonClassName}>
              + Log hours
            </button>
          )}

          {mode !== "list" && (
            <form onSubmit={handleSubmit} className="space-y-3 rounded-md border border-app-accent/40 bg-app-panel p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-app-muted">
                {mode === "add" ? "New Entry" : "Edit Entry"}
              </p>

              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className={inputClassName}
                aria-label="Project"
              >
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setInputMode("hours")}
                  className={toggleButtonClassName(inputMode === "hours")}
                >
                  Hours
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode("range")}
                  className={toggleButtonClassName(inputMode === "range")}
                >
                  Time range
                </button>
              </div>

              {inputMode === "hours" ? (
                <input
                  type="number"
                  step="0.25"
                  min="0"
                  placeholder="Hours"
                  value={hoursText}
                  onChange={(e) => setHoursText(e.target.value)}
                  className={inputClassName}
                  aria-label="Hours worked"
                />
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className={inputClassName}
                    aria-label="Start time"
                  />
                  <span className="text-sm text-app-muted">to</span>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className={inputClassName}
                    aria-label="End time"
                  />
                </div>
              )}

              {parsedHours !== null && <p className="text-xs text-app-muted">{parsedHours} hour{parsedHours === 1 ? "" : "s"}</p>}

              <div className="flex gap-2">
                <button type="submit" disabled={!canSave} className={primaryButtonClassName}>
                  Save
                </button>
                <button type="button" onClick={handleCancel} className={secondaryButtonClassName}>
                  Cancel
                </button>
              </div>
            </form>
          )}

          {entries.length === 0 ? (
            <p className="py-2 text-sm text-app-muted">No hours logged for this day yet.</p>
          ) : (
            <ul className="space-y-2">
              {entries.map((entry) => {
                const project = projects.find((p) => p.id === entry.projectId);
                const isBeingEdited = mode === "edit" && editingEntryId === entry.id;

                return (
                  <li
                    key={entry.id}
                    className={`flex items-center justify-between gap-3 rounded-md border p-3 ${
                      isBeingEdited ? "border-app-accent/50 bg-app-panel" : "border-app-border bg-app-panel/60"
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        aria-hidden="true"
                        className="h-4 w-4 shrink-0 rounded-full border border-app-border"
                        style={{ backgroundColor: project?.color ?? "#94a3b8" }}
                      />
                      <p className="truncate text-sm font-semibold text-app-text">{project?.name ?? "Unknown project"}</p>
                      <p className="shrink-0 text-sm text-app-muted">{entry.hours}h</p>
                    </div>
                    {mode === "list" && (
                      <div className="flex shrink-0 gap-1">
                        <button type="button" onClick={() => handleStartEdit(entry)} className={rowButtonClassName}>
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteEntry(dateKey, entry.id)}
                          className={rowDangerButtonClassName}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

export default WorkEntryDock;
