// Chargement des markdowns de documentation (fournis par le plugin Vite
// `barjavel` depuis le dossier content/ du projet), parsing du frontmatter
// maison, et dérivation du graphe de relations à partir du champ `links`.

// Le contenu vit dans le projet consommateur (<cwd>/content/*.md) ; le plugin
// Vite `barjavel` l'expose ici sous forme { slug: markdown brut }.
import { raw as modules } from "virtual:barjavel-content"

export interface Doc {
  slug: string
  title: string
  group: string
  summary: string
  links: string[]
  body: string
}

export interface Edge {
  source: string
  target: string
}

export function parseFrontmatter(raw: string): {
  data: Record<string, string | string[]>
  body: string
} {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(raw)
  if (!match) return { data: {}, body: raw }

  const data: Record<string, string | string[]> = {}
  for (const line of match[1].split(/\r?\n/)) {
    const idx = line.indexOf(":")
    if (idx === -1) continue
    const key = line.slice(0, idx).trim()
    const value = line.slice(idx + 1).trim()
    if (value.startsWith("[") && value.endsWith("]")) {
      data[key] = value
        .slice(1, -1)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    } else {
      data[key] = value.replace(/^["']|["']$/g, "")
    }
  }
  return { data, body: raw.slice(match[0].length) }
}

/** Transforme { slug: markdown brut } en documents triés par titre. */
export function toDocs(sources: Record<string, string>): Doc[] {
  return Object.entries(sources)
    .map(([slug, raw]) => {
      const { data, body } = parseFrontmatter(raw)
      return {
        slug,
        title: (data.title as string) || slug,
        group: (data.group as string) || "default",
        summary: (data.summary as string) || "",
        links: (data.links as string[]) || [],
        body,
      }
    })
    .sort((a, b) => a.title.localeCompare(b.title, "fr"))
}

/** Arêtes non orientées et dédupliquées (liens vers des pages inconnues ignorés). */
export function buildEdges(list: Doc[]): Edge[] {
  const known = new Set(list.map((d) => d.slug))
  const seen = new Set<string>()
  const out: Edge[] = []
  for (const doc of list) {
    for (const target of doc.links) {
      if (!known.has(target) || target === doc.slug) continue
      const key = [doc.slug, target].sort((a, b) => a.localeCompare(b)).join("|")
      if (seen.has(key)) continue
      seen.add(key)
      out.push({ source: doc.slug, target })
    }
  }
  return out
}

const degreeIn = (list: Edge[], slug: string): number =>
  list.filter((e) => e.source === slug || e.target === slug).length

/** L'entrée par défaut : `index` si présent, sinon le plus connecté. */
export function pickRoot(list: Doc[], links: Edge[]): string {
  if (list.some((d) => d.slug === "index")) return "index"
  return [...list].sort((a, b) => degreeIn(links, b.slug) - degreeIn(links, a.slug))[0]?.slug ?? ""
}

/** Distance (BFS) de chaque page à la racine sur le graphe non orienté. */
export function computeDistances(list: Doc[], links: Edge[], root: string): Map<string, number> {
  const adjacency = new Map<string, string[]>()
  for (const d of list) adjacency.set(d.slug, [])
  for (const e of links) {
    adjacency.get(e.source)?.push(e.target)
    adjacency.get(e.target)?.push(e.source)
  }
  const dist = new Map<string, number>()
  if (!root) return dist
  dist.set(root, 0)
  const queue = [root]
  while (queue.length) {
    const cur = queue.shift()!
    const d = dist.get(cur)!
    for (const next of adjacency.get(cur) ?? []) {
      if (!dist.has(next)) {
        dist.set(next, d + 1)
        queue.push(next)
      }
    }
  }
  return dist
}

export const docs: Doc[] = toDocs(modules)

const bySlug = new Map(docs.map((d) => [d.slug, d]))
export const getDoc = (slug: string): Doc | undefined => bySlug.get(slug)

export const edges: Edge[] = buildEdges(docs)

export const degree = (slug: string): number => degreeIn(edges, slug)

export const rootSlug: string = pickRoot(docs, edges)

// Profondeur dans l'arborescence : distance au nœud racine. 0 = vue globale
// (la plus importante) ; plus une note est spécifique, plus elle s'en éloigne
// — ce qui sert à dimensionner les nœuds.
const distances = computeDistances(docs, edges, rootSlug)

// Profondeur d'une note (les notes non reliées à la racine sont reléguées au fond).
export const depth = (slug: string): number => distances.get(slug) ?? 3
