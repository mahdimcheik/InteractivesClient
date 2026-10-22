import { Injectable, OnDestroy, inject, signal } from '@angular/core';
import { environment } from '@env/environment';
import type { HubConnection } from '@microsoft/signalr';

import { Store } from './store';

export type LiveConnectionStatus = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'closed';

/** Chemin du hub côté API (`LiveSessionHub.Path`). */
const HUB_PATH = '/hubs/live-session';

/**
 * Connexion SignalR à une séance en direct, pour l'hôte comme pour un participant. Une
 * instance par écran (à fournir dans `providers` du composant) : la connexion est ouverte une
 * seule fois et fermée à la destruction. Le jeton est relu à chaque (re)connexion, et une
 * reconnexion rejoint de nouveau la séance pour reprendre sur la diapositive courante.
 */
@Injectable()
export class LiveSessionConnection implements OnDestroy {
  private readonly store = inject(Store);
  private connection: HubConnection | null = null;
  private join: (() => Promise<void>) | null = null;

  readonly status = signal<LiveConnectionStatus>('idle');
  readonly currentSlideIndex = signal(0);
  readonly participantCount = signal(0);
  /** Vrai quand l'hôte a terminé la séance. */
  readonly ended = signal(false);

  /** Participant : rejoint la séance et suit la diapositive de l'hôte. */
  async joinAsParticipant(code: string): Promise<void> {
    await this.open(async (connection) => {
      this.currentSlideIndex.set(await connection.invoke<number>('Join', code));
    });
  }

  /** Hôte : pilote la séance et reçoit le nombre de participants. */
  async joinAsHost(code: string, currentIndex: number): Promise<void> {
    this.currentSlideIndex.set(currentIndex);
    await this.open(async (connection) => {
      this.participantCount.set(await connection.invoke<number>('JoinAsHost', code));
      // Après une coupure, l'hôte réaligne la séance sur la diapositive qu'il affiche.
      await connection.invoke('GoToSlide', code, this.currentSlideIndex());
    });
  }

  async goToSlide(code: string, index: number): Promise<void> {
    this.currentSlideIndex.set(index);
    if (this.connection && this.status() === 'connected') {
      await this.connection.invoke('GoToSlide', code, index);
    }
  }

  async close(): Promise<void> {
    const connection = this.connection;
    this.connection = null;
    this.join = null;
    this.status.set('closed');
    await connection?.stop();
  }

  ngOnDestroy(): void {
    void this.close();
  }

  private async open(join: (connection: HubConnection) => Promise<void>): Promise<void> {
    if (this.connection) {
      return;
    }
    const signalR = await import('@microsoft/signalr');
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${environment.apiUrl}${HUB_PATH}`, {
        accessTokenFactory: () => this.store.token() ?? '',
      })
      .withAutomaticReconnect()
      .build();

    connection.on('SlideChanged', (index: number) => this.currentSlideIndex.set(index));
    connection.on('ParticipantCountChanged', (count: number) => this.participantCount.set(count));
    connection.on('SessionEnded', () => {
      this.ended.set(true);
      void this.close();
    });
    connection.onreconnecting(() => this.status.set('reconnecting'));
    connection.onreconnected(async () => {
      this.status.set('connected');
      await this.join?.();
    });
    connection.onclose(() => this.status.set('closed'));

    this.connection = connection;
    this.join = () => join(connection);
    this.status.set('connecting');
    try {
      await connection.start();
      this.status.set('connected');
      await this.join();
    } catch (error) {
      await this.close();
      throw error;
    }
  }
}
