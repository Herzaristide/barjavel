---
title: Guide de rédaction
group: usage
summary: Comment créer des pages, relier vos notes dans le graphe et insérer des diagrammes.
links: [index, getting-started, customization]
---

# Guide de rédaction

## Créer une page

Ajoutez un fichier `content/<slug>.md`. Le nom du fichier (sans `.md`) devient
son identifiant (`slug`), utilisé pour les liens internes et l'URL.

Chaque page commence par un **frontmatter** :

```markdown
---
title: Titre affiché
group: catégorie
summary: Une phrase de résumé (affichée sous le titre et indexée).
links: [autre-slug, encore-un-slug]
---

# Titre

Votre contenu…
```

| Champ     | Rôle                                                             |
| --------- | ---------------------------------------------------------------- |
| `title`   | Titre affiché (onglet du graphe, résultats de recherche).        |
| `group`   | Libellé de catégorie affiché sous le titre.                      |
| `summary` | Résumé court, indexé par la recherche.                           |
| `links`   | Slugs des pages reliées → **arêtes du graphe** (bidirectionnel). |

## Relier vos pages (le graphe)

Le graphe de droite est construit **automatiquement** à partir du champ
`links`. Reliez `a` à `b` et une arête apparaît entre les deux nœuds. Plus une
page est centrale, plus son nœud est gros.

![Le graphe de relations : la page courante est entourée, ses voisines sont reliées en couleur](images/graphe.webp)

Le bouton **Notes reliées** restreint l'affichage aux voisines de la page
courante ; la molette règle l'espacement et un glisser sur le fond déplace la
vue.

La page d'accueil est `content/index.md`.

## Liens internes

Pour naviguer d'une page à l'autre sans rechargement, utilisez `#slug` :

```markdown
Voir la [personnalisation](#customization).
```

## Diagrammes Mermaid

Écrivez un bloc ` ```mermaid ` : il est rendu en diagramme, cliquable pour
s'ouvrir en plein écran (zoom + déplacement). Ses couleurs suivent le thème.

```mermaid
flowchart LR
  A[Markdown] --> B[Barjavel]
  B --> C[Site déployé]
```

Un clic sur le diagramme l'ouvre en plein écran :

![Un diagramme Mermaid ouvert en plein écran, avec les boutons de zoom](images/mermaid-plein-ecran.webp)

## Images

Déposez vos images dans `public/` (par exemple `public/images/`) et
référencez-les avec un **chemin relatif**, sans `/` initial, pour qu'elles
fonctionnent aussi sous un sous-chemin (GitHub Pages) :

```markdown
![Texte alternatif](images/capture.webp)
```

Le texte alternatif est lu par les lecteurs d'écran : décrivez ce que montre
l'image. Les images reçoivent automatiquement un cadre discret et s'adaptent à
la largeur du texte.

## Le reste

Tout le **Markdown** standard fonctionne (GFM) : titres, listes, tableaux,
blocs de code (avec bouton « copier »), citations, etc.
