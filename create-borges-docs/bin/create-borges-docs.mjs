#!/usr/bin/env node
// CLI de scaffolding pour Borges — génère une doc prête à l'emploi dans
// n'importe quel projet, sans dépendance externe (fonctionne à l'identique
// avec `npx create-borges-docs` et `bunx create-borges-docs`).

import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs"
import { createInterface } from "node:readline/promises"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { spawnSync } from "node:child_process"

const templateDir = join(dirname(fileURLToPath(import.meta.url)), "..", "template")

function parseArgs(argv) {
  const args = { _: [] }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === "--yes" || arg === "-y") args.yes = true
    else if (arg === "--force" || arg === "-f") args.force = true
    else if (arg === "--no-install") args.noInstall = true
    else if (arg === "--help" || arg === "-h") args.help = true
    else if (arg === "--title") args.title = argv[++i]
    else if (arg === "--pm") args.pm = argv[++i]
    else if (arg.startsWith("-")) console.warn(`Option inconnue ignorée : ${arg}`)
    else args._.push(arg)
  }
  return args
}

function printHelp() {
  console.log(`
create-borges-docs [répertoire] [options]

  répertoire        Dossier de destination (défaut : dossier courant)

Options :
  --title <titre>   Titre de la documentation (docs.config.ts)
  --pm <gestionnaire>  npm | bun | pnpm | yarn | none (défaut : auto-détecté)
  --no-install      Ne pas installer les dépendances automatiquement
  -y, --yes         Ne poser aucune question (répertoire non vide autorisé)
  -f, --force       Écrire même si le répertoire n'est pas vide
  -h, --help        Afficher cette aide
`)
}

// Détecte le gestionnaire de paquets ayant lancé la commande
// (npx -> npm_config_user_agent="npm/...", bunx -> "bun/...", etc.).
function detectPackageManager() {
  const ua = process.env.npm_config_user_agent ?? ""
  if (ua.startsWith("bun")) return "bun"
  if (ua.startsWith("pnpm")) return "pnpm"
  if (ua.startsWith("yarn")) return "yarn"
  if (ua.startsWith("npm")) return "npm"
  return "npm"
}

function installCommand(pm) {
  switch (pm) {
    case "bun":
      return { command: "bun", args: ["install"] }
    case "pnpm":
      return { command: "pnpm", args: ["install"] }
    case "yarn":
      return { command: "yarn", args: [] }
    default:
      return { command: "npm", args: ["install"] }
  }
}

function toPackageName(dirName) {
  const slug = dirName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-~]+/g, "-")
    .replace(/^-+|-+$/g, "")
  return slug || "ma-documentation"
}

async function confirm(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  const answer = await rl.question(`${question} (o/N) `)
  rl.close()
  return /^o(ui)?$/i.test(answer.trim())
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (args.help) {
    printHelp()
    return
  }

  const targetArg = args._[0] ?? "."
  const targetDir = resolve(process.cwd(), targetArg)
  const dirName = targetArg === "." ? "" : targetArg.split("/").filter(Boolean).pop()

  if (!existsSync(templateDir)) {
    console.error("Erreur : template introuvable dans ce package. Réinstallez create-borges-docs.")
    process.exitCode = 1
    return
  }

  if (existsSync(targetDir) && readdirSync(targetDir).length > 0 && !args.force) {
    if (args.yes) {
      console.warn(`⚠️  ${targetDir} n'est pas vide, poursuite (--yes).`)
    } else {
      const proceed = await confirm(`⚠️  ${targetDir || "."} n'est pas vide. Continuer quand même ?`)
      if (!proceed) {
        console.log("Annulé.")
        return
      }
    }
  }

  mkdirSync(targetDir, { recursive: true })
  cpSync(templateDir, targetDir, { recursive: true })

  // package.json : nom de projet dérivé du dossier cible.
  const pkgPath = join(targetDir, "package.json")
  const pkgName = toPackageName(dirName || "ma-documentation")
  writeFileSync(pkgPath, readFileSync(pkgPath, "utf8").replace("{{PROJECT_NAME}}", pkgName))

  // docs.config.ts : titre personnalisé si fourni.
  if (args.title) {
    const configPath = join(targetDir, "docs.config.ts")
    const current = readFileSync(configPath, "utf8")
    const updated = current.replace(/title: ".*?"/, `title: ${JSON.stringify(args.title)}`)
    writeFileSync(configPath, updated)
  }

  console.log(`✔ Documentation Borges créée dans ${targetDir || "."}`)

  const pm = args.pm ?? detectPackageManager()
  if (!args.noInstall && pm !== "none") {
    console.log(`\n📦 Installation des dépendances avec ${pm}…`)
    const { command, args: installArgs } = installCommand(pm)
    const result = spawnSync(command, installArgs, { cwd: targetDir, stdio: "inherit", shell: process.platform === "win32" })
    if (result.status !== 0) {
      console.warn(`⚠️  L'installation automatique a échoué. Lancez-la manuellement : ${command} ${installArgs.join(" ")}`)
    }
  }

  const relCd = targetDir === process.cwd() ? "" : `cd ${targetArg}\n`
  console.log(`
🎉 Prêt !

${relCd}${args.noInstall || pm === "none" ? `${pm === "bun" ? "bun install" : "npm install"}\n` : ""}${pm === "bun" ? "bun run dev" : "npm run dev"}

Puis ouvrez docs.config.ts pour changer le titre/la couleur, et déposez vos
fichiers Markdown dans content/.
`)
}

main().catch((err) => {
  console.error(err)
  process.exitCode = 1
})
