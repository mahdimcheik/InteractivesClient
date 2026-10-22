import { Injectable, inject } from '@angular/core';
import {
  LiveSessionDetails,
  LiveSessionsService as GeneratedLiveSessionsService,
  ObjectResponse,
  PresentationDetails,
} from '@client';
import { Observable, map } from 'rxjs';

/**
 * Miroir de `LiveSessionsService` (client généré). Rien n'est mis en cache : une séance est
 * éphémère, et la présentation vue par un participant n'est pas la sienne (elle ne va pas dans
 * le cache de l'éditeur).
 */
@Injectable({ providedIn: 'root' })
export class LiveSessionsMirrorService {
  private readonly api = inject(GeneratedLiveSessionsService);

  /** Démarre la séance de la présentation, ou reprend celle déjà active. */
  start(presentationId: string): Observable<LiveSessionDetails | undefined> {
    return this.api.liveSessionsPost({ presentationId }).pipe(map((res) => res.data));
  }

  get(code: string): Observable<LiveSessionDetails | undefined> {
    return this.api.liveSessionsCodeGet(code).pipe(map((res) => res.data));
  }

  presentation(code: string): Observable<PresentationDetails | undefined> {
    return this.api.liveSessionsCodePresentationGet(code).pipe(map((res) => res.data));
  }

  end(code: string): Observable<ObjectResponse> {
    return this.api.liveSessionsCodeDelete(code);
  }
}
