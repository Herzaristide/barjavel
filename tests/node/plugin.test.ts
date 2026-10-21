// @vitest-environment node
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { barjavel } from "../../vite/plugin.mjs"

const pkgDir = resolve(__dirname, "../..")
let cwd: string

type Plugin = ReturnType<typeof barjavel>
type Middleware = (req: { url?: string }, res: FakeRes, next: () => void) => Promise<void>

interface FakeRes {
  headers: Record<string, string>
  body?: unknown
  setHeader(k: string, v: string): void
  end(b: unknown): void
}

const fakeRes = (): FakeRes => ({
  headers: {},
  setHeader(k, v) {
    this.headers[k] = v
  },
  end(b) {
    this.body = b
  },
})

function project(files: Record<string, string>) {
  for (const [rel, content] of Object.entries(files)) {
    const file = join(cwd, rel)
    mkdirSync(join(file, ".."), { recursive: true })
    writeFileSync(file, content)
  }
  return barjavel({ cwd, pkgDir })
}

const CONFIG = `export default { title: "Mon <site>", description: 'Dit "bonjour"', accent: "#123456", lang: "de" }`

beforeEach(() => {
  cwd = mkdtempSync(join(tmpdir(), "barjavel-plugin-"))
})
afterEach(() => {
  rmSync(cwd, { recursive: true, force: true })
})

describe("modules virtuels", () => {
  it("résout uniquement ses propres identifiants", () => {
    const p = project({})
    expect(p.resolveId("virtual:barjavel-content")).toBe("\0virtual:barjavel-content")
    expect(p.resolveId("virtual:barjavel-config")).toBe("\0virtual:barjavel-config")
    expect(p.resolveId("react")).toBeUndefined()
    expect(p.load("autre")).toBeUndefined()
  })

  it("expose les .md du dossier content/ indexés par slug", () => {
    const p = project({
      "content/a.md": "# A",
      "content/b.md": "# B",
      "content/notes.txt": "ignoré",
    })
    const code = p.load("\0virtual:barjavel-content") as string
    expect(code).toBe(`export const raw = ${JSON.stringify({ a: "# A", b: "# B" })}`)
  })

  it("renvoie un contenu vide sans dossier content/", () => {
    const p = project({})
    expect(p.load("\0virtual:barjavel-content")).toBe("export const raw = {}")
  })

  it("ré-exporte docs.config.ts du projet", () => {
    const p = project({})
    const code = p.load("\0virtual:barjavel-config") as string
    expect(code).toBe(`export { default } from ${JSON.stringify(join(cwd, "docs.config.ts"))}`)
  })
})

describe("transformIndexHtml", () => {
  const html = '<html class="x" lang="fr"><head><title>Ancien</title></head></html>'

  it("injecte titre, langue et métas en échappant les valeurs", async () => {
    const p = project({ "docs.config.ts": CONFIG })
    const out = await p.transformIndexHtml.handler(html)
    expect(out.html).toBe(
      '<html class="x" lang="de"><head><title>Mon &lt;site></title></head></html>',
    )
    expect(out.tags).toEqual([
      {
        tag: "meta",
        attrs: { name: "description", content: "Dit &quot;bonjour&quot;" },
        injectTo: "head",
      },
      { tag: "meta", attrs: { name: "theme-color", content: "#123456" }, injectTo: "head" },
      {
        tag: "meta",
        attrs: { name: "apple-mobile-web-app-title", content: "Mon &lt;site>" },
        injectTo: "head",
      },
    ])
  })

  it("utilise une configuration par défaut sans docs.config.ts, et la met en cache", async () => {
    const p = project({})
    const first = await p.transformIndexHtml.handler(html)
    expect(first.html).toContain("<title>Documentation</title>")
    expect(first.html).toContain('lang="fr"')
    expect(first.tags[0].attrs.content).toBe("")
    writeFileSync(join(cwd, "docs.config.ts"), CONFIG)
    const second = await p.transformIndexHtml.handler(html)
    expect(second.html).toContain("<title>Documentation</title>")
  })

  it("garde « fr » si la config ne précise pas de langue", async () => {
    const p = project({ "docs.config.ts": `export default { title: "T", accent: "#000" }` })
    const out = await p.transformIndexHtml.handler(html)
    expect(out.html).toContain('lang="fr"')
  })
})

