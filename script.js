/**
 * script.js  |  QRGen — QR Code Generator
 *
 * Architecture: ES6 Class (`QRCodeApp`)
 * ─────────────────────────────────────────────────────────────
 * Why a class instead of an IIFE or loose functions?
 *
 *  1. State lives on `this` (the qrInstance, DOM refs) — no
 *     global variables, nothing leaked onto `window`.
 *
 *  2. All DOM refs are cached once in the constructor and stored
 *     in a single `_els` object, avoiding repeated querySelector
 *     calls on every user interaction.
 *
 *  3. The `_methodName` prefix convention (vs. `#private` fields)
 *     signals "internal — don't call from outside" while remaining
 *     compatible with all ES2017+ environments without transpilation.
 *
 *  4. Separation of concerns is enforced at the method level:
 *     _validate → _showError/_clearError → _setLoading → _generate
 *     Each does exactly one thing and is independently testable.
 */

class QRCodeApp {

  constructor() {
    // ── Cache every DOM element we touch ─────────────────────────
    // Grouped into a single object so we have one place to update
    // if element IDs ever change, and to make it obvious which
    // elements this class owns.
    this._els = {
      form:          document.getElementById('qr-form'),
      input:         document.getElementById('qr-input'),
      sizeSelect:    document.getElementById('qr-size'),
      fgColor:       document.getElementById('qr-fg-color'),
      bgColor:       document.getElementById('qr-bg-color'),
      errorLevel:    document.getElementById('qr-error-level'),
      generateBtn:   document.getElementById('generate-btn'),
      downloadBtn:   document.getElementById('download-btn'),
      qrOutput:      document.getElementById('qr-output'),
      qrPlaceholder: document.getElementById('qr-placeholder'),
      inputError:    document.getElementById('input-error'),
      fgSwatch:      document.getElementById('fg-swatch'),
      bgSwatch:      document.getElementById('bg-swatch'),
      fgHex:         document.getElementById('fg-hex'),
      bgHex:         document.getElementById('bg-hex'),
      btnLabel:      document.querySelector('#generate-btn .btn__label'),
    };

    /** @type {QRCode|null} The active qrcode.js instance */
    this._qrInstance = null;

    this._bindEvents();
    // Initialise swatch colours to match the default input values
    this._syncColor(this._els.fgColor, this._els.fgSwatch, this._els.fgHex);
    this._syncColor(this._els.bgColor, this._els.bgSwatch, this._els.bgHex);
  }


  // ═══════════════════════════════════════════════════════════════
  //  Event Binding
  // ═══════════════════════════════════════════════════════════════

