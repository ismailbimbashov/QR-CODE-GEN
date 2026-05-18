/**
 * ui-handler.js  |  DOM manipulation and event binding
 *
 * Owns everything that touches the DOM: element caching, event
 * listeners, UI state (loading, errors, placeholder ↔ output swap).
 *
 * Receives a QRService instance via constructor injection so it
 * remains decoupled from the generation library — the two classes
 * can be swapped or tested independently.
 */

import { buildFilename, triggerDownload } from './utils.js';

export class UIHandler {

  /**
   * @param {import('./qr-service.js').QRService} qrService
   */
  constructor(qrService) {
    this._service = qrService;

    // ── Cache DOM references ──────────────────────────────────
    // Grouped into a single object: one place to update if IDs change.
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

    this._bindEvents();

    // Sync swatch colours with the default input values on load
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

    // Clear inline error the moment the user starts correcting their input
    input.addEventListener('input', () => this._clearError());

    fgColor.addEventListener('input', () =>
      this._syncColor(fgColor, this._els.fgSwatch, this._els.fgHex)
    );
    bgColor.addEventListener('input', () =>
      this._syncColor(bgColor, this._els.bgSwatch, this._els.bgHex)
    );

    downloadBtn.addEventListener('click', () => this._download());
  }


  // ═══════════════════════════════════════════════════════════════
  //  Color Picker Sync
  // ═══════════════════════════════════════════════════════════════

  /**
   * Mirrors the native color input's value into the visible swatch
   * background and the monospaced hex label.
   *
   * @param {HTMLInputElement} input
   * @param {HTMLElement}      swatch
   * @param {HTMLElement}      hexEl
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
   * @returns {boolean} true if input is valid; false after showing an error
   */
  _validate() {
    const text = this._els.input.value.trim();

    if (!text) {
      this._showError('Please enter a URL or text to generate a QR code.');
      return false;
    }

    // 2953 chars is the maximum QR data capacity in byte mode at Low correction.
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
   * Disables the submit button and shows the spinner while the
   * (synchronous but potentially slow) QR computation runs.
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
  //  QR Generation
  // ═══════════════════════════════════════════════════════════════

  /**
   * Validates input, enters loading state, delegates to QRService,
   * then updates the UI to show the result.
   *
   * `async` + the setTimeout yield lets the browser paint the
   * loading spinner before the synchronous QR computation blocks
   * the main thread.
   */
  async _generate() {
    if (!this._validate()) {
      this._els.input.focus();
      return;
    }

    this._clearError();
    this._setLoading(true);

    // One paint frame before the CPU-intensive QR work begins
    await new Promise((resolve) => setTimeout(resolve, 30));

    try {
      const { input, sizeSelect, fgColor, bgColor, errorLevel,
              qrOutput, qrPlaceholder, downloadBtn } = this._els;

      this._service.generate(qrOutput, {
        text:       input.value.trim(),
        size:       parseInt(sizeSelect.value, 10),
        colorDark:  fgColor.value,
        colorLight: bgColor.value,
        errorLevel: errorLevel.value,
      });

      // Swap placeholder → generated output
      qrPlaceholder.setAttribute('hidden', '');
      qrOutput.removeAttribute('hidden');
      downloadBtn.disabled = false;

      // Move focus to the result for screen-reader announcement
      qrOutput.focus();

    } catch (err) {
      this._showError(
        'Could not generate the QR code. The input may contain unsupported characters.'
      );
      console.error('[UIHandler] Generation error:', err);
    } finally {
      this._setLoading(false);
    }
  }


  // ═══════════════════════════════════════════════════════════════
  //  Download
  // ═══════════════════════════════════════════════════════════════

  /**
   * Reads pixel data from the canvas rendered by qrcode.js and
   * triggers a client-side PNG download — no server round-trip.
   */
  _download() {
    const { qrOutput, input } = this._els;
    const canvas = qrOutput.querySelector('canvas');

    if (canvas) {
      triggerDownload(canvas.toDataURL('image/png'), buildFilename(input.value));
      return;
    }

    // qrcode.js may fall back to an <img> in some environments
    const img = qrOutput.querySelector('img');
    if (img) {
      triggerDownload(img.src, buildFilename(input.value));
    }
  }
}
