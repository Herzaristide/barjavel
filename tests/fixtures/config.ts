import type { DocsConfig } from "../../app/lib/config"

// Configuration de test injectée à la place de `virtual:barjavel-config`.
const config: DocsConfig = {
  title: "Doc de test",
  description: "Description de test",
  lang: "en",
  accent: "#7c3aed",
  footer: "Pied de page",
}

export default config
