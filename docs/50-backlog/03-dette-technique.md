# Dette technique

> Statut : **Brouillon** · Ordre de traitement : [feuille de route](01-roadmap.md)
>
> Écarts connus entre le code et ce qu'il devrait être. Un écart est **retiré** de ce document
> dans la contribution qui le corrige, et le lot concerné le mentionne.
> Préfixes : **O** outillage · **C** code · **I** interface · **R** rendu & déploiement ·
> **S** sécurité.

## Outillage

- **O1 — Ni linter ni intégration continue.** Seul Prettier est configuré (`.prettierrc`), et
  rien ne le vérifie. → Lot 2.
- **O2 — `dashboard-layout.spec.ts` ne compile plus.** Il lit `sidebarOpen` et
  `shouldShowSidebar`, que `DashboardLayout` n'a plus. Le constructeur de tests compilant toutes
  les specs, `npx ng test` échoue — même avec `--include`. → Lot 2.
- **O3 — README faux.** Il documente `npm test` et `npm run serve:ssr:InteractivesClient`, qui
  n'existent pas. → Lot 2.

## Code

- **C1 — Intercepteur de jeton marqué obsolète mais actif.** `token.interceptor.ts` porte
  `@obsolete Pour le developpement uniquement` alors qu'il est enregistré dans `app.config.ts`.
  Trancher : retirer le commentaire ou remplacer l'intercepteur. → Lot 2.
- **C2 — Restes de l'authentification simulée.** `core/auth/` n'est importé nulle part ;
  `environment.useMockAuth` ne sert plus qu'à `ContactService`, qui simule l'envoi du
  formulaire de contact en développement. → Lot 2.
- **C3 — Maquettes HTML dans `src/app/design-dev/`.** Références visuelles, ni importées ni
  construites : leur place est hors du code de l'application. → Lot 2.
- **C4 — Deux sources de vérité dans l'éditeur.** Le canvas rend depuis le signal
  `presentation` de `PresentationEditor`, alors que les services miroir mettent à jour le
  `Store`. D'où la copie locale optimiste de `SlideElementBase.config` et les mises à jour
  manuelles du modèle dans `SlideCanvas`. À unifier quand l'éditeur grandit (lots 3 et 4).

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
