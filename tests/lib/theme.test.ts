import { describe, expect, it, vi } from "vitest"
import { getTheme, setTheme, subscribe, toggleTheme } from "../../app/lib/theme"

describe("theme", () => {
  it("lit le thème depuis la classe `dark` de <html>", () => {
    expect(getTheme()).toBe("light")
    document.documentElement.classList.add("dark")
    expect(getTheme()).toBe("dark")
  })

  it("applique, persiste et notifie les abonnés", () => {
    const fn = vi.fn()
    const unsubscribe = subscribe(fn)
    setTheme("dark")
    expect(document.documentElement.classList.contains("dark")).toBe(true)
    expect(localStorage.getItem("barjavel-theme")).toBe("dark")
    expect(fn).toHaveBeenCalledWith("dark")

    unsubscribe()
    toggleTheme()
    expect(getTheme()).toBe("light")
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it("bascule entre clair et sombre", () => {
    toggleTheme()
    expect(getTheme()).toBe("dark")
    toggleTheme()
    expect(getTheme()).toBe("light")
  })

  it("survit à un stockage indisponible", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota")
    })
    expect(() => setTheme("dark")).not.toThrow()
    expect(getTheme()).toBe("dark")
  })
})
