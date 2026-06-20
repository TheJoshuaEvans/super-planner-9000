import { useState, type FormEvent } from "react";
import { countEntriesUsingProject, countProjectsUsingClient, isClientNameTaken } from "../../lib/workTrackerData";
import { useConfirmDialogStore } from "../../store/confirmDialogStore";
import { useWorkTrackerStore } from "../../store/workTrackerStore";
import type { WorkClient } from "../../store/workTrackerStore";

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

type FormMode = "list" | "add" | "edit";

/**
 * Settings panel for adding, renaming, and removing work-tracker clients. Clients have no
 * color of their own; they exist so projects can be scoped to one for later reporting.
 */
function ClientsPanel() {
  const clients = useWorkTrackerStore((state) => state.clients);
  const projects = useWorkTrackerStore((state) => state.projects);
  const entriesByDate = useWorkTrackerStore((state) => state.entriesByDate);
  const addClient = useWorkTrackerStore((state) => state.addClient);
  const updateClient = useWorkTrackerStore((state) => state.updateClient);
  const deleteClient = useWorkTrackerStore((state) => state.deleteClient);
  const requestConfirm = useConfirmDialogStore((state) => state.requestConfirm);

  const [mode, setMode] = useState<FormMode>("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");

  const nameTaken = isClientNameTaken(clients, formName, editingId ?? undefined);
  const canSave = formName.trim().length > 0 && !nameTaken;

  /**
   * Opens the add form with an empty label.
   */
  function handleStartAdd(): void {
    setMode("add");
    setEditingId(null);
    setFormName("");
  }

  /**
   * Opens the edit form pre-populated with the given client's values.
   *
   * @param client - The client to edit.
   */
  function handleStartEdit(client: WorkClient): void {
    setMode("edit");
    setEditingId(client.id);
    setFormName(client.name);
  }

  /**
   * Discards the active form and returns to list mode.
   */
  function handleCancel(): void {
    setMode("list");
    setEditingId(null);
    setFormName("");
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
      addClient(formName);
    } else if (mode === "edit" && editingId) {
      updateClient(editingId, formName);
    }
    handleCancel();
  }

  /**
   * Removes a client, warning first if any projects (and their logged entries) would be
   * deleted with it. There is no undo for the work tracker store.
   *
   * @param client - The client to remove.
   */
  function handleDelete(client: WorkClient): void {
    const projectCount = countProjectsUsingClient(projects, client.id);

    if (projectCount === 0) {
      deleteClient(client.id);
      return;
    }

    const entryCount = projects
      .filter((project) => project.clientId === client.id)
      .reduce((total, project) => total + countEntriesUsingProject(entriesByDate, project.id), 0);

    requestConfirm({
      title: "Remove client?",
      message: `"${client.name}" has ${projectCount} project${projectCount === 1 ? "" : "s"}${
        entryCount > 0 ? ` and ${entryCount} logged hour entr${entryCount === 1 ? "y" : "ies"}` : ""
      }. Removing this client will delete ${projectCount === 1 ? "that project" : "those projects"} and any entries logged against ${
        projectCount === 1 ? "it" : "them"
      } too. This cannot be undone.`,
      confirmLabel: "Remove",
      tone: "danger",
      onConfirm: () => deleteClient(client.id)
    });
  }

  return (
    <section className="space-y-3 rounded-lg border border-app-border bg-app-surface/70 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-app-muted">Clients</h3>
          <p className="text-sm text-app-text">
            Add, rename, or remove clients. Projects are scoped to a client, but client data isn't used by hour
            tracking yet.
          </p>
        </div>
        {mode === "list" && (
          <button type="button" onClick={handleStartAdd} className={`shrink-0 ${primaryButtonClassName}`}>
            + Add client
          </button>
        )}
      </div>

      {mode !== "list" && (
        <form onSubmit={handleSubmit} className="space-y-3 rounded-md border border-app-accent/40 bg-app-panel p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-app-muted">
            {mode === "add" ? "New Client" : "Edit Client"}
          </p>
          <div className="space-y-1">
            <input
              type="text"
              placeholder="Name"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              autoFocus
              className={inputClassName}
            />
            {nameTaken && formName.trim().length > 0 && (
              <p className="text-xs text-red-400">A client with this name already exists.</p>
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

      {clients.length === 0 ? (
        <p className="py-4 text-center text-sm text-app-muted">No clients yet. Add your first one above.</p>
      ) : (
        <ul className="space-y-2">
          {clients.map((client) => {
            const isBeingEdited = mode === "edit" && editingId === client.id;

            return (
              <li
                key={client.id}
                className={`flex items-center justify-between gap-3 rounded-md border p-3 ${
                  isBeingEdited ? "border-app-accent/50 bg-app-panel" : "border-app-border bg-app-panel/60"
                }`}
              >
                <p className="truncate text-sm font-semibold text-app-text">{client.name}</p>
                {mode === "list" && (
                  <div className="flex shrink-0 gap-1">
                    <button type="button" onClick={() => handleStartEdit(client)} className={rowButtonClassName}>
                      Edit
                    </button>
                    <button type="button" onClick={() => handleDelete(client)} className={rowDangerButtonClassName}>
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

export default ClientsPanel;
