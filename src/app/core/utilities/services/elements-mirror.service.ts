import { Injectable, inject } from '@angular/core';
import { catchError, defer, map, Observable, of, tap, throwError } from 'rxjs';

import {
  CreateElementRequest,
  ElementDetails,
  ElementsService as GeneratedElementsService,
  ObjectResponse,
  UpdateElementRequest,
} from '@client';

import { CacheOptions } from './presentations-mirror.service';
import { Store } from './store';

/** Champs modifiables d'un élément (le type est figé à la création). */
export type ElementChanges = Partial<
  Pick<
    ElementDetails,
    'x' | 'y' | 'width' | 'height' | 'rotation' | 'zIndex' | 'locked' | 'visible' | 'configuration'
  >
>;

function toUpdateRequest(element: ElementDetails): UpdateElementRequest {
  return {
    x: element.x ?? 0,
    y: element.y ?? 0,
    width: element.width ?? 0,
    height: element.height ?? 0,
    rotation: element.rotation ?? 0,
    zIndex: element.zIndex ?? 0,
    locked: element.locked ?? false,
    visible: element.visible ?? true,
    configuration: element.configuration ?? '{}',
  };
}

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
    const cached = this.findCached(presentationId, slideId, elementId);
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

  /**
   * Modifie une partie d'un élément en cache : appliqué tout de suite dans le {@link Store}, puis
   * envoyé. L'API remplaçant l'élément entier, la requête part toujours de la dernière version en
   * cache. En cas d'échec, seuls les champs modifiés reprennent leur valeur précédente, pour ne
   * pas défaire une autre modification arrivée entre-temps. La réponse n'est pas réécrite dans le
   * cache : une réponse lente écraserait une modification plus récente.
   */
  patch(
    presentationId: string,
    slideId: string,
    elementId: string,
    changes: ElementChanges,
  ): Observable<ElementDetails | undefined> {
    return defer(() => {
      const current = this.findCached(presentationId, slideId, elementId);
      if (!current) {
        return throwError(() => new Error(`Élément ${elementId} absent du cache.`));
      }

      const previous: ElementChanges = {};
      for (const key of Object.keys(changes) as (keyof ElementChanges)[]) {
        Object.assign(previous, { [key]: current[key] });
      }

      const next = { ...current, ...changes };
      this.store.upsertElementInSlide(presentationId, slideId, next);

      return this.api
        .presentationsPresentationIdSlidesSlideIdElementsElementIdPut(
          presentationId,
          slideId,
          elementId,
          toUpdateRequest(next),
        )
        .pipe(
          map((res) => res.data),
          catchError((err: unknown) => {
            const latest = this.findCached(presentationId, slideId, elementId);
            if (latest) {
              this.store.upsertElementInSlide(presentationId, slideId, { ...latest, ...previous });
            }
            return throwError(() => err);
          }),
        );
    });
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

  private findCached(
    presentationId: string,
    slideId: string,
    elementId: string,
  ): ElementDetails | undefined {
    return this.store
      .presentationDetails()
      .get(presentationId)
      ?.slides?.find((s) => s.id === slideId)
      ?.elements?.find((e) => e.id === elementId);
  }
}
