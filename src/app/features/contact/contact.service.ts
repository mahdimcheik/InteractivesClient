import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '@env/environment';
import { Observable, delay, of } from 'rxjs';

export interface ContactMessage {
  name: string;
  email: string;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class ContactService {
  private readonly http = inject(HttpClient);

  send(payload: ContactMessage): Observable<void> {
    if (environment.useMockAuth) {
      // Pas d'API en mode démo : on simule l'envoi.
      console.info('[ContactService] message simulé', payload);
      return of(undefined as void).pipe(delay(400));
    }
    return this.http.post<void>(`${environment.apiUrl}/contact`, payload);
  }
}