describe("generateBundle", () => {
  it("émet manifest, service worker et icônes par défaut absentes du projet", async () => {
    const p = project({ "docs.config.ts": CONFIG, "public/icons/icon.svg": "<svg/>" })
    const emitFile = vi.fn()
    await p.generateBundle.call({ emitFile })

    const files = emitFile.mock.calls.map(([f]) => f.fileName)
    expect(files).toEqual([
      "manifest.webmanifest",
      "sw.js",
      "icons/icon-192.png",
      "icons/icon-512.png",
      "icons/icon-maskable-512.png",
    ])
    const manifest = JSON.parse(emitFile.mock.calls[0][0].source)
    expect(manifest).toMatchObject({
      name: "Mon <site>",
      short_name: "Mon <site>",
      description: 'Dit "bonjour"',
      theme_color: "#123456",
      lang: "de",
      display: "standalone",
    })
    expect(manifest.icons).toHaveLength(4)
    expect(String(emitFile.mock.calls[1][0].source)).toBe(
      readFileSync(join(pkgDir, "assets/sw.js"), "utf8"),
    )
  })

  it("complète le manifest avec des valeurs par défaut", async () => {
    const p = project({ "docs.config.ts": `export default { title: "T", accent: "#000" }` })
    const emitFile = vi.fn()
    await p.generateBundle.call({ emitFile })
    const manifest = JSON.parse(emitFile.mock.calls[0][0].source)
    expect(manifest.description).toBe("")
    expect(manifest.lang).toBe("fr")
  })
})

describe("configureServer", () => {
  function fakeServer() {
    const handlers: Record<string, (file: string) => void> = {}
    const mod = { id: "content" }
    const server = {
      watcher: {
        add: vi.fn(),
        on: vi.fn((ev: string, fn: (file: string) => void) => {
          handlers[ev] = fn
        }),
      },
      moduleGraph: {
        getModuleById: vi.fn(() => mod as unknown),
        invalidateModule: vi.fn(),
      },
      ws: { send: vi.fn() },
      middlewares: { use: vi.fn() },
    }
    return { server, handlers, mod }
  }

  function setup(files: Record<string, string> = {}) {
    const p: Plugin = project({ "docs.config.ts": CONFIG, ...files })
    const s = fakeServer()
    p.configureServer(s.server)
    const middleware = s.server.middlewares.use.mock.calls[0][0] as Middleware
    return { ...s, middleware }
  }

  it("surveille content/ et recharge la page quand un .md change", () => {
    const { server, handlers, mod } = setup()
    expect(server.watcher.add).toHaveBeenCalledWith(join(cwd, "content"))
    expect(Object.keys(handlers).sort()).toEqual(["add", "change", "unlink"])

    handlers.change(join(cwd, "content/a.md"))
    expect(server.moduleGraph.invalidateModule).toHaveBeenCalledWith(mod)
    expect(server.ws.send).toHaveBeenCalledWith({ type: "full-reload" })

    handlers.add(join(cwd, "content/a.txt"))
    handlers.unlink(join(cwd, "ailleurs/b.md"))
    expect(server.ws.send).toHaveBeenCalledTimes(1)
  })

  it("recharge même si le module de contenu n'est pas encore chargé", () => {
    const { server, handlers } = setup()
    server.moduleGraph.getModuleById.mockReturnValue(undefined)
    handlers.add(join(cwd, "content/new.md"))
    expect(server.moduleGraph.invalidateModule).not.toHaveBeenCalled()
    expect(server.ws.send).toHaveBeenCalledTimes(1)
  })

  it("sert le manifest et le service worker", async () => {
    const { middleware } = setup()
    const res = fakeRes()
    await middleware({ url: "/manifest.webmanifest?v=1" }, res, vi.fn())
    expect(res.headers["Content-Type"]).toBe("application/manifest+json")
    expect(JSON.parse(String(res.body)).name).toBe("Mon <site>")

    const sw = fakeRes()
    await middleware({ url: "/sw.js" }, sw, vi.fn())
    expect(sw.headers["Content-Type"]).toBe("text/javascript")
    expect(String(sw.body)).toContain("barjavel-v1")
  })

  it("sert les icônes par défaut sauf si le projet fournit les siennes", async () => {
    const { middleware } = setup({ "public/icons/icon-192.png": "png" })
    const svg = fakeRes()
    await middleware({ url: "/icons/icon.svg" }, svg, vi.fn())
    expect(svg.headers["Content-Type"]).toBe("image/svg+xml")
    expect(Buffer.isBuffer(svg.body)).toBe(true)

    const next = vi.fn()
    await middleware({ url: "/icons/icon-192.png" }, fakeRes(), next)
    expect(next).toHaveBeenCalled()
  })

  it("laisse passer les autres requêtes", async () => {
    const { middleware } = setup()
    const next = vi.fn()
    await middleware({ url: "/index.html" }, fakeRes(), next)
    await middleware({}, fakeRes(), next)
    expect(next).toHaveBeenCalledTimes(2)
  })
})
