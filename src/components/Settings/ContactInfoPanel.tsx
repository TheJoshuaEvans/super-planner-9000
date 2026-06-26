import { useState, type FormEvent } from "react";
import { useToastStore } from "../../store/toastStore";
import { useWorkTrackerStore } from "../../store/workTrackerStore";

const inputClassName =
  "w-full rounded-md border border-app-border bg-app-bg px-3 py-2 text-sm text-app-text placeholder:text-app-muted/60 focus:border-app-accent/60 focus:outline-none focus:ring-2 focus:ring-app-accent/20";

const labelClassName = "text-xs font-medium text-app-muted";

const primaryButtonClassName =
  "rounded-md bg-app-accent px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-app-accentStrong disabled:cursor-not-allowed disabled:opacity-40";

const secondaryButtonClassName =
  "rounded-md border border-app-border bg-app-panel/85 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-app-muted transition hover:border-app-accent/70 hover:text-app-text";

/**
 * Settings panel for the user's own contact info (name, email, phone, and address parts), used
 * as the "from" party when generating invoices and other billing documents. A single record,
 * edited via a local draft that only commits to the store on Save (matching the add/edit form
 * pattern used elsewhere in Settings), with a Reset button to discard unsaved edits.
 */
function ContactInfoPanel() {
  const userContactInfo = useWorkTrackerStore((state) => state.userContactInfo);
  const updateUserContactInfo = useWorkTrackerStore((state) => state.updateUserContactInfo);
  const showToast = useToastStore((state) => state.showToast);

  const [draft, setDraft] = useState(userContactInfo);

  /**
   * Commits the local draft to the store.
   */
  function handleSubmit(event: FormEvent): void {
    event.preventDefault();
    updateUserContactInfo(draft);
    showToast({ title: "Contact info saved", message: "Your contact information has been updated.", level: "success" });
  }

  /**
   * Discards unsaved edits, reverting the draft back to the last saved contact info.
   */
  function handleReset(): void {
    setDraft(userContactInfo);
  }

  return (
    <section className="space-y-3 rounded-lg border border-app-border bg-app-surface/70 p-4">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-app-muted">Contact Information</h3>
        <p className="text-sm text-app-text">
          Your own contact details, used as the "from" party when generating invoices and other billing documents.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1">
            <label className={labelClassName} htmlFor="contact-info-name">
              Name
            </label>
            <input
              id="contact-info-name"
              type="text"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              className={inputClassName}
            />
          </div>

          <div className="space-y-1">
            <label className={labelClassName} htmlFor="contact-info-email">
              Email
            </label>
            <input
              id="contact-info-email"
              type="email"
              value={draft.email}
              onChange={(e) => setDraft({ ...draft, email: e.target.value })}
              className={inputClassName}
            />
          </div>

          <div className="space-y-1">
            <label className={labelClassName} htmlFor="contact-info-phone">
              Phone Number
            </label>
            <input
              id="contact-info-phone"
              type="tel"
              value={draft.phone}
              onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
              className={inputClassName}
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label className={labelClassName} htmlFor="contact-info-address-line1">
              Address Line 1
            </label>
            <input
              id="contact-info-address-line1"
              type="text"
              value={draft.addressLine1}
              onChange={(e) => setDraft({ ...draft, addressLine1: e.target.value })}
              className={inputClassName}
            />
          </div>

          <div className="space-y-1">
            <label className={labelClassName} htmlFor="contact-info-address-line2">
              Address Line 2
            </label>
            <input
              id="contact-info-address-line2"
              type="text"
              value={draft.addressLine2}
              onChange={(e) => setDraft({ ...draft, addressLine2: e.target.value })}
              className={inputClassName}
            />
          </div>

          <div className="space-y-1">
            <label className={labelClassName} htmlFor="contact-info-city">
              City
            </label>
            <input
              id="contact-info-city"
              type="text"
              value={draft.city}
              onChange={(e) => setDraft({ ...draft, city: e.target.value })}
              className={inputClassName}
            />
          </div>

          <div className="space-y-1">
            <label className={labelClassName} htmlFor="contact-info-state">
              State / Province
            </label>
            <input
              id="contact-info-state"
              type="text"
              value={draft.state}
              onChange={(e) => setDraft({ ...draft, state: e.target.value })}
              className={inputClassName}
            />
          </div>

          <div className="space-y-1">
            <label className={labelClassName} htmlFor="contact-info-postal-code">
              Postal Code
            </label>
            <input
              id="contact-info-postal-code"
              type="text"
              value={draft.postalCode}
              onChange={(e) => setDraft({ ...draft, postalCode: e.target.value })}
              className={inputClassName}
            />
          </div>

          <div className="space-y-1">
            <label className={labelClassName} htmlFor="contact-info-country">
              Country
            </label>
            <input
              id="contact-info-country"
              type="text"
              value={draft.country}
              onChange={(e) => setDraft({ ...draft, country: e.target.value })}
              className={inputClassName}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button type="submit" className={primaryButtonClassName}>
            Save
          </button>
          <button type="button" onClick={handleReset} className={secondaryButtonClassName}>
            Reset
          </button>
        </div>
      </form>
    </section>
  );
}

export default ContactInfoPanel;
