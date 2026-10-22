# Feuille de route

> Statut : **Brouillon** · Dette détaillée : [dette technique](03-dette-technique.md) ·
> Arbitrages en attente : [questions ouvertes](02-questions-ouvertes.md) ·
> Modèle de données côté serveur : `InteractivesAPI/Modele-donnees-presentations.md`
>
> Ordre des chantiers du front. Chaque lot est livrable seul, laisse l'application
> fonctionnelle, et met à jour les documents qu'il rend faux. Les codes entre parenthèses
> renvoient à la [dette](03-dette-technique.md).

## Le cap

Un « PowerPoint interactif » : l'hôte construit une présentation, la lance, et les
participants la suivent en direct sur leur propre écran — pas en vidéo, chaque client rend les
diapositives et suit les commandes de l'hôte. Les lots 1 à 5 donnent un éditeur et un mode
présentation complets **en local** ; le lot 6 ouvre le direct ; le lot 7 apporte le premier
élément interactif, le QCM.

## Lot 1 — Premiers éléments de diapositive — **livré**

Contrat commun `SlideElementBase<TConfig>` (configuration typée, enregistrement optimiste avec
retour arrière), registre unique `ELEMENT_COMPONENTS` + `ELEMENT_PRESETS`, palette générée
depuis le registre. Éléments Titre, Zone de texte et Image (envoi via `MediasMirrorService`,
texte alternatif) et Titre + texte + image (`TextImageTitle`). Briques partagées `EditableText`,
`ImagePicker`, `ImageView`. Tests du contrat et du registre. Voir
[les éléments de diapositive](../30-specs-techniques/01-elements-diapositive.md).

**Côté API (fait) :** `TextImageTitle` ajouté à `ElementTypeEnum` (stocké en entier, sans
migration) ; `ElementConfigurationValidator` attend `url` pour une image au lieu de `assetId`, qui
faisait refuser toute création d'élément Image.

## Lot 2 — Filet de sécurité — **livré**

Avant d'empiler les lots suivants, de quoi détecter les régressions.

- `dashboard-layout.spec.ts` réécrit ; `vitest-base.config.ts` rend testables les composants
  Syncfusion (O2). Au passage : le focus revient au bouton du menu mobile après `Échap`.
- ESLint (`angular-eslint`), vérification Prettier, intégration continue GitHub Actions sur
  chaque demande de fusion : lint, format, tests, build `production` (O1).
- README réécrit sur l'état réel du projet (O3).
- Jeton d'accès réservé aux requêtes vers l'API (C1) ; `core/auth` supprimé, `useMockAuth`
  devenu `simulateContact` (C2) ; maquettes déplacées dans `docs/20-specs-fonctionnelles/`
  (C3) ; clé de thème alignée, vérifiée par un test (I1).
- Découvert : l'API n'a pas de route `/contact` (C5, lot 8).

## Lot 3 — Manipuler les éléments — **livré, à vérifier dans le navigateur**

- `Store` seule source de vérité de l'éditeur, `ElementsMirrorService.patch` (C4) — prérequis :
  l'API remplaçant l'élément entier, un déplacement aurait renvoyé un texte périmé.
- Repère logique 1280 × 720 (`slide-geometry.ts`), mis à l'échelle par `SlideStage`.
- `ElementFrame` : sélection, déplacement et redimensionnement à la souris et au clavier,
  enregistrés en fin de geste ; premier plan / arrière-plan, verrouiller, masquer, supprimer.
- Supprimer une diapositive (panneau) et une présentation (liste), avec confirmation.

Testé unitairement (géométrie, `patch`, cadre) ; le parcours complet reste à faire à la main,
avec l'API redémarrée (Image et Titre + texte + image).

## Lot 4 — Propriétés et mise en forme — **livré, à vérifier dans le navigateur**

- Tranché : une diapositive a ses propres couleurs, indépendantes du thème du spectateur ;
  repère 1280 × 720 en 16:9 confirmé.
