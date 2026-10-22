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

Deux surfaces rendent une diapositive :

- `SlideCanvas` — la surface d'édition, toujours en mode `Edit` (cadres, sélection, dépôt) ;
- `SlideView` (`shared/slides/slide-view/`) — la lecture seule, pour tous les autres modes : même
  `SlideStage`, arrière-plan de la diapositive, éléments masqués absents. En `Thumbnail`, elle
  est `inert` et retirée de l'arbre d'accessibilité : c'est le bouton qui la contient qui la
  nomme (« Diapositive 3 »).

Le lecteur de l'hôte (`SlideshowPlayer`, bouton « Présenter » de l'en-tête) affiche une
`SlideView` en `Presentation`, en plein écran : suivante avec flèche droite / bas, espace,
Entrée ou Page suivante ; précédente avec flèche gauche / haut ou Page précédente ; Début / Fin ;
`Échap` pour quitter (le focus revient au bouton « Présenter », l'éditeur reprend sur la
dernière diapositive affichée). Un test vérifie que chaque élément du registre ne rend aucun
contrôle d'édition (`contenteditable`, champ, bouton) hors du mode `Edit`.

## Le repère de la diapositive

Positions et tailles (`x`, `y`, `width`, `height`) sont stockées dans un repère logique de
**1280 × 720**, format 16:9 uniquement (`SLIDE_WIDTH` × `SLIDE_HEIGHT`, `core/utilities/models/slide-geometry.ts`), pas
en pixels d'écran. `SlideStage` (`shared/slides/slide-stage/`) occupe la largeur disponible au
format 16:9 et met son contenu à l'échelle (`transform: scale`) ; `toSlidePoint` convertit un
point de l'écran en coordonnées logiques. Une diapositive se rend ainsi à l'identique dans
l'éditeur, en présentation, chez chaque participant et en miniature.

Conséquences pour un élément :

- le **contenu** est dimensionné en px logiques (`font-size: 32px`), jamais en `rem` : il suit
  l'échelle et ne dépend pas de la taille de police du navigateur du participant ;
- les **contrôles d'édition** (choix d'image, texte alternatif) divisent leurs tailles par
  `var(--slide-scale)`, posée par `SlideStage`, pour rester lisibles à l'écran.

En mode `Edit`, chaque élément est rendu dans un `ElementFrame` (`slide-canvas/element-frame/`),
qui porte toute la manipulation, comme dans un logiciel de présentation :

- un clic sélectionne, un glisser déplace, les poignées redimensionnent ; le contenu de l'élément
  reste `inert` jusqu'au double-clic ou à `Entrée`, et `Échap` en ressort puis désélectionne ;
- au clavier : flèches pour déplacer (Maj : pas fin), Alt + flèches pour redimensionner,
  `Suppr` pour supprimer ;
- la géométrie en cours de geste est locale au cadre, et n'est enregistrée qu'à la fin du geste
  (relâchement du pointeur ou de la flèche), via `ElementsMirrorService.patch` ;
