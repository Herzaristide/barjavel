/// <reference types="vite/client" />

// Modules virtuels fournis par le plugin Vite `barjavel` (vite/plugin.mjs).
// Le contenu et la configuration vivent dans le projet consommateur ; ces
// déclarations donnent le typage côté moteur.

declare module "virtual:barjavel-content" {
  /** Markdown brut de chaque page, indexé par slug (nom de fichier sans .md). */
  export const raw: Record<string, string>
}

declare module "virtual:barjavel-config" {
  import type { DocsConfig } from "./config"
  const config: DocsConfig
  export default config
}
