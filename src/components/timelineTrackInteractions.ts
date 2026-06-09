import {
  clientXToSlot,
  DEFAULT_SEGMENT_DURATION_SLOTS,
  snapSlot,
  TOTAL_DAY_SLOTS
} from "../lib/timeline";

export type MoveInteraction = {
  mode: "move";
  segmentId: string;
  duration: number;
  grabOffsetSlots: number;
  previewStartSlot: number;
};

export type ResizeInteraction = {
  mode: "resize-left" | "resize-right";
  segmentId: string;
  fixedStartSlot: number;
  fixedEndSlot: number;
  previewStartSlot: number;
  previewEndSlot: number;
};

export type InteractionState = MoveInteraction | ResizeInteraction;

const MIN_RESIZE_SLOTS = 1;

/**
 * Resolves the clamped start slot for a move interaction from a pointer position.
 *
 * @param clientX - Pointer x-coordinate in viewport pixels.
 * @param interaction - Active move interaction state.
 * @param trackLeft - Track left edge in viewport pixels.
 * @param trackWidth - Track width in pixels.
 * @returns Clamped slot for move preview and commit.
 */
export function resolveMoveStart(
  clientX: number,
  interaction: MoveInteraction,
  trackLeft: number,
  trackWidth: number
): number {
  const raw = snapSlot(clientXToSlot(clientX, trackLeft, trackWidth)) - interaction.grabOffsetSlots;
  const max = TOTAL_DAY_SLOTS - interaction.duration;
  return Math.max(0, Math.min(max, raw));
}

/**
 * Resolves a resize preview range from pointer x-position.
 *
 * @param clientX - Pointer x-coordinate in viewport pixels.
 * @param interaction - Active resize interaction state.
 * @param trackLeft - Track left edge in viewport pixels.
 * @param trackWidth - Track width in pixels.
 * @returns Start and end slot preview range.
 */
export function resolveResizeRange(
  clientX: number,
  interaction: ResizeInteraction,
  trackLeft: number,
  trackWidth: number
): { startSlot: number; endSlot: number } {
  const slot = snapSlot(clientXToSlot(clientX, trackLeft, trackWidth));

  if (interaction.mode === "resize-left") {
    const start = Math.max(0, Math.min(slot, interaction.fixedEndSlot - MIN_RESIZE_SLOTS));
    return { startSlot: start, endSlot: interaction.fixedEndSlot };
  }

  const end = Math.min(TOTAL_DAY_SLOTS, Math.max(slot, interaction.fixedStartSlot + MIN_RESIZE_SLOTS));
  return { startSlot: interaction.fixedStartSlot, endSlot: end };
}

/**
 * Resolves category drop preview start slot from pointer x-position.
 *
 * @param clientX - Pointer x-coordinate in viewport pixels.
 * @param trackLeft - Track left edge in viewport pixels.
 * @param trackWidth - Track width in pixels.
 * @returns Clamped drop preview slot.
 */
export function resolveDropPreviewSlot(clientX: number, trackLeft: number, trackWidth: number): number {
  const slot = snapSlot(clientXToSlot(clientX, trackLeft, trackWidth));
  const clamped = Math.min(slot, TOTAL_DAY_SLOTS - DEFAULT_SEGMENT_DURATION_SLOTS);
  return Math.max(0, clamped);
}

/**
 * Returns true when a pointer coordinate lies within a DOMRect bounds box.
 *
 * @param clientX - Pointer x-coordinate in viewport pixels.
 * @param clientY - Pointer y-coordinate in viewport pixels.
 * @param rect - Rectangle bounds to test against.
 * @returns Whether the pointer is inside the rectangle.
 */
export function isPointerInRect(clientX: number, clientY: number, rect: Pick<DOMRect, "left" | "right" | "top" | "bottom">): boolean {
  return clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom;
}
