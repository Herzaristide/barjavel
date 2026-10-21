import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { DiagramModal } from "../../app/components/DiagramModal"

const SVG = '<svg width="200" height="100"></svg>'

function setup() {
  const onClose = vi.fn()
  // Dimensions simulées : jsdom ne fait pas de mise en page.
  vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(896)
  vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(496)
  vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue({
    width: 200,
    height: 100,
    left: 0,
    top: 0,
  } as DOMRect)
  const utils = render(<DiagramModal svg={SVG} onClose={onClose} />)
  const content = utils.container.querySelector<HTMLElement>(".will-change-transform")!
  const viewport = content.parentElement!
  return { onClose, content, viewport, ...utils }
}

const scaleOf = (el: HTMLElement) => Number(/scale\(([\d.]+)\)/.exec(el.style.transform)![1])

describe("DiagramModal", () => {
  it("ajuste le diagramme à l'écran à l'ouverture", () => {
    const { content } = setup()
    // min((896-96)/200, (496-96)/100, 3) = 3
    expect(content.style.transform).toBe("translate(148px, 98px) scale(3)")
    expect(content.innerHTML).toBe(SVG)
  })

  it("zoome et dézoome avec les boutons et le clavier, dans les bornes", () => {
    const { content } = setup()
    fireEvent.click(screen.getByRole("button", { name: "Zoomer" }))
    expect(scaleOf(content)).toBeCloseTo(3.75)
    fireEvent.click(screen.getByRole("button", { name: "Dézoomer" }))
    expect(scaleOf(content)).toBeCloseTo(3)
    fireEvent.keyDown(window, { key: "+" })
    fireEvent.keyDown(window, { key: "=" })
    expect(scaleOf(content)).toBeCloseTo(4.6875)
    fireEvent.keyDown(window, { key: "-" })
    expect(scaleOf(content)).toBeCloseTo(3.75)
    for (let i = 0; i < 20; i++) fireEvent.keyDown(window, { key: "+" })
    expect(scaleOf(content)).toBe(8)
  })

  it("réajuste avec le bouton « Ajuster » et la touche 0", () => {
    const { content } = setup()
    fireEvent.click(screen.getByRole("button", { name: "Zoomer" }))
    fireEvent.click(screen.getByRole("button", { name: "Ajuster" }))
    expect(content.style.transform).toContain("scale(3)")
    fireEvent.click(screen.getByRole("button", { name: "Zoomer" }))
    fireEvent.keyDown(window, { key: "0" })
    expect(content.style.transform).toContain("scale(3)")
  })

  it("zoome à la molette autour du curseur", () => {
    const { content, viewport } = setup()
    fireEvent.wheel(viewport, { deltaY: 500, clientX: 10, clientY: 10 })
    expect(scaleOf(content)).toBeLessThan(3)
  })

  it("déplace la vue en glissant", () => {
    const { content, viewport } = setup()
    fireEvent.pointerMove(viewport, { clientX: 50, clientY: 50 })
    expect(content.style.transform).toContain("translate(148px, 98px)")
    fireEvent.pointerDown(viewport, { clientX: 0, clientY: 0, pointerId: 1 })
    fireEvent.pointerMove(viewport, { clientX: 20, clientY: 30 })
    expect(content.style.transform).toContain("translate(168px, 128px)")
    fireEvent.pointerUp(viewport)
    fireEvent.pointerMove(viewport, { clientX: 100, clientY: 100 })
    expect(content.style.transform).toContain("translate(168px, 128px)")
  })

  it("se ferme avec Échap, le bouton ✕ ou un clic sur le fond", () => {
    const { onClose } = setup()
    fireEvent.keyDown(window, { key: "Escape" })
    fireEvent.click(screen.getByRole("button", { name: "Fermer" }))
    fireEvent.pointerDown(screen.getByRole("dialog"))
    expect(onClose).toHaveBeenCalledTimes(3)
    fireEvent.pointerDown(screen.getByRole("button", { name: "Zoomer" }))
    expect(onClose).toHaveBeenCalledTimes(3)
  })

  it("bloque le défilement de la page tant qu'il est ouvert", () => {
    document.body.style.overflow = "auto"
    const { unmount } = setup()
    expect(document.body.style.overflow).toBe("hidden")
    unmount()
    expect(document.body.style.overflow).toBe("auto")
  })

  it("ne fait rien à l'ajustement si le contenu n'est pas un SVG", () => {
    const { container } = render(<DiagramModal svg="<p>vide</p>" onClose={vi.fn()} />)
    expect(container.querySelector<HTMLElement>(".will-change-transform")!.style.transform).toBe(
      "translate(0px, 0px) scale(1)",
    )
  })
})
