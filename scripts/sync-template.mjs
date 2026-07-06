#!/usr/bin/env node
// Synchronise le template embarqué dans `create-borges-docs/template/` à
// partir des sources de ce dépôt (racine = "source de vérité").
//
// À exécuter après toute modification de src/, content/, public/ ou des
// fichiers de config, et avant de publier le package `create-borges-docs`.
//
// Usage : node scripts/sync-template.mjs

import { cpSync, mkdirSync, readFileSync, writeFileSync, rmSync, existsSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..")
const templateDir = join(rootDir, "create-borges-docs", "template")

// Fichiers/dossiers copiés tels quels depuis la racine du dépôt.
const COPY_PATHS = [
  "src",
  "content",
  "public",
  ".github/workflows/ci.yml",
  ".github/workflows/deploy.yml",
  "index.html",
  "docs.config.ts",
  "postcss.config.js",
  "tailwind.config.js",
  "tsconfig.json",
  "vite.config.ts",
  ".gitignore",
  ".prettierrc",
  ".prettierignore",
]

// On ne supprime que les chemins gérés par ce script (pas tout le dossier :
// `template/README.md` est rédigé à la main pour les utilisateurs du CLI).
mkdirSync(templateDir, { recursive: true })
for (const relPath of COPY_PATHS) {
  rmSync(join(templateDir, relPath), { recursive: true, force: true })
  const src = join(rootDir, relPath)
  if (!existsSync(src)) continue
  cpSync(src, join(templateDir, relPath), { recursive: true })
}

// package.json du template : dérivé de celui de la racine, avec un nom
// substituable par le CLI et une version de départ neutre.
const rootPkg = JSON.parse(readFileSync(join(rootDir, "package.json"), "utf8"))
const templatePkg = {
  name: "{{PROJECT_NAME}}",
  private: true,
  version: "0.1.0",
  type: rootPkg.type,
  description: rootPkg.description,
  scripts: rootPkg.scripts,
  dependencies: rootPkg.dependencies,
  devDependencies: rootPkg.devDependencies,
}
writeFileSync(join(templateDir, "package.json"), JSON.stringify(templatePkg, null, 2) + "\n")

console.log(`✔ Template synchronisé dans ${templateDir}`)
