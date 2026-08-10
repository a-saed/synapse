import "@testing-library/jest-dom/vitest";

// @xyflow/react measures node dimensions via ResizeObserver, which jsdom
// does not implement.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
// @ts-expect-error -- jsdom has no ResizeObserver
globalThis.ResizeObserver = ResizeObserverStub;
