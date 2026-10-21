# InteractivesClient

Client web d'un « PowerPoint interactif » : l'hôte construit une présentation dans l'éditeur et
la lance en direct ; les participants la suivent sur leur propre écran, chaque client rendant
lui-même les diapositives. Angular 21 (composants autonomes, signaux, SSR Express), Syncfusion
et Tailwind 4.

La documentation du projet est dans [docs/](docs/README.md) : [feuille de
route](docs/50-backlog/01-roadmap.md), [dette technique](docs/50-backlog/03-dette-technique.md),
[éléments de diapositive](docs/30-specs-techniques/01-elements-diapositive.md). L'architecture
détaillée est décrite dans [CLAUDE.md](CLAUDE.md).

## Démarrer

L'API (`InteractivesAPI`) doit tourner en HTTPS sur `https://localhost:7033` (`apiUrl` dans
`src/environments/environment.ts`).

```bash
npm install
npm start            # http://localhost:4200
npm run dev          # https://localhost:4201 (key.pem / cert.pem requis)
```

## Commandes

```bash
npx ng test --watch=false   # tests unitaires (Vitest + jsdom)
npm run lint                # ESLint
npm run format:check        # Prettier (npm run format pour corriger)
npm run build               # build production -> dist/InteractivesClient
npm run gen-api             # régénère le client OpenAPI dans src/client (API démarrée)
```

L'intégration continue (`.github/workflows/ci.yml`) lance lint, format, tests et build
production sur chaque demande de fusion.

## Rendu serveur

Les modes de rendu par route sont fixés dans `src/app/app.routes.server.ts` : pages publiques
prérendues, connexion et `/dashboard/**` rendus côté client uniquement (aucune donnée
authentifiée ne passe par le serveur de rendu). Une route authentifiée se déclare dans
`app.routes.ts` **et** `app.routes.server.ts`.

Servir le build :

```bash
node dist/InteractivesClient/server/server.mjs   # http://localhost:4000, PORT pour changer
```

`angular.json` → `security.allowedHosts` n'autorise que `localhost` et `127.0.0.1` : sans le
domaine de production, le rendu serveur retombe silencieusement en rendu client.
