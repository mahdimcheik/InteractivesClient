# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start                 # dev server, http://localhost:4200
npm run build             # production build (SSR, outputMode: server) -> dist/InteractivesClient
npm run watch             # development build in watch mode
npx ng test               # unit tests (see below — there is no `npm test` script)
npm run gen-api           # regenerate the OpenAPI client (requires the API running)
```

Tests use the `@angular/build:unit-test` builder with **Vitest + jsdom** (config lives in
`angular.json` → `test`, not in a `vitest.config.ts`):

```bash
npx ng test --include src/app/core/auth/auth.service.spec.ts   # a single spec file
npx ng test --filter "^AuthService"                            # by suite/test name regex
npx ng test --watch --coverage
```

Serve the built SSR bundle (no npm script for this — the README's `serve:ssr:*` script does
not exist):

```bash
node dist/InteractivesClient/server/server.mjs   # http://localhost:4000, override with PORT
```

There is no linter configured. Formatting is Prettier (`.prettierrc`: 100 cols, single quotes).

## Architecture

Angular 21, standalone components only, signals for state, Syncfusion (styled to match its
Tailwind3 theme package) for UI, Tailwind 4 for utilities, Express-based SSR. UI strings, comments,
and route paths are **French** (`LOCALE_ID: 'fr-FR'`, `/connexion`, `/inscription`, `/a-propos`,
`/dashboard/parametres`) — keep new code in French.

Path aliases: `@app/*` → `src/app/*`, `@core/*` → `src/app/core/*`, `@env/*` → `src/environments/*`.

### Auth is the spine of the app

`AuthApi` (`src/app/core/auth/auth-api.ts`) is an abstract class with two implementations,
`MockAuthApi` and `HttpAuthApi`. **`app.config.ts` picks one from `environment.useMockAuth`** —
that provider line is the single switch between demo mode and a real backend. Demo account:
`demo@example.com` / `demo1234`.

Token model (deliberate, documented at the top of `auth.service.ts`): the access token lives
only in a signal in memory; the refresh token goes to `localStorage` via `StorageService`.
`provideAppInitializer` runs `AuthService.restoreSession()` before the first render so guards
see real state. `AuthService.refresh()` de-duplicates concurrent refreshes through a single
`refreshInFlight` observable shared with `authInterceptor`.

Two interceptors, registered in that order:

- `core/auth/auth.interceptor.ts` — attaches the Bearer, retries once after a refresh on 401.
  It skips `/auth/login|register|refresh|logout` entirely to avoid a refresh loop; if you rename
  those backend paths, update `AUTH_ENDPOINTS` too.
- `core/utilities/interceptors/error.interceptor.ts` — turns HTTP errors into toasts via
  `NotificationService` (`core/utilities/services/notification.service.ts`), which bridges to the
  `<ejs-toast>` hosted in `app.html`/`app.ts` (Syncfusion has no global message-bus service like
  PrimeNG's `MessageService`, so this adapter keeps the same `add({severity, summary, detail,
life})` call shape at every call site). 401/409/422 are deliberately silent (handled by the auth
  interceptor / shown inline on forms).

`authGuard` / `guestGuard` **return `true` on the server** (`isPlatformServer`), because there is
no session during prerender; the client-side render decides. Removing that check would redirect
every prerendered visitor to `/connexion`.

### SSR render modes are a security boundary

`src/app/app.routes.server.ts` pairs with `app.routes.ts`:

| Route                        | Mode        | Why                                             |
| ---------------------------- | ----------- | ----------------------------------------------- |
| `/`, `/a-propos`, `/contact` | `Prerender` | static HTML, SEO                                |
| `/connexion`, `/inscription` | `Client`    | depends on auth state                           |
| `/dashboard/**`              | `Client`    | no authenticated data touches the render server |
| `**`                         | `Server`    | on demand                                       |

Adding an authenticated route means adding it to **both** files. `angular.json` →
`security.allowedHosts` only lists `localhost` / `127.0.0.1`; a production domain must be added
there or SSR silently degrades to client rendering.

Anything touching `localStorage`, `window`, or `document` must go through `StorageService`
(SSR-safe, prefixes keys with `environment.storagePrefix`) or be guarded by `isPlatformBrowser`.
`provideHttpClient(withFetch())` is required for SSR — don't drop `withFetch()`.

### Theming: two places must agree

Dark mode is the class `app-dark` on `<html>`. It is set in two places that must stay aligned:

1. the inline script in `src/index.html` (runs before first paint, avoids the light flash),
2. `ThemeService` (`core/utilities/services/theme.service.ts`).

Tailwind 4 is CSS-first (no `tailwind.config.js`): `styles.scss` declares
`@custom-variant dark (&:where(.app-dark, .app-dark *));` so Tailwind's `dark:` variants key off
the same class `ThemeService` toggles, and a `@theme { --color-surface-*: ... }` block aliases the
app's existing `surface-*` class naming (inherited from PrimeNG's old semantic scale) to real
color values.

**Known mismatch:** the inline script reads `bp_theme`, but `ThemeService` writes
`boilerplate_theme` (`environment.storagePrefix` + `theme`). The pre-paint script therefore never
sees a stored preference. Fix by aligning the key in `index.html` with `storagePrefix`.

**Never hard-code a color** — use the `--app-*` tokens defined in `:root`/`.app-dark` at the top
of `styles.scss` (`--app-text-color`, `--app-background`, `--app-border-color`,
`--app-surface-subtle`, `--app-primary-color`, `--app-highlight-*`, `--app-danger-*`), or dark mode
breaks. `styles.scss` also provides `.app-container`, `.app-skip-link`, `.app-visually-hidden`.

Syncfusion's Tailwind3-styled theme CSS is listed **component by component** in `angular.json`
(`build.options.styles`), not `@import`ed inside `styles.scss` — it's already-compiled static CSS
that doesn't need Sass/PostCSS processing, and running it through Tailwind 4's PostCSS plugin (via
`@import` in a Sass file) was re-processing/duplicating it and blowing the build budget several
times over. When you use a new `ejs-*` component for the first time, add its theme CSS file to that
same `angular.json` array (see the existing entries for the pattern: `base/base.css` first, then
one file per component folder under `node_modules/@syncfusion/ej2-tailwind3-theme/styles/`). The
dark variant (`@syncfusion/ej2-tailwind3-dark-theme`) uses the **same CSS selectors** as the light
theme — it is not scoped by a class — so it can't simply be added alongside it; true dark-mode
support for Syncfusion components needs a runtime stylesheet swap wired through `ThemeService`,
which is not yet implemented.

### Two code styles coexist

- `src/app/{features,layout}` and `core/auth`, `core/utilities` — the house style described in
  [.claude/CLAUDE.md](.claude/CLAUDE.md): 2-space indent, `OnPush`, `protected readonly` members,
  no redundant `standalone: true`, `app-` selector prefix.
- `src/app/core/components/*` — an imported Syncfusion component library: 4-space indent, `bp-`
  selector prefix, `ChangeDetectionStrategy.Default`, explicit `standalone: true`, `any` in
  places. Follow the surrounding style when editing these; write **new** code in the house style.

`ConfigurableFormComponent` (`core/components/configurable-form/`) is the largest piece: it builds
a nested `FormGroup` (one child group per `FormSection`) from a `Structure` object declared in
`related-models.ts`, which also holds the shared French `errorMessages` map. Add new validation
message keys there so every form picks them up.

### API client generation

`openapi.config.ts` generates a typed client from `http://localhost:5113/swagger/v1/swagger.json`
into `src/client`. That directory is **not generated yet**: run `npm run gen-api` with the API up,
add a `@client` path alias to `tsconfig.json`, and uncomment
`provideDefaultClient({ basePath: environment.apiUrl })` in `app.config.ts` (see the comment there).

## Gotchas

- The production bundle budget in `angular.json` (`build.configurations.production.budgets`) was
  raised to `2.5MB`/`3MB` (initial) to fit Syncfusion's theme CSS, which is currently loaded
  globally (`build.options.styles`) even though most of it (calendars, dropdowns, rich text
  editor, uploader) is only used inside `ConfigurableFormComponent`, itself only reachable from
  `/connexion` and `/inscription`. Splitting that CSS to load per-route would shrink every other
  page's initial payload — a worthwhile follow-up, not yet done.
- The Syncfusion license key lives in `environment.ts`/`environment.production.ts`
  (`syncfusionLicenseKey`) and is registered in `main.ts` via `registerLicense()` before
  `bootstrapApplication` — keep both environment files' keys in sync if it's ever rotated.
- Syncfusion components generally expose `htmlAttributes` to forward `id`/`aria-*` to their real
  underlying element (see `fieldHtmlAttrs()` in `configurable-form.component.ts`) — but
  `ColorPickerComponent` (`[ejs-colorpicker]`) does not; it enhances a real `<input>` directly, so
  bind `id`/`aria-*` straight onto that `<input>` instead.
- `InteractivesClient/` at the repo root is a stray nested git repo containing only a README.
- The README documents `npm test` and `npm run serve:ssr:InteractivesClient`; neither script exists.

# Services

- For each generated service, create a corresponding mirror service that wraps its methods and handles caching whenever applicable.
- Create a single store service responsible for managing the cache used by all mirror services.
