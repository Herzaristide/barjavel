import { type ReactNode, useRef, useState } from "react"

interface Props {
  children: ReactNode
}

// Bloc de code avec bouton « copier » (apparaît au survol).
export function CodeBlock({ children }: Props) {
  const preRef = useRef<HTMLPreElement>(null)
  const [copied, setCopied] = useState(false)

  const copy = () => {
    const text = preRef.current?.innerText ?? ""
    navigator.clipboard
      ?.writeText(text)
      .then(() => {
        setCopied(true)
        window.setTimeout(() => setCopied(false), 1500)
      })
      .catch(() => {
        // Presse-papiers refusé (permissions) : pas de retour visuel.
      })
  }

  return (
    <div className="group relative">
      <pre ref={preRef}>{children}</pre>
      <button
        type="button"
        onClick={copy}
        aria-label="Copier le code"
        className="k-btn absolute right-2.5 top-2.5 h-7 px-2.5 text-[0.72rem] opacity-0 focus:opacity-100 group-hover:opacity-100"
      >
        {copied ? (
          <>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <path
                d="M5 13l4 4L19 7"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Copié
          </>
        ) : (
          <>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <rect
                x="9"
                y="9"
                width="11"
                height="11"
                rx="2"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="M5 15V5a2 2 0 0 1 2-2h10"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            Copier
          </>
        )}
      </button>
    </div>
  )
}
