import "./PortraitWarningOverlay.css";

type PortraitWarningOverlayProps = {
  isDismissed: boolean;
  onDismiss: () => void;
};

/**
 * Displays a portrait-orientation warning that can be dismissed for the current session.
 */
function PortraitWarningOverlay({ isDismissed, onDismiss }: PortraitWarningOverlayProps) {
  return (
    <section className={`portrait-warning-overlay ${isDismissed ? "portrait-warning-overlay--dismissed" : ""}`}>
      <div className="portrait-warning-card">
        <p className="portrait-warning-eyebrow">Landscape Works Best</p>
        <h2 className="portrait-warning-title">Rotate Your Device</h2>
        <p className="portrait-warning-copy">
          This planner uses a wide timeline workspace. Turn your phone sideways for the intended layout.
        </p>
        <div className="portrait-warning-actions">
          <button
            type="button"
            onClick={onDismiss}
            className="portrait-warning-dismiss"
            aria-label="Hide portrait warning for this session"
          >
            Continue In Portrait
          </button>
        </div>
      </div>
    </section>
  );
}

export default PortraitWarningOverlay;
