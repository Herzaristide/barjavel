// Configuration du site de documentation.
//
// Toute la personnalisation se fait dans le fichier `docs.config.ts` à la
// racine du projet. Ce module lit cette configuration, la normalise et
// applique la couleur d'accent (une seule valeur hex suffit) au thème.

// Le plugin Vite `barjavel` expose ici le docs.config.ts du projet consommateur.
import userConfig from "virtual:barjavel-config"
import { getTheme } from "./theme"

export interface DocsConfig {
  /** Titre du site (onglet du navigateur + méta). */
  title: string
  /** Description courte (méta description). */
  description?: string
  /** Langue de la page (`<html lang>`). Défaut : "fr". */
  lang?: string
  /**
   * Couleur d'accent unique, au format hex (ex. "#7c3aed").
   * Utilisée pour les deux thèmes si `accentDark` / `accentLight` sont absents.
   */
  accent: string
  /** Accent spécifique au thème sombre (optionnel, hex). */
  accentDark?: string
  /** Accent spécifique au thème clair (optionnel, hex). */
  accentLight?: string
  /** Texte de pied de page optionnel (affiché discrètement). */
  footer?: string
}

export const config: DocsConfig = userConfig

const accentDarkHex = config.accentDark ?? config.accent
const accentLightHex = config.accentLight ?? config.accent

/** Convertit "#7c3aed" ou "7c3aed" en triplet "124 58 237" (pour rgb()). */
export function hexToRgbTriplet(hex: string): string {
  let h = hex.trim().replace(/^#/, "")
  if (h.length === 3) {
    h = h
      .split("")
      .map((c) => c + c)
      .join("")
  }
  const int = Number.parseInt(h, 16)
  if (h.length !== 6 || Number.isNaN(int)) {
    // Repli : le cuivre de karenine, pour éviter une couleur cassée si l'hex est invalide.
    return "212 163 95"
  }
  const r = (int >> 16) & 255
  const g = (int >> 8) & 255
  const b = int & 255
  return `${r} ${g} ${b}`
}

/** Accent hex courant en fonction du thème actif (pour Mermaid). */
export function currentAccentHex(): string {
  return getTheme() === "dark" ? accentDarkHex : accentLightHex
}

/**
 * Applique la configuration au document : variables CSS d'accent (par thème),
 * titre de l'onglet, langue et méta description. À appeler avant le rendu.
 */
export function applyConfig(): void {
  const root = document.documentElement
  root.style.setProperty("--accent-dark", hexToRgbTriplet(accentDarkHex))
  root.style.setProperty("--accent-light", hexToRgbTriplet(accentLightHex))

  if (config.lang) root.setAttribute("lang", config.lang)
  document.title = config.title

  if (config.description) {
    let meta = document.querySelector('meta[name="description"]')
    if (!meta) {
      meta = document.createElement("meta")
      meta.setAttribute("name", "description")
      document.head.appendChild(meta)
    }
    meta.setAttribute("content", config.description)
  }
}
