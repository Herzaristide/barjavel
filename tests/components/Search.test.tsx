import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { Search } from "../../app/components/Search"

const openWithShortcut = () => fireEvent.keyDown(window, { key: "k", ctrlKey: true })
const input = () => screen.getByPlaceholderText("Rechercher dans la documentation…")

describe("Search", () => {
  it("s'ouvre au clic et donne le focus au champ", () => {
    render(<Search onSelect={vi.fn()} />)
    fireEvent.click(screen.getByRole("button", { name: "Rechercher" }))
    expect(document.activeElement).toBe(input())
  })

  it("s'ouvre / se ferme avec Ctrl+K ou Cmd+K, et se ferme avec Échap", () => {
    render(<Search onSelect={vi.fn()} />)
    openWithShortcut()
    expect(input()).toBeTruthy()
    fireEvent.keyDown(window, { key: "K", metaKey: true })
    expect(screen.queryByPlaceholderText(/Rechercher/)).toBeNull()
    openWithShortcut()
    fireEvent.keyDown(window, { key: "Escape" })
    expect(screen.queryByPlaceholderText(/Rechercher/)).toBeNull()
    fireEvent.keyDown(window, { key: "k" })
    expect(screen.queryByPlaceholderText(/Rechercher/)).toBeNull()
  })

  it("affiche « Aucun résultat » pour une requête sans correspondance", () => {
    render(<Search onSelect={vi.fn()} />)
    openWithShortcut()
    fireEvent.change(input(), { target: { value: "introuvable" } })
    expect(screen.getByText("Aucun résultat")).toBeTruthy()
  })

  it("navigue au clavier et ouvre le résultat sélectionné", () => {
    const onSelect = vi.fn()
    render(<Search onSelect={onSelect} />)
    openWithShortcut()
    fireEvent.change(input(), { target: { value: "guide" } })
    expect(screen.getByText("Pages")).toBeTruthy()
    const titles = screen.getAllByRole("button").filter((b) => b.querySelector("span"))
    expect(titles.length).toBeGreaterThan(1)

    fireEvent.keyDown(input(), { key: "ArrowDown" })
    fireEvent.keyDown(input(), { key: "ArrowDown" })
    fireEvent.keyDown(input(), { key: "ArrowDown" })
    fireEvent.keyDown(input(), { key: "ArrowUp" })
    fireEvent.keyDown(input(), { key: "ArrowUp" })
    fireEvent.keyDown(input(), { key: "ArrowUp" })
    fireEvent.keyDown(input(), { key: "Enter" })
    expect(onSelect).toHaveBeenCalledWith("guide")
    expect(screen.queryByPlaceholderText(/Rechercher/)).toBeNull()
  })

  it("ignore Entrée sans résultat", () => {
    const onSelect = vi.fn()
    render(<Search onSelect={onSelect} />)
    openWithShortcut()
    fireEvent.keyDown(input(), { key: "Enter" })
    expect(onSelect).not.toHaveBeenCalled()
  })

  it("sélectionne au survol puis au clic", () => {
    const onSelect = vi.fn()
    render(<Search onSelect={onSelect} />)
    openWithShortcut()
    fireEvent.change(input(), { target: { value: "api" } })
    const hit = screen.getByText("API").closest("button")!
    fireEvent.mouseEnter(hit)
    expect(hit.className).toContain("bg-accent/15")
    fireEvent.click(hit)
    expect(onSelect).toHaveBeenCalledWith("api")
  })

  it("se ferme au clic sur le fond mais pas sur la carte", () => {
    render(<Search onSelect={vi.fn()} />)
    openWithShortcut()
    fireEvent.mouseDown(input())
    expect(input()).toBeTruthy()
    const backdrop = input().closest(".fixed")!
    fireEvent.mouseDown(backdrop)
    expect(screen.queryByPlaceholderText(/Rechercher/)).toBeNull()
  })
})