- la barre de l'élément sélectionné : premier plan / arrière-plan (`zIndex`), verrouiller
  (plus de déplacement ni d'édition), masquer (estompé en édition, absent dans les autres modes).

Les calculs (`moveRect`, `resizeRect`, `clampRect`) sont des fonctions pures de
`slide-geometry.ts` : un élément reste toujours entièrement dans la diapositive.

Les éléments créés avant ce repère (diapositive de 800 px de large) apparaissent 1,6 fois plus
petits : aucune migration, ce n'étaient que des données de développement.

## Apparence de la diapositive et panneau de propriétés

Une diapositive a ses **propres couleurs**, indépendantes du thème clair / sombre de
l'application : l'hôte et chaque participant voient la même chose. Arrière-plan blanc et texte
sombre par défaut (`SLIDE_DEFAULT_BACKGROUND`, `SLIDE_DEFAULT_TEXT_COLOR` dans
`core/utilities/models/slide-style.ts`) ; l'arrière-plan se choisit par diapositive, la couleur
du texte par élément. Les polices sont trois familles génériques (`SLIDE_FONTS` : sans
empattement, avec empattement, chasse fixe), stockées par clé : aucune police web n'est chargée.

Le panneau de propriétés suit la sélection, remontée dans `PresentationEditor` et partagée avec
le canvas :

- sans sélection : propriétés de la diapositive (arrière-plan) ;
- avec sélection : position et taille (communes, bornées à la diapositive), puis le panneau
  propre au type, déclaré dans `ELEMENT_PANELS`. Un panneau étend `ElementConfigEditor<TConfig>`,
  la même base que le composant de rendu : il lit `config()` et enregistre par `saveConfig()`.

Mise en forme du texte (`TextElementConfig`) : police, taille, couleur, gras, italique,
souligné, alignement. `fontSize` et `bold` à `null` suivent le rôle (un titre fait 64 et est en
gras, un texte 32) ; les éléments créés avant la mise en forme restent donc identiques.

## Le contrat commun : `SlideElementBase<TConfig>`

Tout élément est un composant qui étend `SlideElementBase<TConfig>`
(`src/app/core/utilities/models/slide-element-base.ts`). La base fournit :

- les inputs `element` (`ElementDetails` de l'API), `mode` et `presentationId`, passés par le
  canvas via `ngComponentOutlet` ;
- `isEditable()` — vrai uniquement en mode `Edit` ;
- `config()` — la configuration typée : le JSON `element.configuration` fusionné avec
  `defaultConfig` (un JSON invalide ou un champ manquant retombe sur les défauts, ce qui garde
  valides les éléments créés avant l'ajout d'un champ) ;
- `saveConfig(patch)` — envoie la configuration fusionnée par `ElementsMirrorService.patch`, et
  affiche une notification d'erreur en cas d'échec.

Le `Store` est la seule source de vérité de l'éditeur : le canvas rend les éléments depuis le
cache, et `patch` y applique la modification avant la réponse de l'API, puis rétablit les seuls
champs modifiés en cas d'échec. L'API remplaçant l'élément entier à chaque `PUT`, `patch` part
toujours de la dernière version en cache — un déplacement et une modification de texte
simultanés ne s'écrasent donc pas. Aucun composant ne garde sa propre copie d'un élément.

Le composant n'a qu'à déclarer `protected readonly defaultConfig` et son template.

## Les éléments actuels

Les composants sont sous
`src/app/shared/slides/elements/`.

| Preset (palette)      | Type API         | Composant               | Configuration                                                   |
| --------------------- | ---------------- | ----------------------- | --------------------------------------------------------------- |
| Titre                 | `Text`           | `TextElement`           | `{ content, role: 'title' }`                                    |
| Zone de texte         | `Text`           | `TextElement`           | `{ content, role: 'body' }`                                     |
| Image                 | `Image`          | `ImageElement`          | `{ key, url, alt, fit: 'contain' \| 'cover' }`                  |
| Titre + texte + image | `TextImageTitle` | `TextImageTitleElement` | `{ title, body, image: { key, url, alt, fit }, imagePosition }` |
| QCM                   | `Quiz`           | `QuizElement`           | `{ question, answers: string[], correct }`                      |

Le Titre n'est pas un type API à part : c'est un `Text` avec `role: 'title'`, rendu comme un titre
accessible (`role="heading"`).

Briques partagées dans `elements/shared/` :

- `EditableText` — texte éditable en place (`contenteditable`) en mode `Edit`, statique sinon ;
  émet `committed` au blur si le texte a changé.
- `ImagePicker` — choix d'un fichier et envoi via `MediasMirrorService.upload` (visibilité
  `Public`, pour que les participants chargent l'image sans URL signée).
- `ImageView` — affiche l'image (`NgOptimizedImage` en mode `fill`), ou le sélecteur s'il n'y en a
  pas encore ; en édition, champ « Texte alternatif » et bouton « Remplacer ».

Côté API, `ElementConfigurationValidator` vérifie la forme minimale de chaque configuration, à la
création comme à la mise à jour : `content` pour `Text`, `url` pour `Image` (présent, `null`
accepté tant qu'aucune image n'est choisie), `title`, `body` et un objet `image` avec `url` pour
`TextImageTitle`. Un champ ajouté côté client doit rester compatible avec ce validateur.

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
     `defaultConfig` ;
   - `<nom>-panel.ts` (facultatif) — son panneau de propriétés, qui étend
     `ElementConfigEditor<…Config>` (position et taille sont déjà gérées par le panneau commun).
3. Dans `element-registry.ts` : ajouter le composant à `ELEMENT_COMPONENTS`, son panneau à
   `ELEMENT_PANELS`, et au moins un preset à `ELEMENT_PRESETS`.

Règles à respecter :

- aucune affordance d'édition hors du mode `Edit` (se baser sur `isEditable()`) ;
- toute image a un texte alternatif ; les contrôles d'édition sont accessibles au clavier ;
- le **contenu** de la diapositive a ses propres couleurs (`slide-style.ts`), choisies par
  l'auteur et indépendantes du thème : jamais de jeton `--app-*` pour le contenu ; les
  **contrôles d'édition**, eux, utilisent les jetons `--app-*` ;
- réutiliser les briques de `shared/` plutôt que de recoder l'édition de texte ou l'envoi d'image.

## Éléments interactifs : `QuizRuntime`

Un élément interactif reçoit la séance par injection, pas par le contrat de base : il injecte
`QuizRuntime` (`elements/quiz-element/quiz-runtime.ts`) en **optionnel**. L'écran qui tient la
connexion le fournit (`{ provide: QuizRuntime, useExisting: LiveSessionConnection }` dans
`PresentationEditor` et `LiveSessionPage`) ; hors séance, il est absent ou sans rôle, et
l'élément s'affiche sans interaction (miniatures, présentation seule).

Le QCM selon le mode et le rôle :

- `Edit` — question et réponses modifiables en place ; bonne réponse, ajout et retrait dans le
  panneau (`QuizElementPanel`, 2 à 6 réponses) ;
- `Presentation` + hôte — « Ouvrir le vote », « Fermer le vote », « Rouvrir », « Révéler la
  réponse », nombre de réponses ; répartition dès l'ouverture, bonne réponse après révélation.
  Les **réponses nominatives** ne s'affichent jamais sur la diapositive (souvent projetée) :
  elles sont dans un panneau du lecteur, que l'hôte ouvre lui-même ;
- `Client` + participant — un bouton par réponse (actif seulement vote ouvert, modifiable tant
  qu'il l'est) ; après révélation : bonne réponse, sa réponse juste ou fausse, répartition.

**Règle de sécurité :** l'API retire `correct` de la configuration servie aux participants, et
la fusion avec les défauts y remet `0`. Hors `Edit`, la bonne réponse ne se lit **jamais** dans
`config()`, seulement dans l'état révélé de la séance (un test le vérifie).

## À venir

- **Animations.**
- Autres éléments interactifs (sondage, nuage de mots) sur le modèle de `QuizRuntime`.
