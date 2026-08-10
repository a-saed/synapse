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

// @radix-ui/react-select (and other Radix primitives using pointer capture
// for its popper positioning) call these on the trigger/content elements;
// jsdom implements neither, so calling them throws instead of no-op'ing.
if (!Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = () => false;
}
if (!Element.prototype.setPointerCapture) {
  Element.prototype.setPointerCapture = () => {};
}
if (!Element.prototype.releasePointerCapture) {
  Element.prototype.releasePointerCapture = () => {};
}
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}
