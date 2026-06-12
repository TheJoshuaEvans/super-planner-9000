import { useRef, type ChangeEvent } from "react";

const SECONDARY_BUTTON_CLASSES =
  "rounded-md border border-app-border bg-app-panel/85 px-2.5 py-1.5 text-xs font-semibold uppercase tracking-wide text-app-muted transition hover:border-app-accent/70 hover:text-app-text";

type PlannerDataPanelProps = {
  onExport: () => void;
  onImportFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
};

/**
 * Settings panel for exporting the current planner and meal data to a JSON file,
 * or importing a previously exported file to replace the current state.
 */
function PlannerDataPanel({ onExport, onImportFileChange }: PlannerDataPanelProps) {
  const importInputRef = useRef<HTMLInputElement | null>(null);

  /**
   * Opens the file picker for a planner import.
   */
  function handleImportButtonClick(): void {
    importInputRef.current?.click();
  }

  return (
    <section className="space-y-3 rounded-lg border border-app-border bg-app-surface/70 p-4">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-app-muted">Planner Data</h3>
        <p className="text-sm text-app-text">
          Export your planner and meal data to a JSON file, or import a previously exported file to replace the
          current state.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={onExport} className={SECONDARY_BUTTON_CLASSES}>
          Export
        </button>
        <button type="button" onClick={handleImportButtonClick} className={SECONDARY_BUTTON_CLASSES}>
          Import
        </button>
      </div>

      <input
        ref={importInputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={onImportFileChange}
      />
    </section>
  );
}

export default PlannerDataPanel;
