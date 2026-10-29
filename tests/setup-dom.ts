import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>', {
  url: 'https://example.com/',
});

const { window } = dom;

Object.defineProperty(globalThis, 'window', {
  value: window,
  configurable: true,
  writable: true,
});

Object.defineProperty(globalThis, 'document', {
  value: window.document,
  configurable: true,
  writable: true,
});

Object.defineProperty(globalThis, 'location', {
  value: window.location,
  configurable: true,
  writable: true,
});

Object.defineProperty(globalThis, 'navigator', {
  value: window.navigator,
  configurable: true,
  writable: true,
});

const windowKeys = [
  'Node',
  'DocumentFragment',
  'Element',
  'HTMLElement',
  'HTMLInputElement',
  'Event',
  'CustomEvent',
  'KeyboardEvent',
  'MouseEvent',
  'FocusEvent',
  'MutationObserver',
  'NodeFilter',
  'getComputedStyle',
  'URL',
  'URLSearchParams',
  'Request',
  'Response',
  'Headers',
] as const;

// Radix checks `instanceof HTMLFormElement` and friends, so expose every element class.
const elementKeys = Object.getOwnPropertyNames(window).filter(key => /^(HTML|SVG)\w*Element$/.test(key));

for (const key of [...windowKeys, ...elementKeys]) {
  if (!(key in globalThis)) {
    Object.defineProperty(globalThis, key, {
      value: window[key],
      configurable: true,
      writable: true,
    });
  }
}

// Bun ships its own CustomEvent, but jsdom only dispatches its own. Radix's
// focus scope builds one from the global, so the jsdom class has to win.
Object.defineProperty(globalThis, 'CustomEvent', {
  value: window.CustomEvent,
  configurable: true,
  writable: true,
});

if (!globalThis.requestAnimationFrame) {
  globalThis.requestAnimationFrame = (callback: FrameRequestCallback) => {
    return setTimeout(() => callback(Date.now()), 0) as unknown as number;
  };
}

if (!globalThis.cancelAnimationFrame) {
  globalThis.cancelAnimationFrame = (id: number) => {
    clearTimeout(id);
  };
}

// React's legacy input polyfill may probe these IE-era APIs in jsdom paths.
if (!(window.HTMLElement.prototype as { attachEvent?: unknown }).attachEvent) {
  Object.defineProperty(window.HTMLElement.prototype, 'attachEvent', {
    value: () => {},
    configurable: true,
  });
}

if (!(window.HTMLElement.prototype as { detachEvent?: unknown }).detachEvent) {
  Object.defineProperty(window.HTMLElement.prototype, 'detachEvent', {
    value: () => {},
    configurable: true,
  });
}
