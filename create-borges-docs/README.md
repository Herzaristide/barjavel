# create-borges-docs

Scaffolde un site de documentation [Borges](https://github.com/Herzaristide/borges)
(Markdown + graphe de relations navigable + Mermaid + PWA) dans n'importe quel
dossier, en une commande — compatible `npx` et `bunx`.

## Usage

```bash
npx create-borges-docs mon-projet
# ou
bunx create-borges-docs mon-projet
```

Sans argument, le site est créé dans le dossier courant :

```bash
npx create-borges-docs
```

### Options

| Option          | Description                                                                              |
| --------------- | ---------------------------------------------------------------------------------------- |
| `--title <t>`   | Titre de la documentation (écrit dans `docs.config.ts`)                                  |
| `--pm <gest.>`  | Gestionnaire de paquets : `npm`, `bun`, `pnpm`, `yarn`, `none` (auto-détecté par défaut) |
| `--no-install`  | Ne pas installer les dépendances automatiquement                                         |
| `-y`, `--yes`   | Ne poser aucune question (autorise un dossier non vide)                                  |
| `-f`, `--force` | Écrire même si le dossier n'est pas vide                                                 |
| `-h`, `--help`  | Afficher l'aide                                                                          |

## Après la génération

```bash
cd mon-projet
npm run dev     # ou: bun run dev
```

- `docs.config.ts` : titre, description, couleur d'accent.
- `content/*.md` : vos pages (frontmatter `title`, `group`, `summary`, `links`).
- `npm run build` : génère un site statique dans `dist/`, déployable partout
  (un workflow GitHub Pages est préconfiguré dans `.github/workflows/`).

## Licence

MIT
