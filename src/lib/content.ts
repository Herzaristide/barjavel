// Chargement des markdowns de documentation au build (Vite glob),
// parsing du frontmatter maison (pas de dépendance Node dans le navigateur),
// et dérivation du graphe de relations à partir du champ `links`.

export interface Doc {
  slug: string;
  title: string;
  group: string;
  summary: string;
  links: string[];
  body: string;
}

export interface Edge {
  source: string;
  target: string;
}

function parseFrontmatter(raw: string): {
  data: Record<string, string | string[]>;
  body: string;
} {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(raw);
  if (!match) return { data: {}, body: raw };

  const data: Record<string, string | string[]> = {};
  for (const line of match[1].split(/\r?\n/)) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    if (value.startsWith("[") && value.endsWith("]")) {
      data[key] = value
        .slice(1, -1)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    } else {
      data[key] = value.replace(/^["']|["']$/g, "");
    }
  }
  return { data, body: raw.slice(match[0].length) };
}

const modules = import.meta.glob("../../content/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

export const docs: Doc[] = Object.entries(modules)
  .map(([path, raw]) => {
    const slug = path.split("/").pop()!.replace(/\.md$/, "");
    const { data, body } = parseFrontmatter(raw);
    return {
      slug,
      title: (data.title as string) || slug,
      group: (data.group as string) || "default",
      summary: (data.summary as string) || "",
      links: (data.links as string[]) || [],
      body,
    };
  })
  .sort((a, b) => a.title.localeCompare(b.title, "fr"));

const bySlug = new Map(docs.map((d) => [d.slug, d]));
export const getDoc = (slug: string): Doc | undefined => bySlug.get(slug);

// Arêtes non orientées et dédupliquées.
export const edges: Edge[] = (() => {
  const known = new Set(docs.map((d) => d.slug));
  const seen = new Set<string>();
  const out: Edge[] = [];
  for (const doc of docs) {
    for (const target of doc.links) {
      if (!known.has(target) || target === doc.slug) continue;
      const key = [doc.slug, target].sort().join("|");
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ source: doc.slug, target });
    }
  }
  return out;
})();

export const degree = (slug: string): number =>
  edges.filter((e) => e.source === slug || e.target === slug).length;

// L'entrée par défaut : `index` si présent, sinon le plus connecté.
export const rootSlug: string =
  getDoc("index")?.slug ??
  [...docs].sort((a, b) => degree(b.slug) - degree(a.slug))[0]?.slug ??
  "";

// Profondeur dans l'arborescence : distance (BFS) au nœud racine sur le graphe.
// 0 = VisionForge (vue globale, la plus importante) ; plus une note est
// spécifique, plus elle s'en éloigne — ce qui sert à dimensionner les nœuds.
const distances: Map<string, number> = (() => {
  const adjacency = new Map<string, string[]>();
  for (const d of docs) adjacency.set(d.slug, []);
  for (const e of edges) {
    adjacency.get(e.source)?.push(e.target);
    adjacency.get(e.target)?.push(e.source);
  }
  const dist = new Map<string, number>();
  if (rootSlug) {
    dist.set(rootSlug, 0);
    const queue = [rootSlug];
    while (queue.length) {
      const cur = queue.shift()!;
      const d = dist.get(cur)!;
      for (const next of adjacency.get(cur) ?? []) {
        if (!dist.has(next)) {
          dist.set(next, d + 1);
          queue.push(next);
        }
      }
    }
  }
  return dist;
})();

// Profondeur d'une note (les notes non reliées à la racine sont reléguées au fond).
export const depth = (slug: string): number => distances.get(slug) ?? 3;
