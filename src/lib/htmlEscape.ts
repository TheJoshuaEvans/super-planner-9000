/**
 * Escapes HTML-sensitive characters so arbitrary text can be safely interpolated into markup.
 *
 * @param text - Raw text to escape.
 * @returns Text with `&`, `<`, `>`, and `"` replaced by their HTML entities.
 */
export function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
