// Recherche plein texte légère (titre + résumé + corps sans markdown).

import type { Doc } from "./content"

export interface Hit {
  slug: string
  title: string
  excerpt: string
  score: number
}

export interface IndexEntry {
  slug: string
  title: string
  summary: string
  text: string
  lower: string
}

export function buildIndex(list: Doc[]): IndexEntry[] {
  return list.map((d) => ({
    slug: d.slug,
    title: d.title,
    summary: d.summary,
    text: d.body.replace(/[#>*`_\-|[\]()!]/g, " ").replace(/\s+/g, " "),
    lower: `${d.title} ${d.summary} ${d.body}`.toLowerCase(),
  }))
}

/** Les 8 meilleurs résultats : titre (5), résumé (2), occurrences (max 6) par terme. */
export function search(index: IndexEntry[], q: string): Hit[] {
  const query = q.trim().toLowerCase()
  if (!query) return []
  const terms = query.split(/\s+/)
  const hits: Hit[] = []
  for (const doc of index) {
    let score = 0
    for (const term of terms) {
      if (doc.title.toLowerCase().includes(term)) score += 5
      if (doc.summary.toLowerCase().includes(term)) score += 2
      const n = doc.lower.split(term).length - 1
      score += Math.min(n, 6)
    }
    if (score === 0) continue
    const pos = doc.text.toLowerCase().indexOf(terms[0])
    const start = Math.max(0, pos - 40)
    const excerpt = `${start > 0 ? "…" : ""}${doc.text.slice(start, start + 140).trim()}…`
    hits.push({
      slug: doc.slug,
      title: doc.title,
      excerpt: pos >= 0 ? excerpt : doc.summary,
      score,
    })
  }
  return hits.sort((a, b) => b.score - a.score).slice(0, 8)
}
