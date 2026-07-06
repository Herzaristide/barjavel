import { useEffect, useMemo, useRef, useState } from "react";
import { docs } from "../lib/content";

interface Props {
  onSelect: (slug: string) => void;
}

interface Hit {
  slug: string;
  title: string;
  excerpt: string;
  score: number;
}

// Index de recherche léger (titre + corps sans markdown).
const index = docs.map((d) => ({
  slug: d.slug,
  title: d.title,
  summary: d.summary,
  text: d.body.replace(/[#>*`_\-|[\]()!]/g, " ").replace(/\s+/g, " "),
  lower: `${d.title} ${d.summary} ${d.body}`.toLowerCase(),
}));

function search(q: string): Hit[] {
  const query = q.trim().toLowerCase();
  if (!query) return [];
  const terms = query.split(/\s+/);
  const hits: Hit[] = [];
  for (const doc of index) {
    let score = 0;
    for (const term of terms) {
      if (doc.title.toLowerCase().includes(term)) score += 5;
      if (doc.summary.toLowerCase().includes(term)) score += 2;
      const n = doc.lower.split(term).length - 1;
      score += Math.min(n, 6);
    }
    if (score === 0) continue;
    const pos = doc.text.toLowerCase().indexOf(terms[0]);
    const start = Math.max(0, pos - 40);
    const excerpt = `${start > 0 ? "…" : ""}${doc.text
      .slice(start, start + 140)
      .trim()}…`;
    hits.push({
      slug: doc.slug,
      title: doc.title,
      excerpt: pos >= 0 ? excerpt : doc.summary,
      score,
    });
  }
  return hits.sort((a, b) => b.score - a.score).slice(0, 8);
}

export function Search({ onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const hits = useMemo(() => search(q), [q]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: réinitialise le curseur à chaque requête
  useEffect(() => setCursor(0), [q]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) inputRef.current?.focus();
    else setQ("");
  }, [open]);

  const choose = (slug: string) => {
    onSelect(slug);
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        aria-label="Rechercher"
        onClick={() => setOpen(true)}
        className="grid h-10 w-10 place-items-center rounded-xl border border-line bg-panel/70 text-ink-dim backdrop-blur transition hover:border-ink-faint hover:text-ink"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
          <line
            x1="16.5"
            y1="16.5"
            x2="21"
            y2="21"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {open && (
        // biome-ignore lint/a11y/useKeyWithClickEvents: fermeture au clic sur le fond, doublée par Échap
        <div
          className="fixed inset-0 z-40 flex animate-fade justify-center bg-black/40 pt-[14vh] backdrop-blur-sm"
          onMouseDown={() => setOpen(false)}
        >
          <div
            className="flex h-fit max-h-[70vh] w-[min(620px,92vw)] flex-col overflow-hidden rounded-2xl border border-line bg-void/85 shadow-2xl backdrop-blur-md"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-line px-5">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                className="flex-none text-ink-faint"
                aria-hidden="true"
              >
                <circle
                  cx="11"
                  cy="11"
                  r="7"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <line
                  x1="16.5"
                  y1="16.5"
                  x2="21"
                  y2="21"
                  stroke="currentColor"
                  strokeWidth="2"
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
                  if (e.key === "ArrowDown")
                    setCursor((c) => Math.min(c + 1, hits.length - 1));
                  if (e.key === "ArrowUp") setCursor((c) => Math.max(c - 1, 0));
                  if (e.key === "Enter" && hits[cursor])
                    choose(hits[cursor].slug);
                }}
              />
            </div>
            <div className="overflow-y-auto p-1.5">
              {q && hits.length === 0 && (
                <div className="p-6 text-center text-sm text-ink-faint">
                  Aucun résultat
                </div>
              )}
              {hits.map((h, i) => (
                <button
                  key={h.slug}
                  type="button"
                  onMouseEnter={() => setCursor(i)}
                  onClick={() => choose(h.slug)}
                  className={`flex w-full flex-col gap-1 rounded-lg px-3.5 py-2.5 text-left transition ${
                    i === cursor ? "bg-panel" : ""
                  }`}
                >
                  <span className="flex items-center gap-2 text-[0.95rem] font-medium text-ink">
                    <span className="h-[7px] w-[7px] flex-none rounded-full bg-accent" />
                    {h.title}
                  </span>
                  <span className="overflow-hidden text-ellipsis whitespace-nowrap text-[0.82rem] text-ink-faint">
                    {h.excerpt}
                  </span>
                </button>
              ))}
            </div>
            <div className="border-t border-line px-4 py-2.5 text-[0.72rem] text-ink-faint">
              <kbd className="rounded border border-line bg-void px-1 py-0.5 font-mono">
                ↑
              </kbd>{" "}
              <kbd className="rounded border border-line bg-void px-1 py-0.5 font-mono">
                ↓
              </kbd>{" "}
              naviguer ·{" "}
              <kbd className="rounded border border-line bg-void px-1 py-0.5 font-mono">
                ↵
              </kbd>{" "}
              ouvrir ·{" "}
              <kbd className="rounded border border-line bg-void px-1 py-0.5 font-mono">
                Échap
              </kbd>{" "}
              fermer
            </div>
          </div>
        </div>
      )}
    </>
  );
}
