import { beforeEach, describe, expect, it, vi } from "vitest"
import { applyConfig, config, currentAccentHex, hexToRgbTriplet } from "../../app/lib/config"

describe("hexToRgbTriplet", () => {
  it.each([
    ["#7c3aed", "124 58 237"],
    ["7c3aed", "124 58 237"],
    ["  #FFF ", "255 255 255"],
    ["#000000", "0 0 0"],
  ])("convertit %s", (hex, rgb) => {
    expect(hexToRgbTriplet(hex)).toBe(rgb)
  })

  it.each(["#12345", "zzzzzz", ""])("se rabat sur le cuivre pour « %s »", (hex) => {
    expect(hexToRgbTriplet(hex)).toBe("212 163 95")
  })
})

describe("applyConfig", () => {
  beforeEach(() => {
    document.head.innerHTML = ""
    document.documentElement.removeAttribute("style")
  })

  it("applique accent, titre, langue et crée la méta description", () => {
    applyConfig()
    const root = document.documentElement
    expect(root.style.getPropertyValue("--accent-dark")).toBe("124 58 237")
    expect(root.style.getPropertyValue("--accent-light")).toBe("124 58 237")
    expect(root.getAttribute("lang")).toBe("en")
    expect(document.title).toBe(config.title)
    expect(document.querySelector('meta[name="description"]')?.getAttribute("content")).toBe(
      "Description de test",
    )
  })

  it("réutilise la méta description existante", () => {
    document.head.innerHTML = '<meta name="description" content="ancienne">'
    applyConfig()
    const metas = document.querySelectorAll('meta[name="description"]')
    expect(metas).toHaveLength(1)
    expect(metas[0].getAttribute("content")).toBe("Description de test")
  })

  it("donne l'accent du thème actif", () => {
    expect(currentAccentHex()).toBe("#7c3aed")
    document.documentElement.classList.add("dark")
    expect(currentAccentHex()).toBe("#7c3aed")
  })
})

describe("configuration minimale avec accents par thème", () => {
  it("utilise accentDark / accentLight et saute les champs optionnels", async () => {
    vi.resetModules()
    vi.doMock("virtual:barjavel-config", () => ({
      default: { title: "Mini", accent: "#000", accentDark: "#fff", accentLight: "#f00" },
    }))
    const mod = await import("../../app/lib/config")
    document.head.innerHTML = ""
    document.documentElement.removeAttribute("lang")

    mod.applyConfig()
    expect(document.documentElement.style.getPropertyValue("--accent-dark")).toBe("255 255 255")
    expect(document.documentElement.style.getPropertyValue("--accent-light")).toBe("255 0 0")
    expect(document.documentElement.hasAttribute("lang")).toBe(false)
    expect(document.querySelector('meta[name="description"]')).toBeNull()

    expect(mod.currentAccentHex()).toBe("#f00")
    document.documentElement.classList.add("dark")
    expect(mod.currentAccentHex()).toBe("#fff")
    vi.doUnmock("virtual:barjavel-config")
  })
})
