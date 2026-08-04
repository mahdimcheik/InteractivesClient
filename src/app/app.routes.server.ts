import { RenderMode, ServerRoute } from '@angular/ssr';

/**
 * Pages publiques prérendues (SEO + perf), zone connectée en rendu client pur
 * pour qu'aucune donnée authentifiée ne transite par le serveur de rendu.
 */
export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Prerender },
  { path: 'a-propos', renderMode: RenderMode.Prerender },
  { path: 'contact', renderMode: RenderMode.Prerender },
  { path: 'connexion', renderMode: RenderMode.Client },
  { path: 'inscription', renderMode: RenderMode.Client },
  { path: 'dashboard/**', renderMode: RenderMode.Client },
  { path: '**', renderMode: RenderMode.Server },
];
