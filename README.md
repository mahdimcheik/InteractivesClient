# InteractivesClient

Base Angular 21 (SSR) réutilisable : site public prérendu, zone client protégée,
authentification JWT mockable, thème clair/sombre persistant.

## Démarrer

```bash
npm install
npm start            # http://localhost:4200
```

Compte de démonstration : `demo@example.com` / `demo1234`.

## Structure

```
src/app/
  core/
    auth/            AuthService, AuthApi (Http + Mock), intercepteur JWT, guards
    interceptors/    error.interceptor (toasts d'erreur HTTP)
    services/        ThemeService, StorageService (SSR-safe)
  layout/
    public-layout/     en-tête + pied de page du site public
    dashboard-layout/  sidebar + topbar de l'espace connecté
    theme-toggle/      bouton clair/sombre
  features/
    home/ about/ contact/ not-found/
    auth/login/ auth/register/
    dashboard/       overview, profil, paramètres (routes lazy)
src/environments/    apiUrl, useMockAuth, storagePrefix
```

Alias TypeScript disponibles : `@app/*`, `@core/*`, `@env/*`.

## Rendu (SSR)

`src/app/app.routes.server.ts` fixe le mode par route :

| Route                        | Mode        | Pourquoi                                |
| ---------------------------- | ----------- | --------------------------------------- |
| `/`, `/a-propos`, `/contact` | `Prerender` | HTML statique, SEO et perf              |
| `/connexion`, `/inscription` | `Client`    | dépend de l'état d'auth                 |
| `/dashboard/**`              | `Client`    | aucune donnée authentifiée côté serveur |
| `**`                         | `Server`    | rendu à la demande                      |

```bash
npm run build
npm run serve:ssr:InteractivesClient   # http://localhost:4000
```

⚠️ `angular.json` → `security.allowedHosts` n'autorise que `localhost` et `127.0.0.1`.
**Ajoutez-y le domaine de production**, sinon le serveur SSR retombe en rendu client.

## Brancher une vraie API

1. Renseigner `apiUrl` dans `src/environments/environment*.ts`.
2. Passer `useMockAuth` à `false` : `app.config.ts` bascule alors de `MockAuthApi`
   vers `HttpAuthApi`.
3. Adapter les chemins dans `src/app/core/auth/http-auth-api.ts` (`/auth/login`,
   `/auth/refresh`, `/auth/me`, …) et les modèles de `auth.models.ts`.

Le refresh token est stocké dans `localStorage` (voir le commentaire en tête de
`auth.service.ts`) : si le backend peut poser un cookie `HttpOnly`, préférez-le.

## Thème clair / sombre

Piloté par la classe `app-dark` sur `<html>`, posée avant le premier rendu par le
script inline de `src/index.html` (évite le flash clair au chargement). Trois
points doivent rester alignés : ce script, `ThemeService` et `darkModeSelector`
dans `app.config.ts`.

Les couleurs viennent exclusivement des variables PrimeNG (`--p-*`), qui utilisent
`light-dark()`. **N'écrivez pas de couleur en dur** : elle ne suivrait pas le thème.

## Tests

```bash
npm test
```

Vitest + jsdom. Exemples fournis pour `ThemeService`, `AuthService` et le
formulaire de contact.
