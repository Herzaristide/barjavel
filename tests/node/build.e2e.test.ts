// @vitest-environment node
// Test de bout en bout : `barjavel build` sur un mini-projet consommateur.
import { execFile } from "node:child_process"
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { promisify } from "node:util"
import { afterAll, beforeAll, describe, expect, it } from "vitest"

const bin = resolve(__dirname, "../../bin/barjavel.mjs")
let cwd: string

beforeAll(async () => {
  cwd = mkdtempSync(join(tmpdir(), "barjavel-e2e-"))
  mkdirSync(join(cwd, "content"))
  writeFileSync(
    join(cwd, "docs.config.ts"),
    `export default { title: "Projet E2E", description: "Doc e2e", accent: "#2563eb", lang: "en" }`,
  )
  writeFileSync(
    join(cwd, "content/index.md"),
    "---\ntitle: Accueil\nlinks: [page]\n---\n# Bonjour E2E",
  )
  writeFileSync(join(cwd, "content/page.md"), "---\ntitle: Page\n---\nTexte unique-e2e")
  await promisify(execFile)(process.execPath, [bin, "build", "--base", "/docs/"], { cwd })
}, 120_000)

afterAll(() => {
  rmSync(cwd, { recursive: true, force: true })
})

describe("barjavel build", () => {
  it("produit le site, la config injectée et le contenu embarqué", () => {
    const html = readFileSync(join(cwd, "dist/index.html"), "utf8")
    expect(html).toContain("<title>Projet E2E</title>")
    expect(html).toContain('lang="en"')
    expect(html).toContain('content="#2563eb"')
    expect(html).toContain('src="/docs/assets/')

    const assets = join(cwd, "dist/assets")
    const js = readdirSync(assets)
      .filter((f) => f.endsWith(".js"))
      .map((f) => readFileSync(join(assets, f), "utf8"))
      .join("\n")
    expect(js).toContain("unique-e2e")
  })

  it("émet les artefacts PWA", () => {
    for (const f of ["manifest.webmanifest", "sw.js", "icons/icon.svg", "icons/icon-512.png"]) {
      expect(existsSync(join(cwd, "dist", f))).toBe(true)
    }
    const manifest = JSON.parse(readFileSync(join(cwd, "dist/manifest.webmanifest"), "utf8"))
    expect(manifest).toMatchObject({ name: "Projet E2E", theme_color: "#2563eb", lang: "en" })
  })
})
