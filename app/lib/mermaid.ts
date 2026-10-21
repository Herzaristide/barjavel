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
  // Les neutres de karenine (palette Ajar) : l'encre en sombre, le papier en clair.
  if (theme === "dark") {
    return {
      background: "#1b1a18",
      primaryColor: "#262421",
      primaryBorderColor: "#393733",
      primaryTextColor: "#d9d2c5",
      secondaryColor: "#2a2825",
      tertiaryColor: "#201f1d",
      lineColor: "#6b645a",
      textColor: "#d9d2c5",
      clusterBkg: "#201f1d",
      clusterBorder: "#2a2926",
      edgeLabelBackground: "#1b1a18",
      nodeBorder: "#393733",
      mainBkg: "#262421",
      actorBkg: "#262421",
      actorBorder: "#393733",
      actorTextColor: "#d9d2c5",
      signalColor: accent,
      signalTextColor: "#d9d2c5",
      labelBoxBkgColor: "#262421",
      labelBoxBorderColor: accent,
      noteBkgColor: "#34312d",
      noteTextColor: "#d9d2c5",
      noteBorderColor: "#4a463f",
    }
  }
  return {
    background: "#f5f0e6",
    primaryColor: "#ebe4d6",
    primaryBorderColor: "#d5d0c6",
    primaryTextColor: "#2a2521",
    secondaryColor: "#efe9dd",
    tertiaryColor: "#f2ece1",
    lineColor: "#a39887",
    textColor: "#2a2521",
    clusterBkg: "#f0eadf",
    clusterBorder: "#e5e0d6",
    edgeLabelBackground: "#f5f0e6",
    nodeBorder: "#d5d0c6",
    mainBkg: "#ebe4d6",
    actorBkg: "#ebe4d6",
    actorBorder: "#d5d0c6",
    actorTextColor: "#2a2521",
    signalColor: accent,
    signalTextColor: "#2a2521",
    labelBoxBkgColor: "#ebe4d6",
    labelBoxBorderColor: accent,
    noteBkgColor: "#e6dcc8",
    noteTextColor: "#2a2521",
    noteBorderColor: "#d0c3a9",
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
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      themeVariables: themeVariables(theme),
    })
    return mermaid.render(id, code).then((r) => r.svg)
  })
}
