// Chargement paresseux de Mermaid : la lib (~500 kB) n'est téléchargée que
// lorsqu'une page contient réellement un diagramme, dans un chunk séparé.
// Les couleurs suivent le thème (clair/sombre), avec la couleur d'accent
// configurée dans docs.config.ts.

import { currentAccentHex } from "./config"
import type { Theme } from "./theme"

type MermaidApi = {
  initialize: (config: unknown) => void
  render: (id: string, code: string) => Promise<{ svg: string }>
}

let mermaidPromise: Promise<MermaidApi> | null = null

function load(): Promise<MermaidApi> {
  if (!mermaidPromise) {
    mermaidPromise = import("mermaid").then((mod) => mod.default as unknown as MermaidApi)
  }
  return mermaidPromise
}

function themeVariables(theme: Theme) {
  const accent = currentAccentHex()
  if (theme === "dark") {
    return {
      background: "#0a0a0b",
      primaryColor: "#16171c",
      primaryBorderColor: "#3a3b42",
      primaryTextColor: "#e8e8ea",
      secondaryColor: "#101014",
      tertiaryColor: "#0d0d10",
      lineColor: "#6b7280",
      textColor: "#cfd2d8",
      clusterBkg: "#0e0e12",
      clusterBorder: "#26272d",
      edgeLabelBackground: "#131317",
      nodeBorder: "#3a3b42",
      mainBkg: "#16171c",
      actorBkg: "#16171c",
      actorBorder: "#3a3b42",
      actorTextColor: "#e8e8ea",
      signalColor: accent,
      signalTextColor: "#cfd2d8",
      labelBoxBkgColor: "#16171c",
      labelBoxBorderColor: accent,
      noteBkgColor: "#1c1d23",
      noteTextColor: "#cfd2d8",
      noteBorderColor: "#33343b",
    }
  }
  return {
    background: "#ffffff",
    primaryColor: "#ffffff",
    primaryBorderColor: "#d4d4d8",
    primaryTextColor: "#18181b",
    secondaryColor: "#f4f4f5",
    tertiaryColor: "#fafafa",
    lineColor: "#a1a1aa",
    textColor: "#3f3f46",
    clusterBkg: "#fafafa",
    clusterBorder: "#e4e4e7",
    edgeLabelBackground: "#ffffff",
    nodeBorder: "#d4d4d8",
    mainBkg: "#ffffff",
    actorBkg: "#ffffff",
    actorBorder: "#d4d4d8",
    actorTextColor: "#18181b",
    signalColor: accent,
    signalTextColor: "#3f3f46",
    labelBoxBkgColor: "#ffffff",
    labelBoxBorderColor: accent,
    noteBkgColor: "#fff7ed",
    noteTextColor: "#3f3f46",
    noteBorderColor: "#fed7aa",
  }
}

let counter = 0
export function renderMermaid(code: string, theme: Theme): Promise<string> {
  const id = `mmd-${counter++}`
  return load().then((mermaid) => {
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: "loose",
      theme: "base",
      fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif',
      themeVariables: themeVariables(theme),
    })
    return mermaid.render(id, code).then((r) => r.svg)
  })
}
