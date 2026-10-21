import { useEffect, useMemo, useRef, useState } from "react"
import { docs } from "../lib/content"
import { buildIndex, search } from "../lib/search"

interface Props {
  onSelect: (slug: string) => void
}

// Index de recherche léger, construit une seule fois.
const index = buildIndex(docs)

export function Search({ onSelect }: Props) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState("")
  const [cursor, setCursor] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const hits = useMemo(() => search(index, q), [q])

  // biome-ignore lint/correctness/useExhaustiveDependencies: réinitialise le curseur à chaque requête
  useEffect(() => setCursor(0), [q])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setOpen((v) => !v)
      }
      if (e.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  useEffect(() => {
    if (open) inputRef.current?.focus()
    else setQ("")
  }, [open])

  const choose = (slug: string) => {
    onSelect(slug)
    setOpen(false)
  }

  return (
    <>
      <button
        type="button"
        aria-label="Rechercher"
        onClick={() => setOpen(true)}
        className="k-btn h-[34px] w-[34px]"
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.6" />
          <line
            x1="16.5"
            y1="16.5"
            x2="21"
            y2="21"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {open && (
        // biome-ignore lint/a11y/useKeyWithClickEvents: fermeture au clic sur le fond, doublée par Échap
        <div
          className="fixed inset-0 z-40 flex animate-fade justify-center bg-black/40 pt-[14vh]"
          onMouseDown={() => setOpen(false)}
        >
          <div
            className="k-card flex h-fit max-h-[70vh] w-[min(620px,92vw)] flex-col overflow-hidden shadow-2xl"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="mx-3 flex items-center gap-3 border-b border-line px-2">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                className="flex-none text-ink-faint"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.6" />
                <line
                  x1="16.5"
                  y1="16.5"
                  x2="21"
                  y2="21"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
              <input
                ref={inputRef}
                className="w-full bg-transparent py-4 text-lg text-ink outline-none placeholder:text-ink-faint"
                placeholder="Rechercher dans la documentation…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") setCursor((c) => Math.min(c + 1, hits.length - 1))
                  if (e.key === "ArrowUp") setCursor((c) => Math.max(c - 1, 0))
                  if (e.key === "Enter" && hits[cursor]) choose(hits[cursor].slug)
                }}
              />
            </div>
            <div className="overflow-y-auto p-2">
              {q && hits.length === 0 && (
                <div className="p-6 text-center text-sm text-ink-faint">Aucun résultat</div>
              )}
              {hits.length > 0 && <div className="k-label px-3 pb-1.5 pt-1">Pages</div>}
              {hits.map((h, i) => (
                <button
                  key={h.slug}
                  type="button"
                  onMouseEnter={() => setCursor(i)}
                  onClick={() => choose(h.slug)}
                  className={`flex w-full flex-col gap-0.5 rounded-lg px-3 py-2.5 text-left transition duration-150 ease-out ${
                    i === cursor ? "bg-accent/15" : ""
                  }`}
                >
                  <span className="flex items-center gap-2 text-[0.92rem] font-medium text-ink">
                    {h.title}
                  </span>
                  <span className="overflow-hidden text-ellipsis whitespace-nowrap text-[0.8rem] text-ink-dim">
                    {h.excerpt}
                  </span>
                </button>
              ))}
            </div>
            <div className="mx-3 border-t border-line px-2 py-2.5 text-[0.72rem] text-ink-faint">
              <kbd className="k-kbd">↑</kbd> <kbd className="k-kbd">↓</kbd> naviguer ·{" "}
              <kbd className="k-kbd">↵</kbd> ouvrir · <kbd className="k-kbd">Échap</kbd> fermer
            </div>
          </div>
        </div>
      )}
    </>
  )
}
