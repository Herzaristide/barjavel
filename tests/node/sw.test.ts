// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest"

type Listener = (event: FakeEvent) => void
interface FakeEvent {
  request?: FakeRequest
  waitUntil: (p: Promise<unknown>) => void
  respondWith: (p: Promise<unknown>) => void
}
interface FakeRequest {
  url: string
  method: string
  mode?: string
  headers: { get: (k: string) => string | null }
}

const ORIGIN = "https://docs.example"
const SW = "../../assets/sw.js"

function req(path: string, init: Partial<FakeRequest> & { accept?: string } = {}): FakeRequest {
  return {
    url: path.startsWith("http") ? path : ORIGIN + path,
    method: init.method ?? "GET",
    mode: init.mode,
    headers: { get: (k) => (k === "accept" ? (init.accept ?? null) : null) },
  }
}

const response = (status = 200, body = "net") => ({ status, body, clone: () => ({ status, body }) })

let listeners: Record<string, Listener>
let store: Map<string, Map<string, unknown>>
let cache: { addAll: ReturnType<typeof vi.fn>; put: ReturnType<typeof vi.fn> }
let fetchMock: ReturnType<typeof vi.fn>

async function loadWorker() {
  listeners = {}
  store = new Map([
    ["barjavel-v0", new Map()],
    ["barjavel-v1", new Map()],
  ])
  cache = {
    addAll: vi.fn().mockResolvedValue(undefined),
    put: vi.fn(async (r: FakeRequest, v: unknown) => store.get("barjavel-v1")!.set(r.url, v)),
  }
  fetchMock = vi.fn()
  vi.stubGlobal("self", {
    location: { origin: ORIGIN },
    addEventListener: (type: string, fn: Listener) => (listeners[type] = fn),
    skipWaiting: vi.fn(),
    clients: { claim: vi.fn().mockResolvedValue(undefined) },
  })
  vi.stubGlobal("fetch", fetchMock)
  vi.stubGlobal("caches", {
    open: vi.fn().mockResolvedValue(cache),
    keys: vi.fn(async () => [...store.keys()]),
    delete: vi.fn(async (k: string) => store.delete(k)),
    match: vi.fn(async (r: FakeRequest | string) => {
      const url = typeof r === "string" ? r : r.url
      return store.get("barjavel-v1")!.get(url)
    }),
  })
  vi.resetModules()
  // Script classique (sans export) : chemin dynamique pour que tsc ne le traite pas en module.
  await import(/* @vite-ignore */ SW)
}

function dispatch(type: string, request?: FakeRequest) {
  const event = {
    request,
    waits: [] as Promise<unknown>[],
    responses: [] as Promise<unknown>[],
    waitUntil(p: Promise<unknown>) {
      this.waits.push(p)
    },
    respondWith(p: Promise<unknown>) {
      this.responses.push(p)
    },
  }
  listeners[type](event)
  return event
}

beforeEach(loadWorker)

describe("service worker", () => {
  it("met l'app shell en cache à l'installation et s'active aussitôt", async () => {
    const ev = dispatch("install")
    await Promise.all(ev.waits)
    expect(cache.addAll).toHaveBeenCalledWith(["./", "./index.html", "./manifest.webmanifest"])
    expect(
      (globalThis.self as unknown as { skipWaiting: () => void }).skipWaiting,
    ).toHaveBeenCalled()
  })

  it("tolère un échec de pré-cache", async () => {
    cache.addAll.mockRejectedValue(new Error("hors-ligne"))
    const ev = dispatch("install")
    await expect(Promise.all(ev.waits)).resolves.toBeDefined()
  })

  it("purge les anciennes versions du cache à l'activation", async () => {
    const ev = dispatch("activate")
    await Promise.all(ev.waits)
    expect([...store.keys()]).toEqual(["barjavel-v1"])
  })

  it("ignore les requêtes non GET ou d'une autre origine", () => {
    expect(dispatch("fetch", req("/api", { method: "POST" })).responses).toHaveLength(0)
    expect(dispatch("fetch", req("https://cdn.example/x.js")).responses).toHaveLength(0)
  })

  it("navigation : réseau d'abord, avec mise en cache", async () => {
    fetchMock.mockResolvedValue(response(200, "page"))
    const ev = dispatch("fetch", req("/", { mode: "navigate" }))
    await expect(ev.responses[0]).resolves.toMatchObject({ body: "page" })
    await vi.waitFor(() => expect(cache.put).toHaveBeenCalled())
  })

  it("navigation hors-ligne : page en cache, sinon index.html", async () => {
    fetchMock.mockRejectedValue(new Error("offline"))
    store.get("barjavel-v1")!.set(`${ORIGIN}/guide`, "guide en cache")
    store.get("barjavel-v1")!.set("./index.html", "shell")

    const hit = dispatch("fetch", req("/guide", { accept: "text/html" }))
    await expect(hit.responses[0]).resolves.toBe("guide en cache")
    const miss = dispatch("fetch", req("/autre", { mode: "navigate" }))
    await expect(miss.responses[0]).resolves.toBe("shell")
  })

  it("assets : sert le cache puis le revalide en arrière-plan", async () => {
    store.get("barjavel-v1")!.set(`${ORIGIN}/app.js`, "ancien")
    fetchMock.mockResolvedValue(response(200, "nouveau"))
    const ev = dispatch("fetch", req("/app.js"))
    await expect(ev.responses[0]).resolves.toBe("ancien")
    await vi.waitFor(() =>
      expect(store.get("barjavel-v1")!.get(`${ORIGIN}/app.js`)).toMatchObject({ body: "nouveau" }),
    )
  })

  it("assets : réseau si absent du cache, sans mettre en cache les erreurs", async () => {
    fetchMock.mockResolvedValue(response(404, "absent"))
    const ev = dispatch("fetch", req("/missing.png"))
    await expect(ev.responses[0]).resolves.toMatchObject({ status: 404 })
    expect(cache.put).not.toHaveBeenCalled()
  })

  it("assets : hors-ligne et sans cache, renvoie undefined", async () => {
    fetchMock.mockRejectedValue(new Error("offline"))
    const ev = dispatch("fetch", req("/x.css"))
    await expect(ev.responses[0]).resolves.toBeUndefined()
  })
})
