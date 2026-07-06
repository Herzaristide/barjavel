// Types publics du package barjavel.
//
// Dans un projet consommateur, docs.config.ts peut importer ce type :
//
//   import type { DocsConfig } from "barjavel"
//   const config: DocsConfig = { title: "Ma doc", accent: "#7c3aed" }
//   export default config

import type { Plugin } from "vite"

export type { DocsConfig } from "./app/lib/config"

/** Plugin Vite (usage avancé ; le CLI `barjavel` le câble automatiquement). */
export function barjavel(options: { cwd: string; pkgDir: string }): Plugin
export default barjavel
