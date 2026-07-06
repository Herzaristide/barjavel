# Borges

**Déposez vos Markdown, choisissez une couleur, déployez.**

Borges est un générateur de site de documentation minimaliste et élégant.
Vous n'avez que deux choses à faire : mettre vos fichiers `.md` dans `content/`
et régler une couleur d'accent dans `docs.config.ts`.

## ✨ Fonctionnalités

- 📝 **Markdown** (GFM) : titres, tableaux, blocs de code (bouton « copier »)…
- 🕸️ **Graphe de relations** navigable, construit automatiquement entre vos pages.
- 🔎 **Recherche** instantanée (`⌘K` / `Ctrl+K`).
- 🌗 **Thème clair / sombre** persistant (suit la préférence système).
- 🎨 **Une seule couleur d'accent** à changer, appliquée partout.
- 📈 **Diagrammes Mermaid** (` ```mermaid `), plein écran avec zoom.
- 📱 **PWA** : installable et consultable **hors-ligne** (manifeste + service worker).
- ⚡ **Statique** : se déploie n'importe où (GitHub Pages préconfiguré).

## 🚀 Démarrer

### Dans un nouveau dossier (recommandé)

Un seul package npm suffit, utilisable aussi bien avec `npx` qu'avec `bunx` :

```bash
npx create-borges-docs mon-projet
# ou
bunx create-borges-docs mon-projet

cd mon-projet
npm run dev        # (ou `bun run dev`) http://localhost:5173
```

Options utiles : `--title "Mon titre"`, `--pm bun|npm|pnpm|yarn`, `--no-install`.
Le CLI copie le template, installe les dépendances et affiche les prochaines
étapes. Voir [`create-borges-docs/`](./create-borges-docs) pour le détail.

### En clonant ce dépôt

```bash
npm install
npm run dev        # http://localhost:5173
```

Puis :

1. Ouvrez `docs.config.ts` et changez `title` + `accent`.
2. Déposez vos fichiers Markdown dans `content/`.
3. C'est tout.

## ✏️ Ajouter une page

Créez `content/<slug>.md` avec un frontmatter :

```markdown
---
title: Titre affiché
group: catégorie
summary: Une phrase de résumé (indexée par la recherche).
links: [autre-slug, encore-un-slug]
---

# Titre

Contenu… avec un lien interne : [voir le guide](#guide).
```

- Le **graphe** est dérivé du champ `links` (relations bidirectionnelles).
- Les liens internes s'écrivent `[texte](#slug)` et naviguent sans recharger.
- La page d'accueil est `content/index.md`.

## 🎨 Changer la couleur

Dans `docs.config.ts`, une seule valeur hexadécimale :

```ts
accent: "#2563eb", // bleu — ou #059669 (vert), #e11d48 (rose), #ea580c (orange)…
```

Optionnellement, un accent différent par thème via `accentDark` / `accentLight`.

## 📦 Build

```bash
npm run build      # -> dist/ (site statique)
npm run preview    # prévisualisation locale du build
```

## 🌐 Déploiement (GitHub Pages)

Le workflow `.github/workflows/deploy.yml` est prêt :

1. Poussez le repo sur GitHub.
2. Dans **Settings → Pages**, choisissez la source **GitHub Actions**.
3. À chaque push sur `main`, le site est construit et publié automatiquement.

Le site étant compilé avec des chemins relatifs (`base: './'`), il fonctionne
aussi bien à la racine d'un domaine que dans un sous-chemin
`https://<utilisateur>.github.io/<repo>/`.

## 🗂️ Structure

```
borges/
├── docs.config.ts        # ← votre configuration (titre + couleur)
├── content/              # ← vos fichiers Markdown
│   ├── index.md
│   └── …
├── src/                  # code de l'application (rarement à toucher)
├── .github/workflows/    # déploiement GitHub Pages
└── create-borges-docs/   # CLI `npx create-borges-docs` (scaffolding)
    ├── bin/
    └── template/         # copie synchronisée via `npm run sync:template`
```

## 📄 Licence

MIT — voir [LICENSE](./LICENSE).
