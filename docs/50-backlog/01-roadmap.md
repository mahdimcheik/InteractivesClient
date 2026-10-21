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

## Lot 4 — Propriétés et mise en forme

Le panneau de propriétés et les boutons de mise en forme de la barre d'outils sont aujourd'hui
des maquettes statiques.

- Panneau de propriétés piloté par l'élément sélectionné : chaque élément fournit son propre
  panneau (le « plugin » du modèle de données de l'API), le cadre commun gère position et
  taille. Sans sélection : propriétés de la diapositive (arrière-plan).
- Texte : police, taille, couleur, gras / italique / souligné, alignement — champs ajoutés à
  `TextElementConfig`, anciens éléments valides grâce aux valeurs par défaut.
- Image : ajustement (`contain` / `cover`) ; Titre + texte + image : côté de l'image.
- Contrôles accessibles : libellés associés, navigation clavier, contrastes AA.

## Lot 5 — Mode présentation de l'hôte

Présenter seul, sans participants : tout ce que le direct réutilisera.

- Lecteur plein écran en mode `Presentation` : diapositive suivante / précédente au clavier
  (flèches, espace, `Échap` pour quitter), mise à l'échelle sur tout l'écran.
- Miniatures réelles dans le panneau des diapositives, rendues par les mêmes composants en mode
  `Thumbnail`.
- Aucune affordance d'édition hors du mode `Edit` (déjà la règle du contrat — vérifiée ici sur
  chaque élément).

## Lot 6 — Séance en direct

Le cœur du produit. Demande l'état d'exécution séparé de la configuration, prévu par le modèle
de données de l'API.

- L'hôte démarre une séance depuis une présentation et obtient un code et un lien.
- Les participants rejoignent par `/seance/:code` (rendu `Client`, à déclarer dans
  `app.routes.ts` **et** `app.routes.server.ts`) et voient la diapositive courante en mode
  `Client`.
- Le changement de diapositive de l'hôte est diffusé ; un participant qui arrive en cours ou se
  reconnecte reprend sur la diapositive courante.
- L'hôte voit le nombre de participants connectés et peut terminer la séance.
- Client SignalR (`@microsoft/signalr`), connexion ouverte une seule fois par séance, jeton
  relu à chaque connexion.

**Côté API, à prévoir :** hub SignalR, état de séance (en mémoire ou table dédiée), routes
démarrer / rejoindre / terminer, lecture du jeton dans la chaîne de requête du hub
(`OnMessageReceived`) — sinon WebSocket retombe en _long polling_.

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
