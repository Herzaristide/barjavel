import { describe, expect, it } from "vitest"
import {
  buildEdges,
  computeDistances,
  degree,
  depth,
  type Doc,
  docs,
  edges,
  getDoc,
  parseFrontmatter,
  pickRoot,
  rootSlug,
  toDocs,
} from "../../app/lib/content"

const doc = (slug: string, links: string[] = []): Doc => ({
  slug,
  title: slug,
  group: "default",
  summary: "",
  links,
  body: "",
})

describe("parseFrontmatter", () => {
  it("renvoie le texte brut sans frontmatter", () => {
    expect(parseFrontmatter("# Titre\ncorps")).toEqual({ data: {}, body: "# Titre\ncorps" })
  })

  it("lit les chaînes, retire les guillemets et ignore les lignes sans « : »", () => {
    const { data, body } = parseFrontmatter(
      `---\ntitle: "Mon titre"\nsummary: 'Résumé : court'\nligne invalide\n---\nCorps`,
    )
    expect(data).toEqual({ title: "Mon titre", summary: "Résumé : court" })
    expect(body).toBe("Corps")
  })

  it("lit les listes entre crochets en ignorant les entrées vides", () => {
    const { data } = parseFrontmatter("---\nlinks: [ a, b ,, c ]\nempty: []\n---\n")
    expect(data.links).toEqual(["a", "b", "c"])
    expect(data.empty).toEqual([])
  })

  it("accepte les fins de ligne Windows", () => {
    const { data, body } = parseFrontmatter("---\r\ntitle: Win\r\n---\r\nTexte")
    expect(data.title).toBe("Win")
    expect(body).toBe("Texte")
  })
})

describe("toDocs", () => {
  it("applique les valeurs par défaut et trie par titre (locale fr)", () => {
    const list = toDocs({
      zeta: "---\ntitle: Zêta\n---\n",
      a: "---\ntitle: été\ngroup: g\nsummary: s\nlinks: [zeta]\n---\nbody",
      nu: "texte",
    })
    expect(list.map((d) => d.title)).toEqual(["été", "nu", "Zêta"])
    expect(list[0]).toEqual({
      slug: "a",
      title: "été",
      group: "g",
      summary: "s",
      links: ["zeta"],
      body: "body",
    })
    expect(list[1]).toMatchObject({ group: "default", summary: "", links: [], body: "texte" })
  })
})

describe("buildEdges", () => {
  it("déduplique les liens réciproques et ignore les cibles inconnues ou auto-liens", () => {
    const out = buildEdges([doc("a", ["b", "a", "x"]), doc("b", ["a", "c"]), doc("c")])
    expect(out).toEqual([
      { source: "a", target: "b" },
      { source: "b", target: "c" },
    ])
  })
})

describe("pickRoot", () => {
  it("préfère `index` quand il existe", () => {
    expect(pickRoot([doc("a", ["b"]), doc("b"), doc("index")], [])).toBe("index")
  })

  it("sinon choisit la page la plus connectée", () => {
    const list = [doc("a", ["b"]), doc("b", ["c"]), doc("c")]
    expect(pickRoot(list, buildEdges(list))).toBe("b")
  })

  it("renvoie une chaîne vide sans documents", () => {
    expect(pickRoot([], [])).toBe("")
  })
})

describe("computeDistances", () => {
  it("calcule la distance BFS à la racine", () => {
    const list = [doc("r", ["a"]), doc("a", ["b"]), doc("b"), doc("seul")]
    const dist = computeDistances(list, buildEdges(list), "r")
    expect(Object.fromEntries(dist)).toEqual({ r: 0, a: 1, b: 2 })
  })

  it("est vide sans racine", () => {
    expect(computeDistances([doc("a")], [], "").size).toBe(0)
  })

  it("tolère une arête vers un nœud absent de la liste", () => {
    const dist = computeDistances([doc("r")], [{ source: "r", target: "fantome" }], "r")
    expect(dist.get("fantome")).toBe(1)
  })
})

describe("valeurs dérivées du contenu du projet", () => {
  it("charge et trie les documents de la fixture", () => {
    expect(docs.map((d) => d.slug)).toEqual(["index", "api", "elan", "guide", "orphan"])
  })

  it("indexe les documents par slug", () => {
    expect(getDoc("guide")?.title).toBe("Guide")
    expect(getDoc("absent")).toBeUndefined()
  })

  it("dérive le graphe, la racine, le degré et la profondeur", () => {
    expect(edges).toHaveLength(3)
    expect(rootSlug).toBe("index")
    expect(degree("index")).toBe(2)
    expect(degree("orphan")).toBe(0)
    expect(depth("index")).toBe(0)
    expect(depth("api")).toBe(1)
    expect(depth("orphan")).toBe(3)
  })
})
