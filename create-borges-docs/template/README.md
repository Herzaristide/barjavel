# Ma Documentation

Documentation générée avec [Borges](https://github.com/Herzaristide/borges).

## Développement

```bash
npm install   # ou: bun install
npm run dev   # ou: bun run dev
```

## Ajouter une page

Créez `content/<slug>.md` avec un frontmatter :

```markdown
---
title: Titre affiché
group: catégorie
summary: Une phrase de résumé (indexée par la recherche).
links: [autre-slug, encore-un-slug]
---

# Titre

Contenu…
```

## Personnaliser

Ouvrez `docs.config.ts` : titre, description et couleur d'accent (`accent`).

## Build & déploiement

```bash
npm run build      # -> dist/ (site statique)
npm run preview    # prévisualisation locale
```

Le workflow `.github/workflows/deploy.yml` publie automatiquement `dist/` sur
GitHub Pages à chaque push sur `main` (à activer dans Settings → Pages →
source "GitHub Actions").
