/**
 * qr-service.js  |  QR code generation logic
 *
 * This module is the sole place that knows about the qrcode.js library.
 * It has zero knowledge of the DOM beyond the container element it is
 * handed at call time — all DOM refs live in ui-handler.js.
 *
 * Dependency: `QRCode` global exposed by the qrcode.js CDN script.
 */

export class QRService {

  constructor() {
    /** @type {QRCode|null} The active qrcode.js instance */
    this._instance = null;
  }

  /**
   * Renders a new QR code into `containerEl`.
   *
   * qrcode.js appends to its container rather than replacing it, so we
   * clear innerHTML before each call to guarantee a single, fresh render.
   *
   * Throws if qrcode.js encounters unsupported input (e.g. data that
   * exceeds the QR capacity for the chosen error-correction level).
   *
   * @param {HTMLElement} containerEl        - The element to render into
   * @param {object}      options
   * @param {string}      options.text       - The data to encode
   * @param {number}      options.size       - Width and height in pixels
   * @param {string}      options.colorDark  - Foreground hex color
   * @param {string}      options.colorLight - Background hex color
   * @param {string}      options.errorLevel - 'L' | 'M' | 'Q' | 'H'
   */
  generate(containerEl, { text, size, colorDark, colorLight, errorLevel }) {
    containerEl.innerHTML = '';

    this._instance = new QRCode(containerEl, {
      text,
      width:        size,
      height:       size,
      colorDark,
      colorLight,
      correctLevel: QRCode.CorrectLevel[errorLevel],
    });
  }
}
