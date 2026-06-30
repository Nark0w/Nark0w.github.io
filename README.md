# Compagnon Phasmophobia — GitHub Pages

Version statique du compagnon Phasmophobia, restructurée pour être publiée directement avec GitHub Pages.

## Structure

```text
.
├── index.html
├── assets/
│   ├── css/
│   │   ├── base.css
│   │   └── phasmophobia-theme.css
│   └── js/
│       └── app.js
├── legacy/
│   ├── Phasmophobia-Companion.dc.html
│   └── support.js
├── .nojekyll
└── README.md
```

- `index.html` contient la structure de l’application et les liens vers les ressources.
- `base.css` contient les styles fonctionnels de l’application d’origine.
- `phasmophobia-theme.css` applique le thème sombre, texturé et rouge/vert inspiré du prototype `.dc.html`.
- `app.js` conserve la navigation, les défis, les mémos, le bilingue FR/EN et la logique PeerJS.
- `legacy/` conserve les fichiers fournis à titre de référence. Le runtime `support.js` n’est pas nécessaire au site publié, car le thème a été converti en HTML/CSS standard.

## Publication avec GitHub Pages

1. Créer un dépôt GitHub et copier tout le contenu de ce dossier à sa racine.
2. Commit et push sur la branche principale.
3. Ouvrir **Settings → Pages**.
4. Choisir **Deploy from a branch**, la branche `main`, puis le dossier `/ (root)`.
5. Enregistrer. L’application sera accessible à l’adresse GitHub Pages du dépôt.

## Dépendances externes

- Google Fonts pour `Cinzel`, `Cinzel Decorative` et `Special Elite`.
- PeerJS via jsDelivr pour le mode en ligne du défi « Le Possédé ».
- Certaines images sont chargées depuis le wiki communautaire Phasmophobia/Fandom ; un visuel de secours est généré si une image ne répond pas.

## Crédits

Les crédits et avertissements déjà présents dans l’application sont conservés. Ce projet est non officiel et n’est affilié ni aux créateurs de Phasmophobia, ni à MrTiboute, ni à Fandom.
