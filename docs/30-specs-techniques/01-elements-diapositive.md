# Éléments de diapositive

## Le produit en bref

InteractivesClient est un « PowerPoint interactif ». Un **hôte** (le professeur) construit une
présentation dans l'éditeur, puis la lance. Les **participants** (étudiants, visiteurs) la suivent
**en direct sur leur propre ordinateur** : ce n'est pas une vidéo, chaque client affiche lui-même
les diapositives et change de diapositive quand l'hôte le fait.

Comme dans PowerPoint, une diapositive est composée d'**éléments** positionnés librement (x, y,
largeur, hauteur, z-index). Pas d'animations pour l'instant. Les éléments interactifs (QCM, …)
viendront ensuite : c'est ce qui distingue l'application d'un simple diaporama.

## Les modes de rendu

Un même composant d'élément est affiché dans plusieurs contextes, donnés par `PresentationMode`
(`core/utilities/models/enumerators.ts`) :

| Mode           | Qui le voit                           | Édition |
| -------------- | ------------------------------------- | ------- |
| `Edit`         | l'auteur, dans l'éditeur              | oui     |
| `Presentation` | l'hôte, pendant la présentation       | non     |
| `Client`       | les participants, pendant la séance   | non     |
| `Thumbnail`    | miniatures (panneau des diapositives) | non     |

**Règle :** le rendu d'un élément ne dépend que de sa configuration et du mode. C'est ce qui rend
la synchronisation en direct simple : l'hôte n'a qu'à diffuser l'index de la diapositive courante,
chaque client rend les mêmes composants en mode `Client`.

## Le contrat commun : `SlideElementBase<TConfig>`

Tout élément est un composant qui étend `SlideElementBase<TConfig>`
(`src/app/core/utilities/models/slide-element-base.ts`). La base fournit :

- les inputs `element` (`ElementDetails` de l'API), `mode` et `presentationId`, passés par le
  canvas via `ngComponentOutlet` ;
- `isEditable()` — vrai uniquement en mode `Edit` ;
- `config()` — la configuration typée : le JSON `element.configuration` fusionné avec
  `defaultConfig` (un JSON invalide ou un champ manquant retombe sur les défauts, ce qui garde
  valides les éléments créés avant l'ajout d'un champ) ;
- `saveConfig(patch)` — applique le patch tout de suite (rendu optimiste), l'enregistre via
  `ElementsMirrorService.update`, et en cas d'échec restaure l'ancienne configuration et affiche
  une notification d'erreur.

Le composant n'a qu'à déclarer `protected readonly defaultConfig` et son template.

## Les éléments actuels

Les composants sont sous
`src/app/features/presentation-editor/components/slide-canvas/elements/`.

| Preset (palette)      | Type API         | Composant               | Configuration                                                   |
| --------------------- | ---------------- | ----------------------- | --------------------------------------------------------------- |
| Titre                 | `Text`           | `TextElement`           | `{ content, role: 'title' }`                                    |
| Zone de texte         | `Text`           | `TextElement`           | `{ content, role: 'body' }`                                     |
| Image                 | `Image`          | `ImageElement`          | `{ key, url, alt, fit: 'contain' \| 'cover' }`                  |
| Titre + texte + image | `TextImageTitle` | `TextImageTitleElement` | `{ title, body, image: { key, url, alt, fit }, imagePosition }` |

Le Titre n'est pas un type API à part : c'est un `Text` avec `role: 'title'`, rendu comme un titre
accessible (`role="heading"`).

Briques partagées dans `elements/shared/` :

- `EditableText` — texte éditable en place (`contenteditable`) en mode `Edit`, statique sinon ;
  émet `committed` au blur si le texte a changé.
- `ImagePicker` — choix d'un fichier et envoi via `MediasMirrorService.upload` (visibilité
  `Public`, pour que les participants chargent l'image sans URL signée).
- `ImageView` — affiche l'image (`NgOptimizedImage` en mode `fill`), ou le sélecteur s'il n'y en a
  pas encore ; en édition, champ « Texte alternatif » et bouton « Remplacer ».

> **À brancher :** `TextImageTitleElement` est prêt mais pas encore enregistré, car
> `ElementTypeEnum.TextImageTitle` n'existe pas encore côté API. Une fois le type ajouté au
> backend et `npm run gen-api` lancé, ajouter dans `element-registry.ts` l'entrée
> `[ElementTypeEnum.TextImageTitle]: TextImageTitleElement` et un preset
> (`size: { width: 720, height: 360 }`, configuration
> `TEXT_IMAGE_TITLE_DEFAULT_CONFIG`).

## Le registre

`elements/element-registry.ts` contient deux choses :

- `ELEMENT_COMPONENTS` — le composant de rendu de chaque **type API** ;
- `ELEMENT_PRESETS` — les entrées de la **palette** de l'éditeur (libellé, icône primeicons, type,
  taille et configuration initiales). Plusieurs presets peuvent partager un type (Titre et Zone
  de texte sont tous deux `Text`).

La barre d'outils génère sa palette à partir de `ELEMENT_PRESETS` ; quand un preset est déposé sur
la diapositive, le canvas crée l'élément avec son type, sa taille et sa configuration.

## Ajouter un nouvel élément

1. **Nouveau type API ?** L'ajouter à `ElementTypeEnum` côté backend, puis `npm run gen-api`.
   (Une simple variante d'un type existant, comme le Titre, n'en a pas besoin.)
2. Créer `elements/<nom>/` avec :
   - `<nom>.model.ts` — l'interface de configuration et sa constante `…_DEFAULT_CONFIG` ;
   - `<nom>.ts` — le composant, qui étend `SlideElementBase<…Config>` et déclare
     `defaultConfig`.
3. Dans `element-registry.ts` : ajouter le composant à `ELEMENT_COMPONENTS` et au moins un preset
   à `ELEMENT_PRESETS`.

Règles à respecter :

- aucune affordance d'édition hors du mode `Edit` (se baser sur `isEditable()`) ;
- toute image a un texte alternatif ; les contrôles d'édition sont accessibles au clavier ;
- couleurs uniquement via les tokens `--app-*` de `styles.scss` (sinon le mode sombre casse) ;
- réutiliser les briques de `shared/` plutôt que de recoder l'édition de texte ou l'envoi d'image.

## À venir

- **QCM** (`Quiz`, déjà présent dans `ElementTypeEnum`) : premier élément interactif ; il faudra
  ajouter à la base de quoi remonter les réponses des participants en mode `Client`.
- **Synchronisation en direct** hôte → participants.
- **Animations.**
