import { useCallback, useEffect, useState } from "react"
import { DocView } from "./components/DocView"
import { Background } from "./components/Background"
import { Graph } from "./components/Graph"
import { Search } from "./components/Search"
import { ThemeToggle } from "./components/ThemeToggle"
import { getDoc, rootSlug } from "./lib/content"
import { config } from "./lib/config"

function slugFromHash(): string {
  const raw = window.location.hash.replace(/^#\/?/, "").trim()
  return raw && getDoc(raw) ? raw : rootSlug
}

export function App() {
  const [active, setActive] = useState<string>(slugFromHash)

  useEffect(() => {
    const onHash = () => setActive(slugFromHash())
    window.addEventListener("hashchange", onHash)
    return () => window.removeEventListener("hashchange", onHash)
  }, [])

  const navigate = useCallback((slug: string) => {
    if (!getDoc(slug)) return
    window.location.hash = `/${slug}`
    setActive(slug)
    document.querySelector(".reader")?.scrollTo({ top: 0, behavior: "smooth" })
  }, [])

  const doc = getDoc(active)

  return (
    <div className="relative h-screen overflow-hidden">
      {/* Décor de fond (formes géométriques violet, repris du dashboard). */}
      <Background />

      {/* Le graphe occupe tout l'écran, en fond. */}
      <div className="absolute inset-0 z-0">
        <Graph active={active} onSelect={navigate} />
      </div>

      {/* Le texte flotte par-dessus (fond transparent, pas de séparation) :
          le graphe reste visible derrière lui. */}
      <main className="reader pointer-events-none absolute inset-y-0 left-0 z-10 w-full overflow-y-auto px-6 py-16 sm:px-10 lg:px-24 md:w-[62%]">
        {doc && <DocView doc={doc} onNavigate={navigate} />}
      </main>

      <div className="fixed right-5 top-5 z-30 flex items-center gap-2">
        <ThemeToggle />
        <Search onSelect={navigate} />
      </div>

      {config.footer && (
        <footer className="pointer-events-none fixed bottom-3 left-4 z-20 select-none text-[0.7rem] text-ink-faint">
          {config.footer}
        </footer>
      )}
    </div>
  )
}
