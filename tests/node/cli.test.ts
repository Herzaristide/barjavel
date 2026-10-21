// @vitest-environment node
import { resolve } from "node:path"
import { afterEach, beforeEach, describe, expect, it, type MockInstance, vi } from "vitest"

const vite = vi.hoisted(() => ({
  createServer: vi.fn(),
  build: vi.fn(),
  preview: vi.fn(),
}))
vi.mock("vite", () => vite)

const pkgDir = resolve(__dirname, "../..")
const argv = process.argv

// main() est lancé sans être attendu : on attend son effet observable.
async function run(args: string[], done: () => unknown) {
  process.argv = ["node", "barjavel", ...args]
  vi.resetModules()
  await import("../../bin/barjavel.mjs")
  await vi.waitFor(() => expect(done()).toBeTruthy())
}

describe("CLI barjavel", () => {
  let exit: MockInstance<typeof process.exit>
  let log: MockInstance<typeof console.log>
  let err: MockInstance<typeof console.error>

  beforeEach(() => {
    exit = vi.spyOn(process, "exit").mockImplementation((() => undefined) as never)
    log = vi.spyOn(console, "log").mockImplementation(() => {})
    err = vi.spyOn(console, "error").mockImplementation(() => {})
  })
  afterEach(() => {
    process.argv = argv
  })

  it("build : génère une config Vite complète vers <cwd>/dist", async () => {
    await run(["build"], () => vite.build.mock.calls.length)
    expect(vite.build).toHaveBeenCalledTimes(1)
    const config = vite.build.mock.calls[0][0]
    expect(config).toMatchObject({
      configFile: false,
      root: resolve(pkgDir, "app"),
      base: "./",
      publicDir: resolve(process.cwd(), "public"),
      build: { outDir: resolve(process.cwd(), "dist"), emptyOutDir: true },
      logLevel: "info",
    })
    expect(config.plugins.flat().map((p: { name: string }) => p.name)).toContain("barjavel")
    expect(config.css.postcss.plugins).toHaveLength(2)
  })

  it("build : respecte --base et --outDir", async () => {
    await run(["build", "--base", "/repo/", "--outDir", "out"], () => vite.build.mock.calls.length)
    const config = vite.build.mock.calls[0][0]
    expect(config.base).toBe("/repo/")
    expect(config.build.outDir).toBe(resolve(process.cwd(), "out"))
  })

  it("dev (par défaut) : lance le serveur avec port et ouverture", async () => {
    const server = { listen: vi.fn(), printUrls: vi.fn(), bindCLIShortcuts: vi.fn() }
    vite.createServer.mockResolvedValue(server)
    await run([], () => server.bindCLIShortcuts.mock.calls.length)
    const config = vite.createServer.mock.calls[0][0]
    expect(config.server).toMatchObject({ port: 5173, open: false })
    expect(config.logLevel).toBeUndefined()
    expect(server.listen).toHaveBeenCalled()
    expect(server.bindCLIShortcuts).toHaveBeenCalledWith({ print: true })

    await run(["dev", "--port", "4000", "--open"], () => vite.createServer.mock.calls.length === 2)
    expect(vite.createServer.mock.calls[1][0].server).toMatchObject({ port: 4000, open: true })
  })

  it("ignore un drapeau sans valeur", async () => {
    await run(["build", "--base"], () => vite.build.mock.calls.length)
    expect(vite.build.mock.calls[0][0].base).toBe("./")
  })

  it("preview : sert le dossier de sortie", async () => {
    const server = { printUrls: vi.fn() }
    vite.preview.mockResolvedValue(server)
    await run(["preview"], () => server.printUrls.mock.calls.length)
    expect(vite.preview).toHaveBeenCalled()
    expect(server.printUrls).toHaveBeenCalled()
  })

  it.each(["help", "--help", "-h"])("%s : affiche l'aide", async (cmd) => {
    await run([cmd], () => log.mock.calls.length)
    expect(log.mock.calls[0][0]).toContain("Usage :")
    expect(exit).not.toHaveBeenCalled()
  })

  it("commande inconnue : erreur, aide et code de sortie 1", async () => {
    await run(["deploy"], () => exit.mock.calls.length)
    expect(err.mock.calls[0][0]).toContain("Commande inconnue : « deploy »")
    expect(log).toHaveBeenCalled()
    expect(exit).toHaveBeenCalledWith(1)
  })

  it("échec de Vite : journalise et sort avec le code 1", async () => {
    const boom = new Error("boom")
    vite.build.mockRejectedValue(boom)
    await run(["build"], () => exit.mock.calls.length)
    expect(err).toHaveBeenCalledWith(boom)
    expect(exit).toHaveBeenCalledWith(1)
  })
})
