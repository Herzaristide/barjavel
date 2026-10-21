import { act } from "@testing-library/react"
import type { Root } from "react-dom/client"
import { afterAll, describe, expect, it, vi } from "vitest"

const registerServiceWorker = vi.hoisted(() => vi.fn())
vi.mock("../../app/lib/pwa", () => ({ registerServiceWorker }))
vi.mock("../../app/lib/mermaid", () => ({ renderMermaid: () => Promise.resolve("") }))
vi.mock("../../app/styles.css", () => ({}))

// main.tsx monte l'application sans exposer sa racine : on la capture pour
// la démonter en fin de test (sinon la simulation du graphe continue de
// rendre après la destruction de jsdom).
const roots = vi.hoisted(() => [] as Root[])
vi.mock("react-dom/client", async (importOriginal) => {
  const mod = await importOriginal<typeof import("react-dom/client")>()
  return {
    ...mod,
    createRoot: (...args: Parameters<typeof mod.createRoot>) => {
      const root = mod.createRoot(...args)
      roots.push(root)
      return root
    },
  }
})

afterAll(() => {
  act(() => {
    for (const root of roots) root.unmount()
  })
})

describe("point d'entrée", () => {
  it("applique la config, monte l'application et enregistre le service worker", async () => {
    document.body.innerHTML = '<div id="root"></div>'
    await act(async () => {
      await import("../../app/main")
    })
    expect(document.title).toBe("Doc de test")
    expect(document.querySelector("#root article")).toBeTruthy()
    expect(registerServiceWorker).toHaveBeenCalled()
    expect(roots).toHaveLength(1)
  })
})
