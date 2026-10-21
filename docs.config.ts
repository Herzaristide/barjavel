import type { DocsConfig } from "./app/lib/config"

/**
 * Configuration de votre documentation.
 *
 * 👉 C'est le SEUL fichier à éditer pour personnaliser le site :
 *    - changez le titre et la couleur d'accent ci-dessous,
 *    - déposez vos fichiers Markdown dans le dossier `content/`.
 *
 * La couleur d'accent accepte n'importe quelle valeur hexadécimale.
 */
const config: DocsConfig = {
  title: "Barjavel",
  description: "Générateur de documentation : Markdown, graphe de relations, Mermaid, PWA.",
  lang: "fr",

  // Couleur d'accent unique (titres, liens, graphe, diagrammes…).
  // Exemples : "#7c3aed" (violet), "#2563eb" (bleu), "#059669" (vert),
  // "#e11d48" (rose), "#ea580c" (orange).
  accent: "#d4a35f",

  // Optionnel : forcer un accent différent selon le thème.
  // accentDark: "#a78bfa",
  // accentLight: "#7c3aed",
}

export default config
