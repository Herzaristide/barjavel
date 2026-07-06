---
title: Personnalisation
group: usage
summary: Changer le titre, la couleur d'accent et le thème depuis un seul fichier.
links: [index, guide, getting-started]
---

# Personnalisation

Toute la personnalisation tient dans **un seul fichier** : `docs.config.ts`.

```ts
const config: DocsConfig = {
  title: "Ma Documentation",
  description: "Une doc simple et déployable en un clic.",
  lang: "fr",
  accent: "#7c3aed",
  footer: "Construit avec Barjavel",
}
```

## La couleur d'accent

Une seule valeur hexadécimale suffit : elle colore les titres, les liens, les
nœuds du graphe et les diagrammes.

| Couleur | Hex       |
| ------- | --------- |
| Violet  | `#7c3aed` |
| Bleu    | `#2563eb` |
| Vert    | `#059669` |
| Rose    | `#e11d48` |
| Orange  | `#ea580c` |
| Ambre   | `#d97706` |

### Accent par thème (optionnel)

Pour un rendu optimal, vous pouvez fixer un accent différent en clair et en
sombre :

```ts
accentDark: "#a78bfa",   // plus clair sur fond sombre
accentLight: "#7c3aed",  // plus soutenu sur fond clair
```

## Thème clair / sombre

Le bouton en haut à droite bascule le thème ; le choix est mémorisé et suit la
préférence système par défaut. Aucune configuration nécessaire.

## Pied de page

Le champ `footer` affiche un court texte discret en bas à gauche. Laissez-le
vide pour le masquer.
