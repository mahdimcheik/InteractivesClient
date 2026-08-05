import { Injectable, inject } from '@angular/core';
import { map, Observable, of, tap } from 'rxjs';

import {
  CreateSlideRequest,
  ObjectResponse,
  SlideDetails,
  SlidesService as GeneratedSlidesService,
  UpdateSlideRequest,
} from '@client';

import { CacheOptions } from './presentations-mirror.service';
import { Store } from './store';

/**
 * Miroir de `SlidesService` (client généré `src/client`) : noms lisibles et
 * cache dans le {@link Store}, partagé avec les autres services miroir.
 */
@Injectable({ providedIn: 'root' })
export class SlidesMirrorService {
  private readonly api = inject(GeneratedSlidesService);
  private readonly store = inject(Store);

  list(presentationId: string, options?: CacheOptions): Observable<SlideDetails[]> {
    const cached = this.store.presentationDetails().get(presentationId)?.slides;
    if (cached && !options?.force) {
      return of(cached);
    }

    return this.api.presentationsPresentationIdSlidesGet(presentationId).pipe(
      map((res) => res.data ?? []),
      tap((slides) => this.store.setSlidesForPresentationDetails(presentationId, slides)),
    );
  }

  get(
    presentationId: string,
    slideId: string,
    options?: CacheOptions,
  ): Observable<SlideDetails | undefined> {
    const cached = this.store
      .presentationDetails()
      .get(presentationId)
      ?.slides?.find((s) => s.id === slideId);
    if (cached && !options?.force) {
      return of(cached);
    }

    return this.api.presentationsPresentationIdSlidesSlideIdGet(presentationId, slideId).pipe(
      map((res) => res.data),
      tap((slide) => slide && this.store.upsertSlideInPresentationDetails(presentationId, slide)),
    );
  }

  create(
    presentationId: string,
    payload: CreateSlideRequest = {},
  ): Observable<SlideDetails | undefined> {
    return this.api.presentationsPresentationIdSlidesPost(presentationId, payload).pipe(
      map((res) => res.data),
      tap((slide) => slide && this.store.upsertSlideInPresentationDetails(presentationId, slide)),
    );
  }

  update(
    presentationId: string,
    slideId: string,
    payload: UpdateSlideRequest,
  ): Observable<SlideDetails | undefined> {
    return this.api
      .presentationsPresentationIdSlidesSlideIdPut(presentationId, slideId, payload)
      .pipe(
        map((res) => res.data),
        tap((slide) => slide && this.store.upsertSlideInPresentationDetails(presentationId, slide)),
      );
  }

  remove(presentationId: string, slideId: string): Observable<ObjectResponse> {
    return this.api
      .presentationsPresentationIdSlidesSlideIdDelete(presentationId, slideId)
      .pipe(tap(() => this.store.removeSlideFromPresentationDetails(presentationId, slideId)));
  }

  reorder(presentationId: string, slideIds: string[]): Observable<ObjectResponse> {
    return this.api
      .presentationsPresentationIdSlidesReorderPost(presentationId, { slideIds })
      .pipe(tap(() => this.store.reorderSlidesInPresentationDetails(presentationId, slideIds)));
  }
}
