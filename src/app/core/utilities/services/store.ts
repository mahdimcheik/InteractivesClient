import { Injectable, computed, inject, signal } from '@angular/core';
import {
  LoginResponse,
  PresentationDetails,
  PresentationSummary,
  SlideDetails,
  UserDetails,
} from '@client';

import { StorageService } from './storage.service';

const AUTH_USER_KEY = 'user';
const AUTH_TOKEN_KEY = 'token';
const AUTH_REFRESH_TOKEN_KEY = 'refreshToken';

@Injectable({
  providedIn: 'root',
})
export class Store {
  private readonly storage = inject(StorageService);

  user = signal<UserDetails | undefined>(undefined);
  token = signal<string | null>(null);
  refreshToken = signal<string | null>(null);

  /** `null` = jamais chargée, `[]` = chargée et vide. */
  presentations = signal<PresentationSummary[] | null>(null);
  presentationDetails = signal<ReadonlyMap<string, PresentationDetails>>(new Map());

  /** Source de vérité des guards et des layouts. */
  readonly isAuthenticated = computed(() => this.user() !== undefined);
  readonly isAdmin = computed(
    () => this.user()?.roles?.some((role) => role.name?.toLocaleLowerCase() === 'admin') ?? false,
  );
  readonly isProfessionnal = computed(
    () =>
      this.user()?.roles?.some((role) => role.name?.toLocaleLowerCase() === 'professionnel') ??
      false,
  );
  readonly isClient = computed(
    () => this.user()?.roles?.some((role) => role.name?.toLocaleLowerCase() === 'client') ?? false,
  );

  persistData(data: LoginResponse | undefined): void {
    this.user.set(data?.user);
    this.token.set(data?.token ?? null);
    this.refreshToken.set(data?.refreshToken ?? null);

    data?.user
      ? this.storage.set(AUTH_USER_KEY, JSON.stringify(data.user))
      : this.storage.remove(AUTH_USER_KEY);
    data?.token
      ? this.storage.set(AUTH_TOKEN_KEY, data.token)
      : this.storage.remove(AUTH_TOKEN_KEY);
    data?.refreshToken
      ? this.storage.set(AUTH_REFRESH_TOKEN_KEY, data.refreshToken)
      : this.storage.remove(AUTH_REFRESH_TOKEN_KEY);
  }

  clearData() {
    this.user.set(undefined);
    this.token.set(null);
    this.refreshToken.set(null);

    this.storage.remove(AUTH_USER_KEY);
    this.storage.remove(AUTH_TOKEN_KEY);
    this.storage.remove(AUTH_REFRESH_TOKEN_KEY);

    this.clearPresentations();
  }

  /** Utilisé au boot pour savoir s'il vaut la peine de tenter un refresh silencieux. */
  hasPersistedSession(): boolean {
    if (this.user() !== undefined) {
      return true;
    }
    const token = this.storage.get(AUTH_TOKEN_KEY);
    return token !== null && token !== '' && token !== undefined;
  }

  setPresentations(presentations: PresentationSummary[]): void {
    this.presentations.set(presentations);
  }

  /** Met à jour le cache détail et resynchronise le résumé correspondant dans le cache liste. */
  upsertPresentationDetails(details: PresentationDetails): void {
    if (!details.id) {
      return;
    }

    this.presentationDetails.update((cache) => new Map(cache).set(details.id!, details));

    const summary: PresentationSummary = {
      id: details.id,
      title: details.title,
      creatorId: details.creatorId,
      slideCount: details.slides?.length ?? 0,
      createdAt: details.createdAt,
      updatedAt: details.updatedAt,
    };

    this.presentations.update((list) => {
      if (!list) {
        return list;
      }
      const index = list.findIndex((p) => p.id === details.id);
      if (index === -1) {
        return [summary, ...list];
      }
      const next = [...list];
      next[index] = summary;
      return next;
    });
  }

  /** Insère ou remplace une diapositive d'une présentation déjà en cache. */
  upsertSlideInPresentationDetails(presentationId: string, slide: SlideDetails): void {
    const current = this.presentationDetails().get(presentationId);
    if (!current) {
      return;
    }
    const slides = current.slides ?? [];
    const index = slide.id ? slides.findIndex((s) => s.id === slide.id) : -1;
    const nextSlides =
      index === -1 ? [...slides, slide] : slides.map((s, i) => (i === index ? slide : s));
    this.upsertPresentationDetails({ ...current, slides: nextSlides });
  }

  /** Remplace la liste complète des diapositives d'une présentation déjà en cache. */
  setSlidesForPresentationDetails(presentationId: string, slides: SlideDetails[]): void {
    const current = this.presentationDetails().get(presentationId);
    if (!current) {
      return;
    }
    this.upsertPresentationDetails({ ...current, slides });
  }

  /** Retire une diapositive d'une présentation déjà en cache. */
  removeSlideFromPresentationDetails(presentationId: string, slideId: string): void {
    const current = this.presentationDetails().get(presentationId);
    if (!current) {
      return;
    }
    this.upsertPresentationDetails({
      ...current,
      slides: (current.slides ?? []).filter((s) => s.id !== slideId),
    });
  }

  /** Réordonne les diapositives d'une présentation déjà en cache selon l'ordre des ids donné. */
  reorderSlidesInPresentationDetails(presentationId: string, slideIds: string[]): void {
    const current = this.presentationDetails().get(presentationId);
    if (!current) {
      return;
    }
    const byId = new Map((current.slides ?? []).map((s) => [s.id, s] as const));
    const reordered = slideIds
      .map((id) => byId.get(id))
      .filter((s): s is SlideDetails => s !== undefined);
    this.upsertPresentationDetails({ ...current, slides: reordered });
  }

  removePresentation(presentationId: string): void {
    this.presentationDetails.update((cache) => {
      const next = new Map(cache);
      next.delete(presentationId);
      return next;
    });
    this.presentations.update((list) => list?.filter((p) => p.id !== presentationId) ?? list);
  }

  clearPresentations(): void {
    this.presentations.set(null);
    this.presentationDetails.set(new Map());
  }
}
