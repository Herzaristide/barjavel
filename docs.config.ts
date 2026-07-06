import type { DocsConfig } from "./src/lib/config"

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
  title: "Ma Documentation",
  description: "Une documentation simple, propre et déployable en un clic.",
  lang: "fr",

  // Couleur d'accent unique (titres, liens, graphe, diagrammes…).
  // Exemples : "#7c3aed" (violet), "#2563eb" (bleu), "#059669" (vert),
  // "#e11d48" (rose), "#ea580c" (orange).
  accent: "#e11d48",

  // Optionnel : forcer un accent différent selon le thème.
  // accentDark: "#a78bfa",
  // accentLight: "#7c3aed",
}

export default config
