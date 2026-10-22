import { Injectable, OnDestroy, inject, signal } from '@angular/core';
import {
  HostQuizState,
  LiveRole,
  ParticipantQuizState,
  QuizRuntime,
} from '@app/shared/slides/elements/quiz-element/quiz-runtime';
import { environment } from '@env/environment';
import type { HubConnection } from '@microsoft/signalr';

import { NotificationService } from './notification.service';
import { Store } from './store';

interface ParticipantJoinResult {
  currentSlideIndex: number;
  quizzes: ParticipantQuizState[];
}

interface HostJoinResult {
  participantCount: number;
  quizzes: HostQuizState[];
}

function byElement<T extends { elementId: string }>(states: T[]): ReadonlyMap<string, T> {
  return new Map(states.map((state) => [state.elementId, state]));
}

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
export class LiveSessionConnection extends QuizRuntime implements OnDestroy {
  private readonly store = inject(Store);
  private readonly notifications = inject(NotificationService);
  private connection: HubConnection | null = null;
  private join: (() => Promise<void>) | null = null;
  private code: string | null = null;

  readonly role = signal<LiveRole | null>(null);
  /** État des QCM lancés : côté participant (avec sa réponse), côté hôte (nominatif). */
  private readonly participantQuizzes = signal<ReadonlyMap<string, ParticipantQuizState>>(
    new Map(),
  );
  private readonly hostQuizzes = signal<ReadonlyMap<string, HostQuizState>>(new Map());

  readonly status = signal<LiveConnectionStatus>('idle');
  readonly currentSlideIndex = signal(0);
  readonly participantCount = signal(0);
  /** Vrai quand l'hôte a terminé la séance. */
  readonly ended = signal(false);

  /** Participant : rejoint la séance et suit la diapositive de l'hôte. */
  async joinAsParticipant(code: string): Promise<void> {
    await this.open(code, 'participant', async (connection) => {
      const result = await connection.invoke<ParticipantJoinResult>('Join', code);
      this.currentSlideIndex.set(result.currentSlideIndex);
      this.participantQuizzes.set(byElement(result.quizzes));
    });
  }

  /** Hôte : pilote la séance et reçoit le nombre de participants. */
  async joinAsHost(code: string, currentIndex: number): Promise<void> {
    this.currentSlideIndex.set(currentIndex);
    await this.open(code, 'host', async (connection) => {
      const result = await connection.invoke<HostJoinResult>('JoinAsHost', code);
      this.participantCount.set(result.participantCount);
      this.hostQuizzes.set(byElement(result.quizzes));
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

  participantState(elementId: string): ParticipantQuizState | undefined {
    return this.participantQuizzes().get(elementId);
  }

  hostState(elementId: string): HostQuizState | undefined {
    return this.hostQuizzes().get(elementId);
  }

  /** Réponse affichée tout de suite, retirée si le serveur la refuse (vote fermé entre-temps). */
  answerQuiz(elementId: string, answer: number): void {
    const previous = this.participantQuizzes().get(elementId);
    if (!previous || previous.status !== 'Open') {
      return;
    }
    this.setParticipantQuiz({ ...previous, myAnswer: answer });
    this.invoke('AnswerQuiz', elementId, answer).catch(() => {
      const latest = this.participantQuizzes().get(elementId);
      if (latest) {
        this.setParticipantQuiz({ ...latest, myAnswer: previous.myAnswer });
      }
    });
  }

  openQuiz(elementId: string): void {
    void this.invoke('OpenQuiz', elementId).catch(() => undefined);
  }

  closeQuiz(elementId: string): void {
    void this.invoke('CloseQuiz', elementId).catch(() => undefined);
  }

  revealQuiz(elementId: string): void {
    void this.invoke('RevealQuiz', elementId).catch(() => undefined);
  }

  async close(): Promise<void> {
    const connection = this.connection;
    this.connection = null;
    this.join = null;
    this.code = null;
    this.role.set(null);
    this.status.set('closed');
    await connection?.stop();
  }

  ngOnDestroy(): void {
    void this.close();
  }

  /** Appelle une méthode du hub sur la séance rejointe ; un refus est notifié puis relancé. */
  private async invoke(method: string, ...args: unknown[]): Promise<void> {
    if (!this.connection || !this.code) {
      throw new Error('Aucune séance rejointe.');
    }
    try {
      await this.connection.invoke(method, this.code, ...args);
    } catch (error) {
      this.notifications.add({
        severity: 'error',
        summary: 'Action impossible',
        detail: 'La séance n’a pas accepté cette action. Réessayez.',
      });
      throw error;
    }
  }

  private setParticipantQuiz(state: ParticipantQuizState): void {
    this.participantQuizzes.update((map) => new Map(map).set(state.elementId, state));
  }

  private async open(
    code: string,
    role: LiveRole,
    join: (connection: HubConnection) => Promise<void>,
  ): Promise<void> {
    if (this.connection) {
      return;
    }
    this.code = code;
    this.role.set(role);
    const signalR = await import('@microsoft/signalr');
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${environment.apiUrl}${HUB_PATH}`, {
        accessTokenFactory: () => this.store.token() ?? '',
      })
      .withAutomaticReconnect()
      .build();

    connection.on('SlideChanged', (index: number) => this.currentSlideIndex.set(index));
    connection.on('ParticipantCountChanged', (count: number) => this.participantCount.set(count));
    // Diffusé à tous sans réponse personnelle : on garde celle du participant.
    connection.on('QuizStateChanged', (state: ParticipantQuizState) =>
      this.setParticipantQuiz({
        ...state,
        myAnswer: this.participantQuizzes().get(state.elementId)?.myAnswer ?? null,
      }),
    );
    connection.on('QuizResultsChanged', (state: HostQuizState) =>
      this.hostQuizzes.update((map) => new Map(map).set(state.elementId, state)),
    );
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
