# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start                 # dev server, http://localhost:4200
npm run dev               # HTTPS dev server, https://localhost:4201 (needs key.pem/cert.pem)
npm run build             # production build (SSR, outputMode: server) -> dist/InteractivesClient
npm run watch             # development build in watch mode
npx ng test               # unit tests (see below — there is no `npm test` script)
npm run gen-api           # regenerate the OpenAPI client into src/client (requires the API running)
npm run lint              # ESLint (angular-eslint), config in eslint.config.js
npm run format:check      # Prettier check (npm run format to fix)
```

Tests use the `@angular/build:unit-test` builder with **Vitest + jsdom**, configured in
`angular.json` → `test`, which points `runnerConfig` at `vitest-base.config.ts`. That file inlines
`@syncfusion/*`: its packages ship a UMD `main`, and without inlining any spec importing a
Syncfusion component fails with "Named export … not found".

```bash
npx ng test --include src/app/core/utilities/models/slide-element-base.spec.ts   # a single spec file
npx ng test --filter "^DashboardLayout"                                          # by suite/test name regex
npx ng test --watch --coverage
```

Serve the built SSR bundle (no npm script for this — the README's `serve:ssr:*` script does
not exist):

```bash
node dist/InteractivesClient/server/server.mjs   # http://localhost:4000, override with PORT
```

CI (`.github/workflows/ci.yml`, every PR and push to `main`) runs lint, format check, tests and
the production build — run the same four locally before pushing. ESLint and Prettier both skip
the generated `src/client`; `src/app/core/components` keeps its own conventions (`bp-` prefix,
`any`, 4-space indent — see "Two code styles coexist") through an `eslint.config.js` override and
`.prettierignore`, but template accessibility rules still apply there. Prettier: `.prettierrc`,
100 cols, single quotes.

## Architecture

The product is an **interactive PowerPoint**: a host builds a presentation in the editor and runs
it live; participants (students) follow on their own machines — not a video stream, each client
renders the slides itself and changes slide when the host does. Slides are made of positioned
**elements** (title, text, image, a combined title + text + image; quiz/QCM planned). The same
element component renders in every `PresentationMode` (`Edit`, `Presentation` for the host,
`Client` for participants, `Thumbnail`) — see [docs/30-specs-techniques/01-elements-diapositive.md](docs/30-specs-techniques/01-elements-diapositive.md).

Project docs (French) live in [docs/](docs/README.md), structured like the sibling BonProf repo.
Work is planned in **lots** in [docs/50-backlog/01-roadmap.md](docs/50-backlog/01-roadmap.md),
with known debt coded (O/C/I/R/S) in `03-dette-technique.md` and pending product decisions in
`02-questions-ouvertes.md`. When a change delivers a lot, fixes a debt item, or settles a
question, update those files in the same change.

Angular 21, standalone components only, signals for state, Syncfusion (styled to match its
Tailwind3 theme package) for UI, Tailwind 4 for utilities, Express-based SSR. UI strings, comments,
and route paths are **French** (`LOCALE_ID: 'fr-FR'`, `/connexion`, `/inscription`, `/a-propos`,
`/dashboard/parametres`) — keep new code in French.

Path aliases: `@app/*` → `src/app/*`, `@core/*` → `src/app/core/*`, `@env/*` → `src/environments/*`.

### Auth is the spine of the app

Auth runs on the generated OpenAPI client (`src/client`, see "API client generation" below) via
a mirror-service + store pair — the same pattern used for every other API area (see "Services"):

- **`Store`** (`core/utilities/services/store.ts`) — single signal-based store holding `user`,
  `token`, `refreshToken`, plus the presentation/slide caches used by the presentation editor.
  `isAuthenticated`, `isAdmin`, `isProfessionnal`, `isClient` are `computed()` off `user`.
  `persistData()`/`clearData()` write/clear `user`, `token`, **and** `refreshToken` all to
  `localStorage` via `StorageService` (both tokens are persisted, not just the refresh token).
- **`AuthMirrorService`** (`core/utilities/services/auth-mirror.service.ts`) — mirrors the
  generated `AuthService` from `@client` with readable method names (`login`, `register`,
  `loginWithGoogle`, `forgotPassword`, `resetPassword`, `logout`, `confirmEmail`) and writes
  results into `Store`. `refreshSession()` de-duplicates concurrent refreshes through a single
  `refreshInFlight` observable (`shareReplay(1)`). `restoreSession()` is called from
  `provideAppInitializer` in `app.config.ts` before the first render so guards see real state.

Interceptor chain, registered in this order in `app.config.ts`
(`core/utilities/interceptors/*.interceptor.ts`):

- `token.interceptor.ts` (`TokenInterceptor`) — attaches `Bearer ${store.token()}`.
- `cookies.interceptor.ts` — forces `withCredentials: true` (except calls to
  `api-adresse.data.gouv.fr` made with `withCredentials: false`).
- `error-handler.interceptor.ts` — retries once after a refresh on 401 via
  `AuthMirrorService.refreshSession()`, clearing the store on refresh failure. It does not
  special-case 409/422, and does not call `NotificationService`.
- `exception-loader.interceptor.ts` / `loader.interceptor.ts` — toggle a loading indicator,
  skipping URLs listed in `exception-url.ts`.

`NotificationService` (`core/utilities/services/notification.service.ts`) still bridges to the
`<ejs-toast>` hosted in `app.html`/`app.ts` (Syncfusion has no global message-bus service like
PrimeNG's `MessageService`, so this adapter keeps the same `add({severity, summary, detail,
life})` call shape at every call site) — but it's now called directly from feature components
(e.g. `features/auth/register`, `features/dashboard/profile`, `features/contact`) rather than
centrally from an interceptor.

`authGuard` / `guestGuard` (`core/utilities/guards/auth.guard.ts`) **return `true` on the
server** (`isPlatformServer`), because there is no session during prerender; the client-side
render decides. Removing that check would redirect every prerendered visitor to `/connexion`.

### SSR render modes are a security boundary

`src/app/app.routes.server.ts` pairs with `app.routes.ts`:

| Route                                                                                                       | Mode        | Why                                             |
| ----------------------------------------------------------------------------------------------------------- | ----------- | ----------------------------------------------- |
| `/`, `/a-propos`, `/contact`                                                                                | `Prerender` | static HTML, SEO                                |
| `/connexion`, `/inscription`, `/mot-de-passe-oublie`, `/reinitialiser-mot-de-passe`, `/confirmation-compte` | `Client`    | depends on auth state                           |
| `/dashboard/**`                                                                                             | `Client`    | no authenticated data touches the render server |
| `**`                                                                                                        | `Server`    | on demand                                       |

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

**Known mismatch:** the inline script hard-codes `bp_theme`, but `ThemeService` writes
`environment.storagePrefix` + `theme`, and the prefix differs per environment (`interactives_` in
`environment.ts`, `bp_` in `environment.production.ts`). So the pre-paint script only sees the
stored preference in production builds; in dev it always misses. Fix by aligning the prefixes (or
the key in `index.html`).

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

`npm run gen-api` (config in `openapi.config.ts`) regenerates the typed `src/client` from
`http://localhost:5268/swagger/v1/swagger.json` (requires the API running). It's wired in: the
`@client`/`@client/*` path aliases live in `tsconfig.json`, and
`provideDefaultClient({ basePath: environment.apiUrl })` is active in `app.config.ts`.

### Domain models under `core/utilities/models`

Plain TS types/enums/abstract classes shared across features — distinct from the
`related-models.ts` pattern used by `ConfigurableFormComponent`. Currently: `enumerators.ts`
(`PresentationMode`: `Edit`, `Presentation`, `Client`, `Thumbnail`) and `slide-element-base.ts`
(`SlideElementBase<TConfig>`, the common contract every slide-element component extends, plus
`parseElementConfig` — see below).
Element types themselves come from the generated client (`ElementTypeEnum`, `ElementDetails`).

### The presentation editor

`src/app/features/presentation-editor/` is the slide/presentation-building feature at the center
of the app, routed at `/dashboard/presentations` (list) and `/dashboard/editeur/:presentationId`
(editor). It's backed by the presentations / slides / elements mirror services and the `Store`'s
`presentations` / `presentationDetails` cache (upsert/reorder/remove helpers for slides, and
`setElementsForSlide` etc. for elements nested inside a cached presentation's slides).

**Slide elements: one contract, one registry.** Full write-up (French) in
[docs/30-specs-techniques/01-elements-diapositive.md](docs/30-specs-techniques/01-elements-diapositive.md). In short:

- Every element component extends `SlideElementBase<TConfig>` and only declares
  `protected readonly defaultConfig` plus its template. The base provides the `element` / `mode`
  / `presentationId` inputs, `isEditable()` (mode is `Edit`), `config()` — a `linkedSignal` of the
  `element.configuration` JSON merged over `defaultConfig` (bad JSON or missing fields fall back
  to defaults, so old rows stay valid) — and `saveConfig(patch)`, which updates `config`
  optimistically, persists through `ElementsMirrorService.update`, and rolls back + notifies on
  error. The optimistic local copy matters: the canvas renders from the editor's `presentation`
  signal, not the `Store`, so `element()` is not refreshed after an update.
- Rendering must depend only on `config()` + `mode()`, with no edit affordances outside `Edit` —
  that's what lets participants render the same components in `Client` mode.
- `slide-canvas/elements/element-registry.ts`: `ELEMENT_COMPONENTS` maps API `ElementTypeEnum` →
  component; `ELEMENT_PRESETS` is the editor palette (label, primeicons class, type, size,
  initial configuration JSON). Palette ≠ types: "Titre" and "Zone de texte" are both `Text`
  (`role: 'title' | 'body'`). `editor-toolbar` renders the palette from `ELEMENT_PRESETS`
  (CDK drag `data` = preset id); `SlideCanvas.onElementDropped` creates the element from the
  preset and renders each element with `ngComponentOutlet`.
- Shared building blocks in `elements/shared/`: `EditableText` (contenteditable, binds
  `[textContent]` so Angular replaces browser-inserted nodes), `ImagePicker` (uploads via
  `MediasMirrorService` with `Public` visibility so participants need no signed URL), `ImageView`
  (`NgOptimizedImage` `fill` + alt-text field in edit mode).
- The API's `ElementConfigurationValidator` (`InteractivesAPI`) rejects with 400 any
  configuration missing its minimal fields (`content` for `Text`, `url` for `Image`, `title` /
  `body` / `image.url` for `TextImageTitle`) — keep new config fields compatible with it.
- Adding an element: (new API type → backend + `gen-api`), then `elements/<name>/` with
  `<name>.model.ts` (config interface + `…_DEFAULT_CONFIG`) and the component, then a
  `ELEMENT_COMPONENTS` entry and a preset. `element-registry.spec.ts` checks every preset has a
  component.

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
- `docs/20-specs-fonctionnelles/maquettes/*.html` are static HTML design mockups (home, editor,
  sign-up) used as visual references; nothing imports or builds them.
- The README documents `npm test` and `npm run serve:ssr:InteractivesClient`; neither script exists.
- `src/app/core/auth/` (`auth-api.ts`, `auth.models.ts`) is vestigial — nothing imports it. Real
  auth is `AuthMirrorService` + `Store` (see "Auth is the spine of the app").
  `environment.useMockAuth` no longer affects auth, but `ContactService` still reads it to fake
  the contact-form submission (it's `true` in `environment.ts`, so dev never hits `/contact`).
- `token.interceptor.ts`'s own doc comment marks `TokenInterceptor` `@obsolete Pour le
developpement uniquement`, despite it being actively registered in `app.config.ts`'s
  interceptor chain — resolve the contradiction (drop the comment or replace the interceptor)
  rather than leaving it.

# Services

Every generated `@client` service gets a mirror service under `core/utilities/services/`
(`auth-mirror.service.ts`, `elements-mirror.service.ts`, `medias-mirror.service.ts`,
`presentations-mirror.service.ts`, `slides-mirror.service.ts`, barrel-exported from `index.ts`) that wraps its methods with
readable names and handles caching. A single store service, `Store` (`store.ts`), holds the
cache used by all mirror services (session + presentation/slide/element data). Read methods
take an optional `CacheOptions` (`{ force }`, exported from `presentations-mirror.service.ts`)
to bypass the cache. Follow this pattern for
any newly generated service.
