---
title: Prise en main
group: introduction
summary: Installer les dépendances, lancer le serveur de dev et produire le site.
links: [index, guide, customization]
---

# Prise en main

## Prérequis

- [Node.js](https://nodejs.org) 18 ou plus récent.

## Installation

```bash
npm install
```

## Développement

Lancez le serveur local avec rechargement à chaud :

```bash
npm run dev
```

Le site est disponible sur `http://localhost:5173`.

## Production

```bash
npm run build     # génère le dossier dist/
npm run preview   # prévisualise le build
```

Le dossier `dist/` est un site **statique** : hébergez-le où vous voulez
(GitHub Pages, Netlify, un simple serveur de fichiers…).

Ensuite, apprenez à [rédiger vos pages](#guide).
