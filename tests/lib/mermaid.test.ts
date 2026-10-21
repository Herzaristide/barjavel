import { beforeEach, describe, expect, it, vi } from "vitest"

const initialize = vi.fn()
const render = vi.fn(async (id: string) => ({ svg: `<svg id="${id}"></svg>` }))
const loads = vi.hoisted(() => ({ count: 0 }))
vi.mock("mermaid", () => {
  loads.count++
  return { default: { initialize, render } }
})

const { renderMermaid } = await import("../../app/lib/mermaid")

describe("renderMermaid", () => {
  beforeEach(() => {
    initialize.mockClear()
    render.mockClear()
  })

  it("rend le SVG avec un identifiant unique à chaque appel", async () => {
    const a = await renderMermaid("graph TD; A-->B", "light")
    const b = await renderMermaid("graph TD; A-->B", "light")
    expect(a).toMatch(/^<svg id="mmd-\d+"><\/svg>$/)
    expect(a).not.toBe(b)
    expect(render).toHaveBeenCalledWith(expect.stringMatching(/^mmd-/), "graph TD; A-->B")
  })

  it("ne charge la bibliothèque qu'une seule fois", async () => {
    await renderMermaid("a", "light")
    await renderMermaid("b", "dark")
    expect(loads.count).toBe(1)
  })

  it("adapte les couleurs au thème et à l'accent configuré", async () => {
    await renderMermaid("a", "dark")
    const dark = initialize.mock.calls[0][0]
    expect(dark).toMatchObject({ startOnLoad: false, theme: "base" })
    expect(dark.themeVariables).toMatchObject({ background: "#1b1a18", signalColor: "#7c3aed" })

    await renderMermaid("a", "light")
    const light = initialize.mock.calls[1][0]
    expect(light.themeVariables).toMatchObject({
      background: "#f5f0e6",
      labelBoxBorderColor: "#7c3aed",
    })
  })

  it("propage les erreurs de rendu", async () => {
    render.mockRejectedValueOnce(new Error("syntaxe"))
    await expect(renderMermaid("???", "light")).rejects.toThrow("syntaxe")
  })
})
