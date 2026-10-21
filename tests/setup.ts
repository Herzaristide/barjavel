import { afterEach } from "vitest"

// Les tests marqués `@vitest-environment node` (plugin, CLI, service worker)
// n'ont pas de DOM : rien à préparer pour eux.
if (typeof window !== "undefined") {
  const { cleanup } = await import("@testing-library/react")

  afterEach(() => {
    cleanup()
    document.documentElement.className = ""
    window.location.hash = ""
  })

  // API absentes de jsdom mais utilisées par les composants.
  class ResizeObserverStub {
    constructor(private readonly cb: ResizeObserverCallback) {}
    observe(target: Element) {
      this.cb(
        [{ target, contentRect: { width: 1024, height: 768 } } as unknown as ResizeObserverEntry],
        this as unknown as ResizeObserver,
      )
    }
    unobserve() {}
    disconnect() {}
  }
  globalThis.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver

  Element.prototype.setPointerCapture ??= () => {}
  Element.prototype.releasePointerCapture ??= () => {}
  Element.prototype.scrollTo ??= () => {}

  // jsdom n'implémente pas PointerEvent : sans lui, clientX/clientY sont perdus.
  if (typeof globalThis.PointerEvent === "undefined") {
    class PointerEventPolyfill extends MouseEvent {
      readonly pointerId: number
      constructor(type: string, init: PointerEventInit = {}) {
        super(type, init)
        this.pointerId = init.pointerId ?? 0
      }
    }
    globalThis.PointerEvent = PointerEventPolyfill as unknown as typeof PointerEvent
  }
}
