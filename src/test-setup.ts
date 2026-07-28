import "@testing-library/jest-dom";

// jsdom ships no ResizeObserver; the preview uses one to re-apply the reading
// position while late-loading images grow the document.
if (!("ResizeObserver" in globalThis)) {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
}
