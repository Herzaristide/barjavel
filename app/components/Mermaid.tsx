import { useEffect, useState } from "react"
import { renderMermaid } from "../lib/mermaid"
import { getTheme, subscribe } from "../lib/theme"
import { DiagramModal } from "./DiagramModal"

interface Props {
  code: string
}

export function Mermaid({ code }: Props) {
  const [svg, setSvg] = useState<string>("")
  const [error, setError] = useState<string>("")
  const [open, setOpen] = useState(false)
  const [theme, setThemeState] = useState(getTheme)

  // Re-render du diagramme quand le thème change.
  useEffect(() => subscribe(setThemeState), [])

  useEffect(() => {
    let cancelled = false
    setError("")
    renderMermaid(code, theme)
      .then((out) => {
        if (!cancelled) setSvg(out)
      })
      .catch((err) => {
        if (!cancelled) setError(String(err?.message ?? err))
      })
    return () => {
      cancelled = true
    }
  }, [code, theme])

  if (error) {
    return (
      <pre className="rounded-[14px] border border-[#c46a5a]/50">
        <code>{code}</code>
      </pre>
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={() => svg && setOpen(true)}
        aria-label="Agrandir le diagramme"
        disabled={!svg}
        className="group relative my-7 block w-full cursor-zoom-in overflow-x-auto rounded-[14px] bg-panel/60 p-6 text-center transition duration-150 ease-out hover:bg-panel"
      >
        <span className="pointer-events-none absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-lg bg-ink/[0.07] text-ink-dim opacity-0 transition-opacity group-hover:opacity-100">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <path
              d="M9 3H4v5M15 3h5v5M9 21H4v-5M15 21h5v-5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <div
          className="mermaid-svg"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: SVG généré par Mermaid
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      </button>
      {open && <DiagramModal svg={svg} onClose={() => setOpen(false)} />}
    </>
  )
}
