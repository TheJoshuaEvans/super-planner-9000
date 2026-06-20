import { useState, type FormEvent } from "react";
import {
  countEntriesUsingProject,
  isProjectNameTaken,
  pickNextProjectColor
} from "../../lib/workTrackerData";
import { useConfirmDialogStore } from "../../store/confirmDialogStore";
import { useWorkTrackerStore } from "../../store/workTrackerStore";
import type { WorkProject } from "../../store/workTrackerStore";

const inputClassName =
  "w-full rounded-md border border-app-border bg-app-bg px-3 py-2 text-sm text-app-text placeholder:text-app-muted/60 focus:border-app-accent/60 focus:outline-none focus:ring-2 focus:ring-app-accent/20";

const colorInputClassName = "h-9 w-12 cursor-pointer rounded-md border border-app-border bg-app-bg p-1";

const primaryButtonClassName =
  "rounded-md bg-app-accent px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-app-accentStrong disabled:cursor-not-allowed disabled:opacity-40";

const secondaryButtonClassName =
  "rounded-md border border-app-border bg-app-panel/85 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-app-muted transition hover:border-app-accent/70 hover:text-app-text";

const rowButtonClassName =
  "rounded-sm border border-app-border px-2 py-0.5 text-xs text-app-muted transition hover:border-app-accent/60 hover:text-app-text";

const rowDangerButtonClassName =
  "rounded-sm border border-app-border px-2 py-0.5 text-xs text-app-muted transition hover:border-red-400/60 hover:text-red-300";

type FormMode = "list" | "add" | "edit";

/**
 * Settings panel for adding, renaming, recoloring, and removing work-tracker projects. Every
 * project must be scoped to a client; if none exist yet, a client can be created inline without
 * leaving this form.
 */
