/**
 * utils.js  |  Pure helper functions
 *
 * No DOM access, no side effects beyond the download trigger.
 * Every export here is independently testable in isolation.
 */

/**
 * Converts raw user input into a safe, readable filename stem.
 * Strips non-alphanumeric characters, collapses repeated dashes,
 * and trims leading/trailing dashes.
 *
 * @param {string} rawText  - The value of the QR input field
 * @returns {string}        - e.g. "https-example-com" or "my-text"
 */
export function buildFilename(rawText) {
  const slug = rawText
    .trim()
    .substring(0, 40)
    .replace(/[^a-z0-9]/gi, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();

  return `qr-${slug || 'code'}.png`;
}

/**
 * Triggers a browser file-save dialog for the given data URL.
 * Creates and immediately discards a temporary <a> element —
 * no DOM node is permanently added to the document.
 *
 * @param {string} dataUrl   - A data: or blob: URL (typically from canvas.toDataURL)
 * @param {string} filename  - The suggested filename for the download
 */
export function triggerDownload(dataUrl, filename) {
  const anchor = document.createElement('a');
  anchor.href     = dataUrl;
  anchor.download = filename;
  anchor.click();
}
