#!/usr/bin/env node
// CLI de Barjavel : `barjavel dev | build | preview`.
//
// Lance Vite via son API JS avec une configuration entièrement générée :
//   - root      = app/ du package (la « coquille » : index.html + moteur)
//   - contenu   = <cwd>/content/*.md  (fourni via le plugin barjavel)
//   - config    = <cwd>/docs.config.ts
//   - sortie    = <cwd>/dist
//
// Le projet consommateur n'a donc aucune config de build à maintenir.

import react from "@vitejs/plugin-react"
import autoprefixer from "autoprefixer"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import tailwindcss from "tailwindcss"
import { barjavel } from "../vite/plugin.mjs"

const pkgDir = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const appDir = join(pkgDir, "app")
const cwd = process.cwd()

// Tailwind ne scanne que le moteur (jeu de classes déterministe) ; le contenu
// Markdown est rendu via @tailwindcss/typography (classes `prose` connues).
const tailwindConfig = {
  ...(await import(join(pkgDir, "tailwind.config.js"))).default,
  content: [join(appDir, "index.html"), join(appDir, "**/*.{ts,tsx}")],
}

/** @param {string} command */
async function makeConfig(command) {
  return {
    configFile: false,
    root: appDir,
    // Chemins relatifs : le site fonctionne sous n'importe quel sous-chemin
    // (ex. GitHub Pages : https://user.github.io/repo/). Surchargable via --base.
    base: getFlag("--base") || "./",
    plugins: [react(), barjavel({ cwd, pkgDir })],
    // Le public/ du projet consommateur (icônes, etc.) l'emporte sur les défauts.
    publicDir: join(cwd, "public"),
    css: { postcss: { plugins: [tailwindcss(tailwindConfig), autoprefixer()] } },
    server: {
      fs: { allow: [cwd, pkgDir] }, // autorise l'import de docs.config.ts hors root
      port: Number(getFlag("--port")) || 5173,
      open: hasFlag("--open"),
    },
    build: {
      outDir: getFlag("--outDir") ? resolve(cwd, getFlag("--outDir")) : join(cwd, "dist"),
      emptyOutDir: true,
    },
    logLevel: command === "build" ? "info" : undefined,
  }
}

const args = process.argv.slice(2)
const command = args[0] || "dev"

function hasFlag(name) {
  return args.includes(name)
}
function getFlag(name) {
  const i = args.indexOf(name)
  return i !== -1 && args[i + 1] ? args[i + 1] : undefined
}

async function main() {
  const vite = await import("vite")

  if (command === "dev") {
    const server = await vite.createServer(await makeConfig("dev"))
    await server.listen()
    server.printUrls()
    server.bindCLIShortcuts({ print: true })
    return
  }

  if (command === "build") {
    await vite.build(await makeConfig("build"))
    return
  }

  if (command === "preview") {
    const server = await vite.preview(await makeConfig("preview"))
    server.printUrls()
    return
  }

  if (command === "--help" || command === "-h" || command === "help") {
    printHelp()
    return
  }

  console.error(`Commande inconnue : « ${command} »\n`)
  printHelp()
  process.exit(1)
}

function printHelp() {
  console.log(`
barjavel — générateur de documentation (Markdown + graphe de relations)

Usage :
  barjavel dev        Démarre le serveur de développement (HMR)
  barjavel build      Génère le site statique dans ./dist
  barjavel preview    Sert le dossier ./dist localement

Options :
  --base <chemin>     Chemin de base du site (défaut : ./)
  --port <n>          Port du serveur dev (défaut : 5173)
  --open              Ouvre le navigateur (dev)
  --outDir <dossier>  Dossier de sortie (défaut : dist)
`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