function ProjectsPanel() {
  const projects = useWorkTrackerStore((state) => state.projects);
  const clients = useWorkTrackerStore((state) => state.clients);
  const entriesByDate = useWorkTrackerStore((state) => state.entriesByDate);
  const addProject = useWorkTrackerStore((state) => state.addProject);
  const updateProject = useWorkTrackerStore((state) => state.updateProject);
  const deleteProject = useWorkTrackerStore((state) => state.deleteProject);
  const addClient = useWorkTrackerStore((state) => state.addClient);
  const requestConfirm = useConfirmDialogStore((state) => state.requestConfirm);

  const [mode, setMode] = useState<FormMode>("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formColor, setFormColor] = useState("#000000");
  const [formClientId, setFormClientId] = useState("");
  const [showQuickAddClient, setShowQuickAddClient] = useState(false);
  const [quickAddClientName, setQuickAddClientName] = useState("");

  const nameTaken = isProjectNameTaken(projects, formName, editingId ?? undefined);
  const canSave = formName.trim().length > 0 && !nameTaken && formClientId.length > 0;

  /**
   * Opens the add form with an empty label and a suggested unused color.
   */
  function handleStartAdd(): void {
    setMode("add");
    setEditingId(null);
    setFormName("");
    setFormColor(pickNextProjectColor(projects));
    setFormClientId(clients[0]?.id ?? "");
    setShowQuickAddClient(false);
    setQuickAddClientName("");
  }

  /**
   * Opens the edit form pre-populated with the given project's values.
   *
   * @param project - The project to edit.
   */
  function handleStartEdit(project: WorkProject): void {
    setMode("edit");
    setEditingId(project.id);
    setFormName(project.name);
    setFormColor(project.color);
    setFormClientId(project.clientId);
    setShowQuickAddClient(false);
    setQuickAddClientName("");
  }

  /**
   * Discards the active form and returns to list mode.
   */
  function handleCancel(): void {
    setMode("list");
    setEditingId(null);
    setFormName("");
    setShowQuickAddClient(false);
    setQuickAddClientName("");
  }

  /**
   * Commits the add or edit form, then returns to list mode.
   *
   * @param event - The form submit event.
   */
  function handleSubmit(event: FormEvent): void {
    event.preventDefault();
    if (!canSave) return;
    if (mode === "add") {
      addProject(formName, formColor, formClientId);
    } else if (mode === "edit" && editingId) {
      updateProject(editingId, formName, formColor, formClientId);
    }
    handleCancel();
  }

  /**
   * Creates a new client inline from within the project form and selects it immediately.
   */
  function handleQuickAddClient(): void {
    if (quickAddClientName.trim().length === 0) return;

    addClient(quickAddClientName);
    const created = useWorkTrackerStore.getState().clients.at(-1);

    if (created) {
      setFormClientId(created.id);
    }

    setShowQuickAddClient(false);
    setQuickAddClientName("");
  }

  /**
   * Removes a project, warning first if any logged entries would be deleted with it. There is
   * no undo for the work tracker store.
   *
   * @param project - The project to remove.
   */
  function handleDelete(project: WorkProject): void {
    const entryCount = countEntriesUsingProject(entriesByDate, project.id);

    if (entryCount === 0) {
      deleteProject(project.id);
      return;
    }

    requestConfirm({
      title: "Remove project?",
      message: `"${project.name}" has ${entryCount} logged hour entr${entryCount === 1 ? "y" : "ies"}. Removing this project will delete ${
        entryCount === 1 ? "that entry" : "those entries"
      } too. This cannot be undone.`,
      confirmLabel: "Remove",
      tone: "danger",
      onConfirm: () => deleteProject(project.id)
    });
  }

  return (
    <section className="space-y-3 rounded-lg border border-app-border bg-app-surface/70 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-app-muted">Projects</h3>
          <p className="text-sm text-app-text">
            Add, rename, recolor, or remove the projects used to log work hours. Every project must be assigned to
            a client.
          </p>
        </div>
        {mode === "list" && (
          <button type="button" onClick={handleStartAdd} className={`shrink-0 ${primaryButtonClassName}`}>
            + Add project
          </button>
        )}
      </div>

      {mode !== "list" && (
        <form onSubmit={handleSubmit} className="space-y-3 rounded-md border border-app-accent/40 bg-app-panel p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-app-muted">
            {mode === "add" ? "New Project" : "Edit Project"}
          </p>
          <div className="flex flex-wrap items-start gap-3">
            <div className="min-w-[10rem] flex-1 space-y-1">
              <input
                type="text"
                placeholder="Name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                autoFocus
                className={inputClassName}
              />
              {nameTaken && formName.trim().length > 0 && (
                <p className="text-xs text-red-400">A project with this name already exists.</p>
              )}
            </div>
            <input
              type="color"
              value={formColor}
              onChange={(e) => setFormColor(e.target.value)}
              aria-label="Project color"
              className={colorInputClassName}
            />
          </div>

          <div className="space-y-1">
            <select
              value={formClientId}
              onChange={(e) => setFormClientId(e.target.value)}
              disabled={clients.length === 0}
              className={inputClassName}
              aria-label="Client"
            >
              {clients.length === 0 ? (
                <option value="">No clients yet</option>
              ) : (
                clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))
              )}
            </select>
            {clients.length === 0 && (
              <p className="text-xs text-app-muted">Add a client first, or create one below.</p>
            )}

            {showQuickAddClient ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="New client name"
                  value={quickAddClientName}
                  onChange={(e) => setQuickAddClientName(e.target.value)}
                  className={inputClassName}
                />
                <button type="button" onClick={handleQuickAddClient} className={primaryButtonClassName}>
                  Add
                </button>
                <button type="button" onClick={() => setShowQuickAddClient(false)} className={secondaryButtonClassName}>
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowQuickAddClient(true)}
                className={`${rowButtonClassName} inline-block`}
              >
                + New client
              </button>
            )}
          </div>

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

      {projects.length === 0 ? (
        <p className="py-4 text-center text-sm text-app-muted">No projects yet. Add your first one above.</p>
      ) : (
        <ul className="space-y-2">
          {projects.map((project) => {
            const isBeingEdited = mode === "edit" && editingId === project.id;
            const client = clients.find((c) => c.id === project.clientId);

            return (
              <li
                key={project.id}
                className={`flex items-center justify-between gap-3 rounded-md border p-3 ${
                  isBeingEdited ? "border-app-accent/50 bg-app-panel" : "border-app-border bg-app-panel/60"
                }`}
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    aria-hidden="true"
                    className="h-4 w-4 shrink-0 rounded-full border border-app-border"
                    style={{ backgroundColor: project.color }}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-app-text">{project.name}</p>
                    <p className="truncate text-xs text-app-muted">{client?.name ?? "No client"}</p>
                  </div>
                </div>
                {mode === "list" && (
                  <div className="flex shrink-0 gap-1">
                    <button type="button" onClick={() => handleStartEdit(project)} className={rowButtonClassName}>
                      Edit
                    </button>
                    <button type="button" onClick={() => handleDelete(project)} className={rowDangerButtonClassName}>
                      Delete
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export default ProjectsPanel;
