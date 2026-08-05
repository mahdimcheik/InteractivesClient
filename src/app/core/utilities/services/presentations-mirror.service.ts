import { Injectable, inject } from '@angular/core';
import { map, Observable, of, tap } from 'rxjs';

import {
  CreatePresentationRequest,
  ObjectResponse,
  PresentationDetails,
  PresentationsService as GeneratedPresentationsService,
  PresentationSummary,
  UpdatePresentationRequest,
} from '@client';

import { Store } from './store';

export interface CacheOptions {
  /** Ignore le cache et force un appel réseau. */
  force?: boolean;
}

/**
 * Miroir de `PresentationsService` (client généré `src/client`) : noms lisibles et
 * cache dans le {@link Store}, partagé avec les autres services miroir.
 */
@Injectable({ providedIn: 'root' })
export class PresentationsMirrorService {
  private readonly api = inject(GeneratedPresentationsService);
  private readonly store = inject(Store);

  presentations = this.store.presentations;
  presentationDetails = this.store.presentationDetails;

  list(options?: CacheOptions): Observable<PresentationSummary[]> {
    const cached = this.store.presentations();
    if (cached && !options?.force) {
      return of(cached);
    }

    return this.api.presentationsGet().pipe(
      map((res) => res.data ?? []),
      tap((presentations) => this.store.setPresentations(presentations)),
    );
  }

  get(presentationId: string, options?: CacheOptions): Observable<PresentationDetails | undefined> {
    const cached = this.store.presentationDetails().get(presentationId);
    if (cached && !options?.force) {
      return of(cached);
    }

    return this.api.presentationsPresentationIdGet(presentationId).pipe(
      map((res) => res.data),
      tap((details) => details && this.store.upsertPresentationDetails(details)),
    );
  }

  create(payload: CreatePresentationRequest): Observable<PresentationDetails | undefined> {
    return this.api.presentationsPost(payload).pipe(
      map((res) => res.data),
      tap((details) => details && this.store.upsertPresentationDetails(details)),
    );
  }

  update(
    presentationId: string,
    payload: UpdatePresentationRequest,
  ): Observable<PresentationDetails | undefined> {
    return this.api.presentationsPresentationIdPut(presentationId, payload).pipe(
      map((res) => res.data),
      tap((details) => details && this.store.upsertPresentationDetails(details)),
    );
  }

  remove(presentationId: string): Observable<ObjectResponse> {
    return this.api
      .presentationsPresentationIdDelete(presentationId)
      .pipe(tap(() => this.store.removePresentation(presentationId)));
  }
}