- Panneau de propriétés piloté par la sélection (remontée dans l'éditeur) : position et taille
  communes, puis panneau propre au type (`ELEMENT_PANELS`, base `ElementConfigEditor`). Sans
  sélection : arrière-plan de la diapositive, désormais rendu sur le canvas.
- Texte : police (trois familles génériques), taille, couleur, gras / italique / souligné,
  alignement ; anciens éléments inchangés (taille et graisse suivent le rôle par défaut).
- Image : ajustement ; Titre + texte + image : côté et ajustement de l'image.
- Maquettes retirées : police et mise en forme de la barre d'outils, onglet « Interactions »,
  opacité, effets, modèle de mise en page et notes du présentateur du panneau.

**Reste hors lot :** notes du présentateur (champ API à créer) ; mise en forme du titre et du
texte de l'élément Titre + texte + image ; boutons encore factices de la barre d'outils
(diapositive, mise en page, formes, sondage, quiz).

## Lot 5 — Mode présentation de l'hôte — **livré, à vérifier dans le navigateur**

- `SlideView` : rendu en lecture seule partagé (lecteur, miniatures, participants au lot 6) ;
  `SlideCanvas` ne sert plus qu'à l'édition.
- Lecteur plein écran (`SlideshowPlayer`), ouvert par « Présenter » — qui remplace le bouton
  « Annuler » qui servait en fait à basculer de mode. Clavier, commandes au survol, annonce de
  la diapositive courante, retour du focus.
- Miniatures réelles dans le panneau des diapositives (mode `Thumbnail`).
- Test : aucun élément du registre ne rend de contrôle d'édition hors du mode `Edit`. Une image
  vide ne rend plus rien hors édition (elle affichait une icône aux couleurs du thème).

**Pour le lot 6 :** `SlideView`, `SlideStage` et le registre des éléments vivent dans
`features/presentation-editor/` ; la page participant devra les importer de là ou les déplacer
dans un dossier partagé.

## Lot 6 — Séance en direct — **livré, à vérifier dans le navigateur**

Voir [la séance en direct](../30-specs-techniques/02-seance-en-direct.md). Tranché : compte
obligatoire, participant calé sur l'hôte, une séance à la fois par présentation, rien de
conservé après.

- API : hub SignalR `/hubs/live-session`, routes `/live-sessions`, état en mémoire, jeton lu
  dans la chaîne de requête du hub. Corrigé au passage : le chargement d'une présentation
  renvoyait les diapositives et éléments supprimés.
- Client : rendu des diapositives déplacé dans `shared/slides/` ; `LiveSessionConnection`
  (SignalR chargé à la demande, reconnexion qui reprend la diapositive courante) ; hôte :
  « Démarrer en direct », code, lien et participants dans le lecteur, « Terminer la séance » ;
  participant : `/seance` et `/seance/:code`.

**Reste :** essai de bout en bout à plusieurs navigateurs ; renouveler le jeton avant une
reconnexion si la séance dure plus longtemps que sa validité.

## Lot 7 — QCM

Premier élément interactif (`Quiz`, déjà dans `ElementTypeEnum`).

- Élément `QuizElement` : édition de la question et des réponses, choix de la bonne réponse.
- En séance : l'hôte ouvre et ferme le QCM, les participants répondent, l'hôte voit les
  résultats en direct puis révèle la bonne réponse.
- Le contrat `SlideElementBase` gagne de quoi remonter une interaction du participant en mode
  `Client` — conçu ici, sur un vrai besoin.

**Côté API, à prévoir :** réponses des participants dans l'état de séance, agrégation des
résultats, et **ne jamais envoyer la bonne réponse aux participants avant la révélation** —
la configuration servie en mode participant doit en être expurgée.

## Lot 8 — Mise en production

- Domaine de production dans `security.allowedHosts` (R2) ; image Node du serveur de rendu à la
  place de la configuration nginx statique (R3).
- Thème Syncfusion chargé par route, sous le budget initial (R1) ; thème sombre Syncfusion
  branché sur `ThemeService` (I2).
- Session : plus de jeton de renouvellement en `localStorage` (S1).
- Formulaire de contact réellement envoyé (C5) — **côté API :** route `POST /contact`.

## Plus tard (non ordonné)

- Nouveaux éléments : formes (bouton déjà présent dans la barre d'outils), vidéo, sondage,
  nuage de mots.
- Animations et transitions.
- Annuler / rétablir dans l'éditeur.
- Dupliquer une présentation, modèles de présentation.
- Export PDF.
