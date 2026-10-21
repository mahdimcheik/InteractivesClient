# Dette technique

> Statut : **Brouillon** · Ordre de traitement : [feuille de route](01-roadmap.md)
>
> Écarts connus entre le code et ce qu'il devrait être. Un écart est **retiré** de ce document
> dans la contribution qui le corrige, et le lot concerné le mentionne.
> Préfixes : **O** outillage · **C** code · **I** interface · **R** rendu & déploiement ·
> **S** sécurité.

## Outillage

_Aucun écart ouvert._

## Code

- **C4 — Deux sources de vérité dans l'éditeur.** Le canvas rend depuis le signal
  `presentation` de `PresentationEditor`, alors que les services miroir mettent à jour le
  `Store`. D'où la copie locale optimiste de `SlideElementBase.config` et les mises à jour
  manuelles du modèle dans `SlideCanvas`. À unifier quand l'éditeur grandit (lots 3 et 4).

- **C5 — Formulaire de contact sans route API.** `ContactService` poste sur
  `${apiUrl}/contact`, qui n'existe pas dans `InteractivesAPI` : en production
  (`simulateContact: false`) l'envoi échoue ; en développement il est simulé. → Lot 8.

## Interface

- **I1 — Clé de thème désalignée.** Le script avant première peinture de `src/index.html` lit
  `bp_theme` ; `ThemeService` écrit `environment.storagePrefix + 'theme'`, soit
  `interactives_theme` en développement (`bp_` en production, reste du gabarit d'origine). La
  préférence n'est donc pas vue avant la première peinture en développement. Aligner les
  préfixes. → Lot 2.
- **I2 — Pas de thème sombre pour Syncfusion.** Le thème sombre utilise les mêmes sélecteurs
  que le clair : il faut une bascule de feuille de style pilotée par `ThemeService`. → Lot 8.

## Rendu & déploiement

- **R1 — Budget initial dépassé.** Tout le thème Syncfusion est chargé globalement
  (`angular.json` → `build.options.styles`) alors qu'il ne sert qu'aux formulaires de
  connexion et d'inscription ; le bundle initial (≈ 2,75 Mo) dépasse l'avertissement à 2,5 Mo.
  → Lot 8.
- **R2 — Hôtes autorisés.** `security.allowedHosts` ne liste que `localhost` et `127.0.0.1` :
  sans le domaine de production, le rendu serveur se dégrade silencieusement en rendu client.
  → Lot 8.
- **R3 — `nginx.conf` incompatible avec le build.** Il sert des fichiers statiques depuis
  `/usr/share/nginx/html` avec repli sur `index.html`, alors que le build produit un serveur
  Node (`dist/InteractivesClient/server/server.mjs`). → Lot 8.

## Sécurité

- **S1 — Jetons en `localStorage`.** `Store.persistData` y écrit le jeton d'accès **et** le
  jeton de renouvellement, exposés à toute faille XSS — alors que l'API pose déjà le jeton de
  renouvellement en cookie `HttpOnly`. → Lot 8.
