// Contenu de test injecté à la place de `virtual:barjavel-content`.
export const raw: Record<string, string> = {
  index: `---
title: Accueil
group: intro
summary: "Point d'entrée de la doc"
links: [guide, api]
---
# Bienvenue

Voir le [guide](#/guide) ou le [site](https://example.com).

\`\`\`js
console.log("bonjour")
\`\`\`

\`\`\`mermaid
graph TD; A-->B
\`\`\`
`,
  guide: `---
title: Guide
group: tutoriel
summary: Prise en main pas à pas
links: [index, api, inconnu, guide]
---
Le guide explique l'installation et la configuration.`,
  api: `---
title: API
---
Référence de l'API : fonctions et options.`,
  orphan: "Une page sans frontmatter, reliée à rien. [Lien mort](#/inconnu)",
  elan: `---
title: Élan
links: []
---
Page isolée avec un titre accentué.`,
}
