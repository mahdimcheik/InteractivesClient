import { Injectable, inject } from '@angular/core';
import { map, Observable, of, tap } from 'rxjs';

import {
  CreateElementRequest,
  ElementDetails,
  ElementsService as GeneratedElementsService,
  ObjectResponse,
  UpdateElementRequest,
} from '@client';

import { CacheOptions } from './presentations-mirror.service';
import { Store } from './store';

/**
 * Miroir de `ElementsService` (client généré `src/client`) : noms lisibles et
 * cache dans le {@link Store}, partagé avec les autres services miroir.
 */
@Injectable({ providedIn: 'root' })
export class ElementsMirrorService {
  private readonly api = inject(GeneratedElementsService);
  private readonly store = inject(Store);

  list(
    presentationId: string,
    slideId: string,
    options?: CacheOptions,
  ): Observable<ElementDetails[]> {
    const cached = this.store
      .presentationDetails()
      .get(presentationId)
      ?.slides?.find((s) => s.id === slideId)?.elements;
    if (cached && !options?.force) {
      return of(cached);
    }

    return this.api
      .presentationsPresentationIdSlidesSlideIdElementsGet(presentationId, slideId)
      .pipe(
        map((res) => res.data ?? []),
        tap((elements) => this.store.setElementsForSlide(presentationId, slideId, elements)),
      );
  }

  get(
    presentationId: string,
    slideId: string,
    elementId: string,
    options?: CacheOptions,
  ): Observable<ElementDetails | undefined> {
    const cached = this.store
      .presentationDetails()
      .get(presentationId)
      ?.slides?.find((s) => s.id === slideId)
      ?.elements?.find((e) => e.id === elementId);
    if (cached && !options?.force) {
      return of(cached);
    }

    return this.api
      .presentationsPresentationIdSlidesSlideIdElementsElementIdGet(
        presentationId,
        slideId,
        elementId,
      )
      .pipe(
        map((res) => res.data),
        tap((el) => el && this.store.upsertElementInSlide(presentationId, slideId, el)),
      );
  }

  create(
    presentationId: string,
    slideId: string,
    payload: CreateElementRequest,
  ): Observable<ElementDetails | undefined> {
    return this.api
      .presentationsPresentationIdSlidesSlideIdElementsPost(presentationId, slideId, payload)
      .pipe(
        map((res) => res.data),
        tap((el) => el && this.store.upsertElementInSlide(presentationId, slideId, el)),
      );
  }

  update(
    presentationId: string,
    slideId: string,
    elementId: string,
    payload: UpdateElementRequest,
  ): Observable<ElementDetails | undefined> {
    return this.api
      .presentationsPresentationIdSlidesSlideIdElementsElementIdPut(
        presentationId,
        slideId,
        elementId,
        payload,
      )
      .pipe(
        map((res) => res.data),
        tap((el) => el && this.store.upsertElementInSlide(presentationId, slideId, el)),
      );
  }

  remove(presentationId: string, slideId: string, elementId: string): Observable<ObjectResponse> {
    return this.api
      .presentationsPresentationIdSlidesSlideIdElementsElementIdDelete(
        presentationId,
        slideId,
        elementId,
      )
      .pipe(tap(() => this.store.removeElementFromSlide(presentationId, slideId, elementId)));
  }
}
