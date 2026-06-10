import { useConfirmDialogStore, type ConfirmDialogTone } from "../../store/confirmDialogStore";

const confirmButtonToneClasses: Record<ConfirmDialogTone, string> = {
  default: "bg-app-accent text-white hover:bg-app-accentStrong",
  danger: "bg-red-500 text-white hover:bg-red-400"
};

/**
 * Renders the globally managed confirmation dialog, if one has been requested.
 */
function ConfirmDialog() {
  const request = useConfirmDialogStore((state) => state.request);
  const confirm = useConfirmDialogStore((state) => state.confirm);
  const cancel = useConfirmDialogStore((state) => state.cancel);

  if (!request) {
    return null;
  }

  const tone = request.tone ?? "default";

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      role="presentation"
      onClick={cancel}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
        className="w-full max-w-sm rounded-lg border border-app-border bg-app-surface p-5 shadow-card"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="confirm-dialog-title" className="text-lg font-semibold text-app-text">
          {request.title}
        </h2>
        <p id="confirm-dialog-message" className="mt-2 text-sm text-app-muted">
          {request.message}
        </p>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={cancel}
            className="rounded-md border border-app-border bg-app-panel/85 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-app-muted transition hover:border-app-accent/70 hover:text-app-text"
          >
            {request.cancelLabel ?? "Cancel"}
          </button>
          <button
            type="button"
            onClick={confirm}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition ${confirmButtonToneClasses[tone]}`}
          >
            {request.confirmLabel ?? "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;
