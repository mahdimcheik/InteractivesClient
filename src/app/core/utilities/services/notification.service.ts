import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface ToastMessage {
  severity: 'success' | 'info' | 'warn' | 'error';
  summary: string;
  detail: string;
  life?: number;
}

/**
 * Remplace `primeng/api`'s `MessageService` : Syncfusion n'a pas de bus de messages global,
 * seulement un composant `<ejs-toast>` impératif. `App` (app.ts) s'abonne à `messages` et
 * pilote son `ejs-toast` en conséquence.
 */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly messages$ = new Subject<ToastMessage>();
  readonly messages = this.messages$.asObservable();

  add(message: ToastMessage): void {
    this.messages$.next(message);
  }
}
