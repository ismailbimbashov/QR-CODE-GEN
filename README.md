<div align="center">

# QRGen — QR Code Generator

**A clean, fast, production-grade QR code generator built with pure Vanilla JavaScript.**  
No frameworks. No build steps. Just open `index.html` and go.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Visit%20Site-4f46e5?style=for-the-badge&logo=github)](https://ismailbimbashov.github.io/QR-CODE-GEN/)
[![License: MIT](https://img.shields.io/badge/License-MIT-22c55e?style=for-the-badge)](LICENSE)
[![Vanilla JS](https://img.shields.io/badge/Vanilla-JavaScript-f0db4f?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![CSS Modules](https://img.shields.io/badge/CSS-BEM%20%2B%20Custom%20Properties-264de4?style=for-the-badge&logo=css3)](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)

</div>

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [How It Works](#how-it-works)
  - [JavaScript Architecture](#javascript-architecture)
  - [CSS Architecture](#css-architecture)
- [Accessibility](#accessibility)
- [Browser Support](#browser-support)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

QRGen turns any URL, plain text, or data string into a scannable QR code — instantly, in the browser, with no data ever leaving your device. It was built as a demonstration of how far you can push **maintainable, production-quality code** without reaching for a framework.

The entire codebase follows a strict separation of concerns: JavaScript is split into focused ES6 modules, and CSS is divided across four purpose-specific files using **BEM naming** and **CSS Custom Properties** as a design-token system. Every decision was made with long-term readability and extensibility in mind.

---

## Features

| Feature | Details |
|---|---|
| **Instant generation** | QR code renders in the browser — zero server round-trips |
| **Custom colours** | Independent foreground and background colour pickers with a live hex preview |
| **Three output sizes** | 128 px (small), 256 px (medium), 512 px (large) |
| **Error correction levels** | Low (7%), Medium (15%), Quartile (25%), High (30%) |
| **One-click PNG download** | Reads directly from the `<canvas>` — full resolution at any size |
| **Loading state** | Button spinner + disabled state prevent double-submissions |
| **Inline validation** | Friendly error messages with ARIA live region announcements |
| **Fully accessible** | Keyboard-navigable, screen-reader friendly, focus-visible rings |
| **Responsive** | Mobile-first two-panel layout, works from 320 px up |
| **Zero dependencies** | No npm, no bundler, no framework — just open the file |

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Markup** | Semantic HTML5 |
| **Styles** | Vanilla CSS — BEM naming, CSS Custom Properties, Flexbox & Grid |
| **Logic** | Vanilla JavaScript — ES6 Modules, Classes |
| **QR library** | [qrcode.js](https://github.com/davidshimjs/qrcodejs) by davidshimjs (via cdnjs CDN) |
| **Font** | [Inter](https://fonts.google.com/specimen/Inter) via Google Fonts |

> **Why qrcode.js?**  
> It renders directly to a `<canvas>` element, which means downloading the QR as a PNG is a single `canvas.toDataURL()` call — no canvas-to-image conversion library required.

---

## Project Structure

```
QR-CODE-GEN/
│
├── index.html              ← App shell — semantic HTML, zero inline logic
│
├── css/
│   ├── main.css            ← Entry point — @import only, sets load order
│   ├── variables.css       ← Design tokens (colours, spacing, radii, shadows)
│   ├── layout.css          ← Reset, base styles, header, hero, app-card, footer
│   └── components.css      ← Form, colour picker, tooltip, buttons, QR preview
│
├── js/
│   ├── main.js             ← Entry point — wires service ↔ handler, nothing else
│   ├── qr-service.js       ← QR library wrapper (zero DOM knowledge)
│   ├── ui-handler.js       ← All DOM access, events, and UI state
│   └── utils.js            ← Pure helper functions (filename builder, download trigger)
│
└── img/
    └── qr.png              ← Favicon
```

---

## Getting Started

QRGen requires **no build step and no package manager**. Because it uses ES6 Modules (`type="module"`), it must be served over HTTP — it will not work if you double-click `index.html` directly due to browser CORS restrictions on `file://` origins.

### Option 1 — VS Code Live Server (recommended)

1. Install the [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension
2. Right-click `index.html` → **Open with Live Server**

### Option 2 — Python (built-in, no install)

```bash
# Python 3
python3 -m http.server 8080

# Then open http://localhost:8080
```

### Option 3 — Node.js `serve`

```bash
npx serve .
```

### Option 4 — GitHub Pages (live demo)

The `main` branch is deployed to GitHub Pages. Visit the live site using the badge at the top of this file.

---

## How It Works

### JavaScript Architecture

The JS side is split into four ES6 modules that communicate through dependency injection, keeping every module independently testable and replaceable.

```
main.js
  ├── imports QRService   from ./qr-service.js
  ├── imports UIHandler   from ./ui-handler.js
  └── passes QRService into UIHandler constructor

ui-handler.js
  └── imports { buildFilename, triggerDownload } from ./utils.js
      (receives QRService via constructor — does NOT import it directly)

qr-service.js   ← no imports (reads the global QRCode from the CDN script)
utils.js        ← no imports (pure functions, zero side effects)
```

**Why dependency injection instead of direct imports?**

`UIHandler` calls `this._service.generate(...)` against whatever object it receives — it never cares which library powers it. This means you could swap `qrcode.js` for a completely different QR library by touching only two files (`qr-service.js` and `main.js`) while `ui-handler.js` stays unchanged.

**Why `async _generate()`?**

The qrcode.js computation is synchronous and runs on the main thread. Marking the method `async` and inserting a single `await new Promise(resolve => setTimeout(resolve, 30))` yields one frame to the browser, guaranteeing the loading spinner is painted *before* the CPU-intensive work begins — otherwise the UI would appear frozen.

#### Module responsibilities at a glance

| File | Responsibility | Knows about DOM? |
|---|---|---|
| `main.js` | Bootstrap, wiring | No |
| `qr-service.js` | QR library calls | Receives element, doesn't query |
| `ui-handler.js` | Events, state, rendering | Yes — exclusively |
| `utils.js` | Filename, download trigger | Minimal (creates one temp `<a>`) |

---

### CSS Architecture

CSS is split into four files with a strict loading order enforced by `@import` in `main.css`:

```css
/* main.css */
@import './variables.css';   /* must be first — defines all tokens */
@import './layout.css';      /* uses tokens from variables.css */
@import './components.css';  /* uses tokens from variables.css */
```

**`variables.css`** — The single source of truth for the visual design. Every colour, spacing step, radius, shadow, and easing value lives here as a CSS Custom Property. Rebranding the entire app is a change in this one file.

```css
/* Example: swap the brand colour and everything updates */
:root {
  --clr-primary: #4f46e5;  /* ← change this one line */
}
```

**`layout.css`** — Handles the macro-level page structure: CSS reset, base element styles, `.container`, `.site-header`, `.hero`, the `.app-card` two-column CSS Grid, and `.site-footer`. Nothing component-specific lives here.

**`components.css`** — Self-contained component styles: the form, the custom colour picker, tooltip, buttons, and the QR preview area. Each component block is labelled and can be read independently.

**BEM naming convention** — Every class follows `block__element--modifier`:

```css
.form-group               /* block */
.form-group__label        /* element */
.form-group__input        /* element */
.form-group__input--invalid  /* element + modifier */
```

This means styles are naturally scoped and safe to move between files without side-effects.

---

## Accessibility

QRGen was built with accessibility as a first-class requirement, not an afterthought.

- **Semantic HTML** — `<header>`, `<main>`, `<section>`, `<footer>` with `role` attributes where needed
- **Label associations** — Every `<input>` and `<select>` has a proper `<label>` (implicit or explicit via `for`)
- **ARIA live region** — The error message paragraph uses `role="alert" aria-live="assertive"` so screen readers announce validation errors without a page reload
- **`aria-busy`** — Set on the generate button during loading so assistive technology knows a process is running
- **`aria-invalid`** — Applied to the text input when validation fails
- **Focus management** — After generation, `qrOutput.focus()` moves the screen-reader cursor to the result
- **`tabindex="-1"`** on the output container — Allows programmatic focus without adding it to the tab order
- **`:focus-visible`** — Focus rings appear only for keyboard navigation (not mouse clicks), keeping the UI clean for pointer users without hiding them from keyboard users
- **`prefers-reduced-motion`** — All animations are suppressed for users who have requested reduced motion in their OS settings
- **Colour contrast** — All text meets WCAG AA contrast ratios against their backgrounds
- **44 px touch targets** — Buttons and interactive controls have `min-height: 2.75rem` (44 px) per WCAG 2.5.5

---

## Browser Support

| Browser | Support |
|---|---|
| Chrome / Edge 89+ | ✅ Full support |
| Firefox 89+ | ✅ Full support |
| Safari 15.4+ | ✅ Full support |
| Chrome Android | ✅ Full support |
| Samsung Internet 14+ | ✅ Full support |

**Requirements:** ES6 Modules (`import`/`export`), `<input type="color">`, CSS Custom Properties, CSS Grid. All have been baseline-supported across major browsers since 2020.

> **Note on `file://` protocol:** ES6 Modules are blocked by browser CORS policy when loaded from the local filesystem. Use any of the local server options in [Getting Started](#getting-started).

---

## Contributing

Contributions are welcome. Please follow the existing conventions:

1. **Fork** the repository and create a feature branch
2. **JavaScript** — add logic to the appropriate module; don't mix concerns across files
3. **CSS** — follow BEM naming; new tokens go in `variables.css`, new layout rules in `layout.css`, new component styles in `components.css`
4. **No build tools** — keep the zero-dependency, zero-build-step constraint
5. **Open a pull request** with a clear description of what changed and why

---

## License

This project is licensed under the [MIT License](LICENSE).  
© 2025 Ismail Bimbashov

---

<div align="center">
  <sub>Built with vanilla JS · Powered by <a href="https://github.com/davidshimjs/qrcodejs">qrcode.js</a></sub>
</div>
