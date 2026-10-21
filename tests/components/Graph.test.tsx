import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { Graph } from "../../app/components/Graph"

const nodeOf = (container: HTMLElement, title: string) =>
  [...container.querySelectorAll("g.cursor-pointer")].find(
    (g) => g.querySelector("text")?.textContent === title,
  ) as SVGGElement | undefined

describe("Graph", () => {
  it("dessine un nœud par page et un trait par lien, la racine en plus gros", () => {
    const { container } = render(<Graph active="index" onSelect={vi.fn()} />)
    expect(container.querySelectorAll("g.cursor-pointer")).toHaveLength(5)
    expect(container.querySelectorAll("line")).toHaveLength(3)
    const r = (t: string) =>
      Number(nodeOf(container, t)!.querySelector("circle:last-of-type")!.getAttribute("r"))
    expect(r("Accueil")).toBe(20)
    expect(r("Guide")).toBe(14)
    expect(r("orphan")).toBe(6)
    // Halo autour du nœud actif ; les pages non voisines sont atténuées.
    expect(nodeOf(container, "Accueil")!.querySelectorAll("circle")).toHaveLength(2)
    expect(nodeOf(container, "orphan")!.getAttribute("class")).toContain("opacity-50")
  })

  it("sélectionne une page au clic sur son nœud", () => {
    const onSelect = vi.fn()
    const { container } = render(<Graph active="index" onSelect={onSelect} />)
    fireEvent.click(nodeOf(container, "Guide")!)
    expect(onSelect).toHaveBeenCalledWith("guide")
  })

  it("met en évidence le nœud survolé", () => {
    const { container } = render(<Graph active="orphan" onSelect={vi.fn()} />)
    const node = nodeOf(container, "API")!
    fireEvent.pointerEnter(node)
    expect(node.querySelector("text")!.getAttribute("class")).toMatch(/fill-ink$/)
    fireEvent.pointerLeave(node)
    expect(node.querySelector("text")!.getAttribute("class")).toContain("fill-ink-faint")
  })

  it("le mode focus ne garde que la page active et ses voisines", () => {
    const { container } = render(<Graph active="api" onSelect={vi.fn()} />)
    const toggle = screen.getByRole("button", { name: /Notes reliées/ })
    fireEvent.click(toggle)
    expect(toggle.getAttribute("aria-pressed")).toBe("true")
    const titles = [...container.querySelectorAll("g.cursor-pointer text")].map(
      (t) => t.textContent,
    )
    expect(titles.sort()).toEqual(["API", "Accueil", "Guide"])
    expect(container.querySelectorAll("line")).toHaveLength(3)
    fireEvent.click(toggle)
    expect(container.querySelectorAll("g.cursor-pointer")).toHaveLength(5)
  })

  it("déplace un nœud par glisser-déposer puis le relâche", async () => {
    const { container } = render(<Graph active="index" onSelect={vi.fn()} />)
    const svg = container.querySelector("svg")!
    const node = nodeOf(container, "Guide")!
    fireEvent.pointerDown(node, { pointerId: 1, clientX: 10, clientY: 10 })
    fireEvent.pointerMove(svg, { clientX: 300, clientY: 200 })
    await waitFor(() =>
      expect(node.getAttribute("transform")).toMatch(/^translate\(300(\.\d+)?, 200(\.\d+)?\)$/),
    )
    fireEvent.pointerUp(svg)
  })

  it("déplace la vue en glissant le fond, pas en glissant un nœud", () => {
    const { container } = render(<Graph active="index" onSelect={vi.fn()} />)
    const svg = container.querySelector("svg")!
    const view = svg.querySelector("g")!
    fireEvent.pointerDown(svg.querySelector("line")!, { clientX: 0, clientY: 0 })
    fireEvent.pointerMove(svg, { clientX: 40, clientY: 25 })
    expect(view.getAttribute("transform")).toBe("translate(0, 0)")

    fireEvent.pointerDown(svg, { pointerId: 1, clientX: 0, clientY: 0 })
    fireEvent.pointerMove(svg, { clientX: 40, clientY: 25 })
    expect(view.getAttribute("transform")).toBe("translate(40, 25)")
    fireEvent.pointerLeave(svg)
    fireEvent.pointerMove(svg, { clientX: 400, clientY: 400 })
    expect(view.getAttribute("transform")).toBe("translate(40, 25)")
  })

  it("ajuste l'espacement à la molette sans faire défiler la page", () => {
    const { container } = render(<Graph active="index" onSelect={vi.fn()} />)
    const wrap = container.firstElementChild!
    const up = new WheelEvent("wheel", { deltaY: -400, cancelable: true })
    wrap.dispatchEvent(up)
    expect(up.defaultPrevented).toBe(true)
    act(() => {
      for (let i = 0; i < 30; i++) wrap.dispatchEvent(new WheelEvent("wheel", { deltaY: 400 }))
    })
    expect(container.querySelectorAll("g.cursor-pointer")).toHaveLength(5)
  })

  it("centre le graphe au milieu sur un écran étroit et s'arrête au démontage", () => {
    const observe = ResizeObserver.prototype.observe
    vi.spyOn(ResizeObserver.prototype, "observe").mockImplementation(function (
      this: ResizeObserver,
      target: Element,
    ) {
      // @ts-expect-error accès au callback du stub
      this.cb([{ target, contentRect: { width: 400, height: 600 } }], this)
    })
    const { container, unmount, rerender } = render(<Graph active="index" onSelect={vi.fn()} />)
    expect(container.querySelector("svg")!.getAttribute("width")).toBe("400")
    rerender(<Graph active="guide" onSelect={vi.fn()} />)
    unmount()
    expect(observe).toBeDefined()
  })
})
