import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"

interface Props {
  svg: string
  onClose: () => void
}

interface Transform {
  x: number
  y: number
  s: number
}

const clampScale = (s: number) => Math.min(Math.max(s, 0.2), 8)

export function DiagramModal({ svg, onClose }: Props) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [t, setT] = useState<Transform>({ x: 0, y: 0, s: 1 })
  const tRef = useRef(t)
  tRef.current = t
  const drag = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null)

  // Ajuste le diagramme à l'écran (au montage et via le bouton « Ajuster »).
  const fitToScreen = useCallback(() => {
    const vp = viewportRef.current
    const ct = contentRef.current
    const svgEl = ct?.querySelector("svg")
    if (!vp || !svgEl) return
    const rect = svgEl.getBoundingClientRect()
    // Taille naturelle, indépendante du zoom courant.
    const nw = rect.width / tRef.current.s
    const nh = rect.height / tRef.current.s
    const cw = vp.clientWidth
    const ch = vp.clientHeight
    const s = clampScale(Math.min((cw - 96) / nw, (ch - 96) / nh, 3))
    setT({ s, x: (cw - nw * s) / 2, y: (ch - nh * s) / 2 })
  }, [])

  useLayoutEffect(() => {
    fitToScreen()
  }, [fitToScreen])

  // Molette : zoom centré sur le curseur (listener natif non passif).
  useEffect(() => {
    const vp = viewportRef.current
    if (!vp) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const rect = vp.getBoundingClientRect()
      const px = e.clientX - rect.left
      const py = e.clientY - rect.top
      setT((prev) => {
        const ns = clampScale(prev.s * Math.exp(-e.deltaY * 0.0015))
        const k = ns / prev.s
        return { s: ns, x: px - (px - prev.x) * k, y: py - (py - prev.y) * k }
      })
    }
    vp.addEventListener("wheel", onWheel, { passive: false })
    return () => vp.removeEventListener("wheel", onWheel)
  }, [])

  // Échap pour fermer + verrouillage du scroll de la page.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      if (e.key === "+" || e.key === "=") zoomBy(1.25)
      if (e.key === "-") zoomBy(1 / 1.25)
      if (e.key === "0") fitToScreen()
    }
    window.addEventListener("keydown", onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      window.removeEventListener("keydown", onKey)
      document.body.style.overflow = prevOverflow
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Zoom centré sur le viewport (boutons + / − et clavier).
  const zoomBy = (factor: number) => {
    const vp = viewportRef.current
    if (!vp) return
    const cx = vp.clientWidth / 2
    const cy = vp.clientHeight / 2
    setT((prev) => {
      const ns = clampScale(prev.s * factor)
      const k = ns / prev.s
      return { s: ns, x: cx - (cx - prev.x) * k, y: cy - (cy - prev.y) * k }
    })
  }

  const onPointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { x: e.clientX, y: e.clientY, tx: t.x, ty: t.y }
  }
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current
    if (!d) return
    setT((prev) => ({
      ...prev,
      x: d.tx + (e.clientX - d.x),
      y: d.ty + (e.clientY - d.y),
    }))
  }
  const onPointerUp = () => {
    drag.current = null
  }

  const btn =
    "grid h-[34px] min-w-[34px] place-items-center rounded-lg border border-transparent px-2.5 text-ink-dim transition hover:bg-void hover:text-ink"

  return (
    <div
      className="fixed inset-0 z-[60] flex animate-fade items-center justify-center bg-black/40 p-4 backdrop-blur-sm sm:p-8"
      role="dialog"
      aria-modal="true"
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="relative h-[80vh] w-[88vw] max-w-5xl overflow-hidden rounded-2xl border border-line bg-void/85 shadow-2xl backdrop-blur-md">
        <div className="absolute right-4 top-4 z-[2] flex gap-1.5 rounded-xl border border-line bg-panel/85 p-1.5 backdrop-blur">
          <button
            type="button"
            onClick={() => zoomBy(1 / 1.25)}
            aria-label="Dézoomer"
            className={`${btn} text-lg`}
          >
            −
          </button>
          <button
            type="button"
            onClick={() => zoomBy(1.25)}
            aria-label="Zoomer"
            className={`${btn} text-lg`}
          >
            +
          </button>
          <button type="button" onClick={fitToScreen} className={`${btn} text-sm`}>
            Ajuster
          </button>
          <button type="button" onClick={onClose} aria-label="Fermer" className={`${btn} text-ink`}>
            ✕
          </button>
        </div>

        <div
          className="absolute inset-0 cursor-grab touch-none overflow-hidden active:cursor-grabbing [&_svg]:!max-w-none"
          ref={viewportRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        >
          <div
            className="absolute left-0 top-0 will-change-transform"
            ref={contentRef}
            style={{
              transform: `translate(${t.x}px, ${t.y}px) scale(${t.s})`,
              transformOrigin: "0 0",
            }}
            // biome-ignore lint/security/noDangerouslySetInnerHtml: SVG généré par Mermaid
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        </div>

        <div className="absolute bottom-4 left-1/2 z-[2] -translate-x-1/2 rounded-full border border-line bg-panel/80 px-3.5 py-1.5 text-[0.78rem] text-ink-faint backdrop-blur">
          Molette pour zoomer · glisser pour déplacer ·{" "}
          <kbd className="rounded border border-line bg-void px-1 font-mono">Échap</kbd> pour fermer
        </div>
      </div>
    </div>
  )
}