  _bindEvents() {
    const { form, input, fgColor, bgColor, downloadBtn } = this._els;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this._generate();
    });

    // Clear validation error as soon as the user starts typing again
    input.addEventListener('input', () => this._clearError());

    // Keep the colour swatch + hex label in sync with the native picker
    fgColor.addEventListener('input', () =>
      this._syncColor(fgColor, this._els.fgSwatch, this._els.fgHex)
    );
    bgColor.addEventListener('input', () =>
      this._syncColor(bgColor, this._els.bgSwatch, this._els.bgHex)
    );

    downloadBtn.addEventListener('click', () => this._download());
  }


  // ═══════════════════════════════════════════════════════════════
  //  Colour Picker Sync
  // ═══════════════════════════════════════════════════════════════

  /**
   * Mirrors the native <input type="color"> value into the
   * visible swatch background and the hex text label.
   *
   * @param {HTMLInputElement} input  - The native colour input
   * @param {HTMLElement}      swatch - The coloured square preview
   * @param {HTMLElement}      hexEl  - The hex string label
   */
  _syncColor(input, swatch, hexEl) {
    const hex = input.value.toUpperCase();
    swatch.style.backgroundColor = hex;
    hexEl.textContent = hex;
  }


  // ═══════════════════════════════════════════════════════════════
  //  Validation
  // ═══════════════════════════════════════════════════════════════

  /**
   * Returns true if the input is valid; shows an inline error and
   * returns false otherwise. Keeps the form from ever calling the
   * generation logic with bad data.
   *
   * @returns {boolean}
   */
  _validate() {
    const text = this._els.input.value.trim();

    if (!text) {
      this._showError('Please enter a URL or text to generate a QR code.');
      return false;
    }

    // QR codes support a maximum of ~2953 characters in alphanumeric mode.
    // This is a safe upper-bound before the library throws.
    if (text.length > 2953) {
      this._showError(
        `Input is too long (${text.length.toLocaleString()} / 2,953 characters). Please shorten it.`
      );
      return false;
    }

    return true;
  }


  // ═══════════════════════════════════════════════════════════════
  //  Error UI
  // ═══════════════════════════════════════════════════════════════

  _showError(message) {
    const { input, inputError } = this._els;
    inputError.textContent = message;
    inputError.removeAttribute('hidden');
    input.setAttribute('aria-invalid', 'true');
    input.classList.add('form-group__input--invalid');
  }

  _clearError() {
    const { input, inputError } = this._els;
    inputError.textContent = '';
    inputError.setAttribute('hidden', '');
    input.removeAttribute('aria-invalid');
    input.classList.remove('form-group__input--invalid');
  }


  // ═══════════════════════════════════════════════════════════════
  //  Loading State
  // ═══════════════════════════════════════════════════════════════

  /**
   * Toggles the button's loading appearance and disables it to
   * prevent duplicate submissions.
   *
   * @param {boolean} isLoading
   */
  _setLoading(isLoading) {
    const { generateBtn, btnLabel } = this._els;
    generateBtn.disabled = isLoading;
    generateBtn.classList.toggle('btn--loading', isLoading);
    generateBtn.setAttribute('aria-busy', String(isLoading));
    btnLabel.textContent = isLoading ? 'Generating…' : 'Generate QR Code';
  }


  // ═══════════════════════════════════════════════════════════════
  //  QR Code Generation
  // ═══════════════════════════════════════════════════════════════

  /**
   * Validates input, enters a loading state, then delegates to
   * qrcode.js to render the QR code into the output container.
   *
   * Marked `async` so we can `await` a single microtask yield —
   * this lets the browser paint the loading spinner *before* the
   * synchronous QR computation blocks the main thread.
   */
  async _generate() {
    if (!this._validate()) {
      this._els.input.focus();
      return;
    }

    this._clearError();
    this._setLoading(true);

    // Yield to the browser so the spinner renders before the
    // synchronous QR computation begins.
    await new Promise((resolve) => setTimeout(resolve, 30));

    try {
      const {
        input, sizeSelect, fgColor, bgColor,
        errorLevel, qrOutput, qrPlaceholder, downloadBtn,
      } = this._els;

      const size = parseInt(sizeSelect.value, 10);

      // qrcode.js appends to the container rather than replacing it,
      // so we must clear any previous render first.
      qrOutput.innerHTML = '';

      this._qrInstance = new QRCode(qrOutput, {
        text:         input.value.trim(),
        width:        size,
        height:       size,
        colorDark:    fgColor.value,
        colorLight:   bgColor.value,
        correctLevel: QRCode.CorrectLevel[errorLevel.value],
      });

      // Swap placeholder → generated output
      qrPlaceholder.setAttribute('hidden', '');
      qrOutput.removeAttribute('hidden');

      // Enable download now that there's something to save
      downloadBtn.disabled = false;

      // Move focus to the result so screen readers announce it
      qrOutput.focus();

    } catch (err) {
      this._showError(
        'Could not generate the QR code. The input may contain unsupported characters.'
      );
      console.error('[QRCodeApp] Generation error:', err);
    } finally {
      this._setLoading(false);
    }
  }


  // ═══════════════════════════════════════════════════════════════
  //  Download
  // ═══════════════════════════════════════════════════════════════

  /**
   * Exports the generated QR code as a PNG file.
   *
   * qrcode.js renders to a <canvas> in modern browsers. We read
   * its pixel data with toDataURL() and trigger a download without
   * any server round-trip.
   */
  _download() {
    const canvas = this._els.qrOutput.querySelector('canvas');

    if (canvas) {
      this._triggerDownload(canvas.toDataURL('image/png'));
      return;
    }

    // Fallback: some environments render an <img> instead of a canvas
    const img = this._els.qrOutput.querySelector('img');
    if (img) this._triggerDownload(img.src);
  }

  /**
   * Creates a temporary <a> element, sets the download attribute,
   * and programmatically clicks it to save the file.
   *
   * @param {string} dataUrl - A data: or blob: URL
   */
  _triggerDownload(dataUrl) {
    const slug = this._els.input.value
      .trim()
      .substring(0, 40)
      .replace(/[^a-z0-9]/gi, '-')
      .replace(/-{2,}/g, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase();

    const filename = `qr-${slug || 'code'}.png`;

    const anchor = document.createElement('a');
    anchor.href     = dataUrl;
    anchor.download = filename;
    anchor.click();
  }
}


// ═══════════════════════════════════════════════════════════════
//  Bootstrap
// ═══════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
  // Guard against the CDN script failing to load
  if (typeof QRCode === 'undefined') {
    console.error(
      '[QRCodeApp] The qrcode.js library did not load. ' +
      'Check the <script> CDN tag in index.html and your internet connection.'
    );
    return;
  }

  new QRCodeApp();
});
