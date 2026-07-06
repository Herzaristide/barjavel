// Gestion du thème clair / sombre via la classe `dark` sur <html>.
// L'application initiale se fait dans un script inline (index.html) pour
// éviter tout flash au chargement.

export type Theme = "light" | "dark"
const KEY = "borges-theme"
const listeners = new Set<(t: Theme) => void>()

export function getTheme(): Theme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light"
}

export function setTheme(t: Theme): void {
  document.documentElement.classList.toggle("dark", t === "dark")
  try {
    localStorage.setItem(KEY, t)
  } catch {
    // stockage indisponible : on garde juste l'état en mémoire.
  }
  for (const fn of listeners) fn(t)
}

export function toggleTheme(): void {
  setTheme(getTheme() === "dark" ? "light" : "dark")
}

export function subscribe(fn: (t: Theme) => void): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
