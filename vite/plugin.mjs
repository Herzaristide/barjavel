// Plugin Vite de Barjavel : c'est lui qui « inverse » le flux.
//
// Le moteur (app/) vit dans le package, mais le contenu et la configuration
// vivent dans le projet consommateur (son cwd). Ce plugin fait le pont via
// des modules virtuels et génère les artefacts PWA (manifest, service worker,
// icônes) à partir de `docs.config.ts`.
//
//   virtual:barjavel-content  → { raw: { <slug>: "<markdown brut>" } }
//   virtual:barjavel-config   → export default de <cwd>/docs.config.ts
//
import { build as esbuild } from "esbuild"
import { existsSync, readdirSync, readFileSync } from "node:fs"
import { extname, join } from "node:path"

const CONTENT_ID = "virtual:barjavel-content"
const CONFIG_ID = "virtual:barjavel-config"
const RESOLVED_CONTENT = "\0" + CONTENT_ID
const RESOLVED_CONFIG = "\0" + CONFIG_ID

// Icônes par défaut embarquées dans le package, servies/émises seulement si
// le projet consommateur ne fournit pas les siennes dans public/.
const DEFAULT_ICONS = [
  "icons/icon.svg",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-maskable-512.png",
]

const MIME = {
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".js": "text/javascript",
  ".webmanifest": "application/manifest+json",
}

/**
 * @param {{ cwd: string, pkgDir: string }} options
 *   cwd    : racine du projet consommateur (contenu + config).
 *   pkgDir : racine du package barjavel (moteur + assets par défaut).
 */
export function barjavel({ cwd, pkgDir }) {
  const contentDir = join(cwd, "content")
  const configFile = join(cwd, "docs.config.ts")
  const assetsDir = join(pkgDir, "assets")

  /** @type {any} Config du projet, chargée une seule fois (esbuild). */
  let configCache

  async function getConfig() {
    if (configCache) return configCache
    if (!existsSync(configFile)) {
      configCache = { title: "Documentation", accent: "#7c3aed", lang: "fr" }
      return configCache
    }
    const res = await esbuild({
      entryPoints: [configFile],
      bundle: true,
      format: "esm",
      write: false,
      platform: "neutral",
      logLevel: "silent",
    })
    const code = res.outputFiles[0].text
    const url = "data:text/javascript;base64," + Buffer.from(code).toString("base64")
    configCache = (await import(url)).default
    return configCache
  }

  async function manifestSource() {
    const c = await getConfig()
    return JSON.stringify(
      {
        name: c.title,
        short_name: c.title,
        description: c.description || "",
        start_url: "./",
        scope: "./",
        display: "standalone",
        background_color: "#0a0a0a",
        theme_color: c.accent,
        lang: c.lang || "fr",
        icons: [
          { src: "icons/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          {
            src: "icons/icon-maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      null,
      2,
    )
  }

  const swSource = () => readFileSync(join(assetsDir, "sw.js"))
  const consumerHasPublic = (rel) => existsSync(join(cwd, "public", rel))

  function readContent() {
    if (!existsSync(contentDir)) return {}
    const out = {}
    for (const file of readdirSync(contentDir)) {
      if (!file.endsWith(".md")) continue
      out[file.replace(/\.md$/, "")] = readFileSync(join(contentDir, file), "utf8")
    }
    return out
  }

  return {
    name: "barjavel",

    resolveId(id) {
      if (id === CONTENT_ID) return RESOLVED_CONTENT
      if (id === CONFIG_ID) return RESOLVED_CONFIG
    },

    load(id) {
      if (id === RESOLVED_CONTENT) {
        return `export const raw = ${JSON.stringify(readContent())}`
      }
      if (id === RESOLVED_CONFIG) {
        const p = configFile.replace(/\\/g, "/")
        return `export { default } from ${JSON.stringify(p)}`
      }
    },

    // Injecte titre, description, couleur d'accent et langue depuis docs.config.ts.
    transformIndexHtml: {
      order: "pre",
      async handler(html) {
        const c = await getConfig()
        const esc = (s) =>
          String(s || "")
            .replace(/</g, "&lt;")
            .replace(/"/g, "&quot;")
        html = html
          .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(c.title)}</title>`)
          .replace(/<html([^>]*)\slang="[^"]*"/, `<html$1 lang="${esc(c.lang || "fr")}"`)
        return {
          html,
          tags: [
            {
              tag: "meta",
              attrs: { name: "description", content: esc(c.description) },
              injectTo: "head",
            },
            {
              tag: "meta",
              attrs: { name: "theme-color", content: esc(c.accent) },
              injectTo: "head",
            },
            {
              tag: "meta",
              attrs: { name: "apple-mobile-web-app-title", content: esc(c.title) },
              injectTo: "head",
            },
          ],
        }
      },
    },

    // Dev : HMR sur le contenu + service des artefacts générés (manifest/sw/icônes).
    configureServer(server) {
      server.watcher.add(contentDir)
      const reload = (file) => {
        if (!file.startsWith(contentDir) || !file.endsWith(".md")) return
        const mod = server.moduleGraph.getModuleById(RESOLVED_CONTENT)
        if (mod) server.moduleGraph.invalidateModule(mod)
        server.ws.send({ type: "full-reload" })
      }
      server.watcher.on("add", reload)
      server.watcher.on("change", reload)
      server.watcher.on("unlink", reload)

      server.middlewares.use(async (req, res, next) => {
        const url = (req.url || "").split("?")[0]
        if (url === "/manifest.webmanifest") {
          res.setHeader("Content-Type", MIME[".webmanifest"])
          res.end(await manifestSource())
          return
        }
        if (url === "/sw.js") {
          res.setHeader("Content-Type", MIME[".js"])
          res.end(swSource())
          return
        }
        const rel = url.replace(/^\//, "")
        if (DEFAULT_ICONS.includes(rel) && !consumerHasPublic(rel)) {
          res.setHeader("Content-Type", MIME[extname(rel)] || "application/octet-stream")
          res.end(readFileSync(join(assetsDir, rel)))
          return
        }
        next()
      })
    },

    // Build : émet manifest, service worker et icônes par défaut manquantes.
    async generateBundle() {
      this.emitFile({
        type: "asset",
        fileName: "manifest.webmanifest",
        source: await manifestSource(),
      })
      this.emitFile({ type: "asset", fileName: "sw.js", source: swSource() })
      for (const rel of DEFAULT_ICONS) {
        if (consumerHasPublic(rel)) continue // l'icône du projet gagne (copiée via publicDir)
        this.emitFile({ type: "asset", fileName: rel, source: readFileSync(join(assetsDir, rel)) })
      }
    },
  }
}

export default barjavel
