import { describe, expect, it } from "vitest"
import type { Doc } from "../../app/lib/content"
import { buildIndex, search } from "../../app/lib/search"

const mk = (slug: string, title: string, summary: string, body: string): Doc => ({
  slug,
  title,
  summary,
  body,
  group: "g",
  links: [],
})

const index = buildIndex([
  mk("install", "Installation", "Installer le paquet", "Lancez `npm install` puis **build**."),
  mk("config", "Configuration", "Réglages", "La couleur se règle dans docs.config.ts."),
  mk("long", "Long", "", `${"x ".repeat(60)}cible au milieu ${"y ".repeat(100)}`),
])

describe("buildIndex", () => {
  it("retire la syntaxe markdown du texte et prépare une version minuscule", () => {
    expect(index[0].text).toBe("Lancez npm install puis build .")
    expect(index[0].lower).toContain("installation installer le paquet")
  })
})

describe("search", () => {
  it("ne renvoie rien pour une requête vide", () => {
    expect(search(index, "   ")).toEqual([])
  })

  it("classe le titre avant le corps et ignore la casse", () => {
    const hits = search(index, "INSTALL")
    expect(hits.map((h) => h.slug)).toEqual(["install"])
    // titre (5) + résumé (2) + 3 occurrences (titre, résumé, corps)
    expect(hits[0].score).toBe(10)
  })

  it("additionne les scores de plusieurs termes", () => {
    const hits = search(index, "couleur réglages")
    expect(hits[0]).toMatchObject({ slug: "config", score: 4 })
  })

  it("extrait un passage autour du premier terme, avec ellipse en tête", () => {
    const [hit] = search(index, "cible")
    expect(hit.excerpt.startsWith("…")).toBe(true)
    expect(hit.excerpt).toContain("cible au milieu")
    expect(hit.excerpt.endsWith("…")).toBe(true)
  })

  it("se rabat sur le résumé si le premier terme n'est que dans le titre", () => {
    const [hit] = search(index, "configuration")
    expect(hit.excerpt).toBe("Réglages")
  })

  it("plafonne le nombre de résultats à 8", () => {
    const many = buildIndex(Array.from({ length: 12 }, (_, i) => mk(`p${i}`, `Page ${i}`, "", "")))
    expect(search(many, "page")).toHaveLength(8)
  })
})
