import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { getDoc } from "../../app/lib/content"

vi.mock("../../app/lib/mermaid", () => ({
  renderMermaid: vi.fn(() => Promise.resolve('<svg data-mermaid="ok"></svg>')),
}))

const { DocView } = await import("../../app/components/DocView")

describe("DocView", () => {
  it("affiche le groupe, le résumé et le corps markdown", () => {
    render(<DocView doc={getDoc("index")!} onNavigate={vi.fn()} />)
    expect(screen.getByText("intro")).toBeTruthy()
    expect(screen.getByText("Point d'entrée de la doc")).toBeTruthy()
    expect(screen.getByRole("heading", { name: "Bienvenue" })).toBeTruthy()
  })

  it("navigue en interne pour les liens #, ouvre les autres dans un nouvel onglet", () => {
    const onNavigate = vi.fn()
    render(<DocView doc={getDoc("index")!} onNavigate={onNavigate} />)
    fireEvent.click(screen.getByRole("link", { name: "guide" }))
    expect(onNavigate).toHaveBeenCalledWith("guide")

    const ext = screen.getByRole("link", { name: "site" })
    expect(ext.getAttribute("target")).toBe("_blank")
    expect(ext.getAttribute("rel")).toBe("noreferrer noopener")
  })

  it("rend les blocs de code avec bouton copier, et Mermaid à part", () => {
    const { container } = render(<DocView doc={getDoc("index")!} onNavigate={vi.fn()} />)
    expect(screen.getByRole("button", { name: "Copier le code" })).toBeTruthy()
    expect(container.querySelector("code.language-js")?.textContent).toContain("console.log")
    expect(screen.getByRole("button", { name: "Agrandir le diagramme" })).toBeTruthy()
  })

  it("liste les pages reliées dans les deux sens et y navigue", () => {
    const onNavigate = vi.fn()
    render(<DocView doc={getDoc("api")!} onNavigate={onNavigate} />)
    // api n'a pas de liens propres : index et guide pointent vers elle.
    const footer = screen.getByRole("contentinfo")
    const buttons = [...footer.querySelectorAll("button")].map((b) => b.textContent)
    expect(buttons.sort()).toEqual(["Accueil", "Guide"])
    fireEvent.click(screen.getByRole("button", { name: "Guide" }))
    expect(onNavigate).toHaveBeenCalledWith("guide")
  })

  it("n'affiche ni résumé ni pied de page pour une page isolée", () => {
    const { container } = render(<DocView doc={getDoc("orphan")!} onNavigate={vi.fn()} />)
    expect(container.querySelector("header p")).toBeNull()
    expect(container.querySelector("footer")).toBeNull()
  })

  it("ignore les liens relatifs vers des pages inconnues dans le pied de page", () => {
    // guide pointe vers « inconnu » et vers lui-même : ni l'un ni l'autre n'apparaît.
    render(<DocView doc={getDoc("guide")!} onNavigate={vi.fn()} />)
    const buttons = [...screen.getByRole("contentinfo").querySelectorAll("button")].map(
      (b) => b.textContent,
    )
    expect(buttons.sort()).toEqual(["API", "Accueil"])
  })

  it("gère un lien sans href", () => {
    const doc = { ...getDoc("orphan")!, body: "<a>rien</a> et [vide]()" }
    render(<DocView doc={doc} onNavigate={vi.fn()} />)
    expect(screen.getByText("vide").closest("a")!.getAttribute("href")).toBe("")
  })
})
