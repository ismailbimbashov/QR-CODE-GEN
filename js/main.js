/**
 * main.js  |  Application entry point
 *
 * This file has one job: instantiate the service and the UI handler,
 * then wire them together via dependency injection. No DOM manipulation
 * and no business logic lives here — those concerns belong to their
 * respective modules.
 *
 * Dependency injection pattern:
 *   QRService is created first and passed into UIHandler.
 *   UIHandler calls service.generate(...) but never imports QRService
 *   directly — the coupling flows through this file only, making it
 *   trivial to swap QRService for a different implementation later.
 */

import { QRService  } from './qr-service.js';
import { UIHandler  } from './ui-handler.js';

document.addEventListener('DOMContentLoaded', () => {
  // Guard against the CDN script failing to load before our module runs
  if (typeof QRCode === 'undefined') {
    console.error(
      '[QRGen] qrcode.js did not load. ' +
      'Check the CDN <script> tag in index.html and your network connection.'
    );
    return;
  }

  const qrService = new QRService();
  new UIHandler(qrService);
});
