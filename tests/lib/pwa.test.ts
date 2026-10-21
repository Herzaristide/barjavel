import { describe, expect, it, vi } from "vitest"
import { registerServiceWorker } from "../../app/lib/pwa"

function stubServiceWorker(register: ReturnType<typeof vi.fn>) {
  Object.defineProperty(navigator, "serviceWorker", {
    configurable: true,
    value: { register },
  })
}

describe("registerServiceWorker", () => {
  it("ne fait rien en développement", () => {
    vi.stubEnv("DEV", true)
    const register = vi.fn()
    stubServiceWorker(register)
    registerServiceWorker()
    window.dispatchEvent(new Event("load"))
    expect(register).not.toHaveBeenCalled()
  })

  it("ne fait rien si le navigateur ne supporte pas les service workers", () => {
    vi.stubEnv("DEV", false)
    // @ts-expect-error suppression volontaire pour simuler un navigateur ancien
    delete navigator.serviceWorker
    const add = vi.spyOn(window, "addEventListener")
    registerServiceWorker()
    expect(add).not.toHaveBeenCalledWith("load", expect.any(Function))
  })

  it("enregistre sw.js sous BASE_URL au chargement", async () => {
    vi.stubEnv("DEV", false)
    vi.stubEnv("BASE_URL", "/repo/")
    const register = vi.fn().mockResolvedValue({})
    stubServiceWorker(register)
    registerServiceWorker()
    window.dispatchEvent(new Event("load"))
    expect(register).toHaveBeenCalledWith("/repo/sw.js", { scope: "/repo/" })
  })

  it("utilise « / » par défaut et journalise un échec d'enregistrement", async () => {
    vi.stubEnv("DEV", false)
    vi.stubEnv("BASE_URL", "")
    const err = new Error("refusé")
    const register = vi.fn().mockRejectedValue(err)
    const log = vi.spyOn(console, "error").mockImplementation(() => {})
    stubServiceWorker(register)
    registerServiceWorker()
    window.dispatchEvent(new Event("load"))
    expect(register).toHaveBeenCalledWith("/sw.js", { scope: "/" })
    await vi.waitFor(() => expect(log).toHaveBeenCalledWith(expect.any(String), err))
  })
})
