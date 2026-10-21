import { act, fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

vi.mock("../../app/lib/mermaid", () => ({
  renderMermaid: vi.fn(() => Promise.resolve("<svg></svg>")),
}))

const { App } = await import("../../app/App")

const summary = () => document.querySelector("article header p")?.textContent

describe("App", () => {
  it("ouvre la page racine par défaut et affiche le pied de page configuré", () => {
    render(<App />)
    expect(summary()).toBe("Point d'entrée de la doc")
    expect(screen.getByText("Pied de page")).toBeTruthy()
  })

  it("ouvre la page indiquée dans le hash, ou la racine si elle est inconnue", () => {
    window.location.hash = "#/guide"
    const first = render(<App />)
    expect(summary()).toBe("Prise en main pas à pas")
    first.unmount()

    window.location.hash = "#/nexiste-pas"
    render(<App />)
    expect(summary()).toBe("Point d'entrée de la doc")
  })

  it("suit les changements de hash", () => {
    render(<App />)
    act(() => {
      window.location.hash = "#guide"
      window.dispatchEvent(new HashChangeEvent("hashchange"))
    })
    expect(summary()).toBe("Prise en main pas à pas")
  })

  it("navigue via un lien interne et met à jour le hash", () => {
    render(<App />)
    fireEvent.click(screen.getByRole("link", { name: "guide" }))
    expect(window.location.hash).toBe("#/guide")
    expect(summary()).toBe("Prise en main pas à pas")
  })

  it("ignore une navigation vers une page inconnue", () => {
    window.location.hash = "#/orphan"
    render(<App />)
    fireEvent.click(screen.getByRole("link", { name: "Lien mort" }))
    expect(window.location.hash).toBe("#/orphan")
    expect(document.querySelector("article .k-label")?.textContent).toBe("default")
  })

  it("navigue au clic sur un nœud du graphe", () => {
    render(<App />)
    const node = [...document.querySelectorAll("g.cursor-pointer")].find(
      (g) => g.textContent === "API",
    )!
    fireEvent.click(node)
    expect(window.location.hash).toBe("#/api")
  })
})
