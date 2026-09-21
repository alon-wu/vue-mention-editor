import { vi } from "vitest";

/**
 * jsdom 缺少的浏览器 API。
 * Tiptap / ProseMirror / Floating UI 在挂载与定位时会用到它们。
 */

class ObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}

globalThis.ResizeObserver =
  globalThis.ResizeObserver ?? (ObserverStub as unknown as typeof ResizeObserver);
globalThis.IntersectionObserver =
  globalThis.IntersectionObserver ?? (ObserverStub as unknown as typeof IntersectionObserver);

Element.prototype.scrollIntoView = Element.prototype.scrollIntoView ?? vi.fn();
Element.prototype.scrollTo = Element.prototype.scrollTo ?? vi.fn();

if (!Range.prototype.getBoundingClientRect) {
  Range.prototype.getBoundingClientRect = () => new DOMRect(0, 0, 0, 0);
}

if (!Range.prototype.getClientRects) {
  Range.prototype.getClientRects = () => [] as unknown as DOMRectList;
}

if (!window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

if (navigator.clipboard === undefined) {
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
  });
}

/**
 * jsdom 在空选区上调用 collapse* 会抛 InvalidStateError，
 * 而浏览器中是空操作（tiptap mention 的内置 command 会调用它）。
 */
const selectionPrototype = window.Selection?.prototype;
if (selectionPrototype) {
  for (const method of ["collapse", "collapseToEnd", "collapseToStart"] as const) {
    const original = selectionPrototype[method] as (...args: unknown[]) => void;
    selectionPrototype[method] = function patched(this: Selection, ...args: unknown[]) {
      if (this.rangeCount === 0) return;
      original.apply(this, args);
    } as never;
  }
}
