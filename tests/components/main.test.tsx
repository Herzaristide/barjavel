import { act } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

const registerServiceWorker = vi.hoisted(() => vi.fn())
vi.mock("../../app/lib/pwa", () => ({ registerServiceWorker }))
vi.mock("../../app/lib/mermaid", () => ({ renderMermaid: () => Promise.resolve("") }))
vi.mock("../../app/styles.css", () => ({}))

describe("point d'entrée", () => {
  it("applique la config, monte l'application et enregistre le service worker", async () => {
    document.body.innerHTML = '<div id="root"></div>'
    await act(async () => {
      await import("../../app/main")
    })
    expect(document.title).toBe("Doc de test")
    expect(document.querySelector("#root article")).toBeTruthy()
    expect(registerServiceWorker).toHaveBeenCalled()
  })
})
