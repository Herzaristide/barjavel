import { act, fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { ThemeToggle } from "../../app/components/ThemeToggle"
import { setTheme } from "../../app/lib/theme"

describe("ThemeToggle", () => {
  it("bascule le thème et met à jour son libellé", () => {
    render(<ThemeToggle />)
    const btn = screen.getByRole("button", { name: "Passer en thème sombre" })
    fireEvent.click(btn)
    expect(document.documentElement.classList.contains("dark")).toBe(true)
    expect(btn.getAttribute("aria-label")).toBe("Passer en thème clair")
  })

  it("suit les changements de thème faits ailleurs", () => {
    render(<ThemeToggle />)
    act(() => setTheme("dark"))
    expect(screen.getByRole("button", { name: "Passer en thème clair" })).toBeTruthy()
  })
})
