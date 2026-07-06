import { useEffect, useState } from "react"
import { getTheme, subscribe, toggleTheme } from "../lib/theme"

export function ThemeToggle() {
  const [theme, setThemeState] = useState(getTheme)

  useEffect(() => subscribe(setThemeState), [])

  const isDark = theme === "dark"

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Passer en thème clair" : "Passer en thème sombre"}
      className="grid h-10 w-10 place-items-center rounded-xl border border-line bg-panel/70 text-ink-dim backdrop-blur transition hover:border-ink-faint hover:text-ink"
    >
      {isDark ? (
        // Soleil
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
          <path
            d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      ) : (
        // Lune
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path
            d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  )
}
