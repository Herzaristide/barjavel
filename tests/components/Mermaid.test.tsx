import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { setTheme } from "../../app/lib/theme"

const renderMermaid = vi.hoisted(() => vi.fn())
vi.mock("../../app/lib/mermaid", () => ({ renderMermaid }))

const { Mermaid } = await import("../../app/components/Mermaid")

describe("Mermaid", () => {
  it("affiche le SVG rendu et ouvre la vue agrandie", async () => {
    renderMermaid.mockResolvedValue('<svg data-testid="diag"></svg>')
    render(<Mermaid code="graph TD; A-->B" />)

    const btn = screen.getByRole("button", { name: "Agrandir le diagramme" }) as HTMLButtonElement
    expect(btn.disabled).toBe(true)
    await waitFor(() => expect(btn.disabled).toBe(false))
    expect(renderMermaid).toHaveBeenCalledWith("graph TD; A-->B", "light")

    fireEvent.click(btn)
    expect(screen.getByRole("dialog")).toBeTruthy()
    fireEvent.click(screen.getByRole("button", { name: "Fermer" }))
    expect(screen.queryByRole("dialog")).toBeNull()
  })

  it("re-rend le diagramme quand le thème change", async () => {
    renderMermaid.mockResolvedValue("<svg></svg>")
    render(<Mermaid code="a" />)
    await waitFor(() => expect(renderMermaid).toHaveBeenCalledTimes(1))
    act(() => setTheme("dark"))
    await waitFor(() => expect(renderMermaid).toHaveBeenLastCalledWith("a", "dark"))
  })

  it("affiche le code source en cas d'erreur", async () => {
    renderMermaid.mockRejectedValue(new Error("syntaxe"))
    const { container } = render(<Mermaid code="pas un diagramme" />)
    await waitFor(() =>
      expect(container.querySelector("pre code")?.textContent).toBe("pas un diagramme"),
    )
  })

  it("accepte une erreur qui n'est pas un objet Error", async () => {
    renderMermaid.mockRejectedValue("échec brut")
    const { container } = render(<Mermaid code="x" />)
    await waitFor(() => expect(container.querySelector("pre")).toBeTruthy())
  })

  it("ignore un résultat arrivé après le démontage", async () => {
    let resolve!: (svg: string) => void
    renderMermaid.mockReturnValue(new Promise<string>((r) => (resolve = r)))
    const { unmount } = render(<Mermaid code="x" />)
    unmount()
    await act(async () => resolve("<svg></svg>"))

    let reject!: (e: Error) => void
    renderMermaid.mockReturnValue(new Promise<string>((_, r) => (reject = r)))
    const second = render(<Mermaid code="y" />)
    second.unmount()
    await act(async () => reject(new Error("tard")))
  })

  it("n'ouvre pas la vue agrandie tant que le SVG n'est pas prêt", () => {
    renderMermaid.mockReturnValue(new Promise(() => {}))
    render(<Mermaid code="x" />)
    const btn = screen.getByRole("button", { name: "Agrandir le diagramme" })
    btn.removeAttribute("disabled")
    fireEvent.click(btn)
    expect(screen.queryByRole("dialog")).toBeNull()
  })
})
