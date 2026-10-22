import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { PresentationDetails } from '@client';
import { PresentationMode } from '@core/utilities/models/enumerators';
import { QuizRuntime } from '@app/shared/slides/elements/quiz-element/quiz-runtime';
import { LiveSessionConnection } from '@core/utilities/services/live-session-connection';
import { LiveSessionsMirrorService } from '@core/utilities/services/live-sessions-mirror.service';
import { SlideView } from '@app/shared/slides/slide-view/slide-view';
import { firstValueFrom } from 'rxjs';

type PageState = 'loading' | 'live' | 'not-found' | 'ended';

/**
 * Écran du participant : la diapositive courante de l'hôte, en mode `Client`, sans navigation
 * propre (le participant reste calé sur l'hôte). Reprend sur la bonne diapositive après une
 * coupure ou une arrivée en cours de séance.
 */
@Component({
  selector: 'app-live-session-page',
  imports: [SlideView, RouterLink],
  providers: [LiveSessionConnection, { provide: QuizRuntime, useExisting: LiveSessionConnection }],
  templateUrl: './live-session-page.html',
  styleUrl: './live-session-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LiveSessionPage {
  private readonly liveSessions = inject(LiveSessionsMirrorService);
  protected readonly connection = inject(LiveSessionConnection);

  /** Paramètre de route `:code` (liaison des paramètres aux inputs). */
  readonly code = input.required<string>();

  protected readonly clientMode = PresentationMode.Client;
  protected readonly presentation = signal<PresentationDetails | undefined>(undefined);
  private readonly failed = signal(false);

  protected readonly state = computed<PageState>(() => {
    if (this.connection.ended()) {
      return 'ended';
    }
    if (this.failed()) {
      return 'not-found';
    }
    return this.presentation() && this.connection.status() !== 'idle' ? 'live' : 'loading';
  });
  protected readonly slides = computed(() => this.presentation()?.slides ?? []);
  protected readonly currentSlide = computed(
    () => this.slides()[Math.min(this.connection.currentSlideIndex(), this.slides().length - 1)],
  );

  constructor() {
    toObservable(this.code).subscribe((code) => void this.load(code.toUpperCase()));
  }

  private async load(code: string): Promise<void> {
    try {
      this.presentation.set(await firstValueFrom(this.liveSessions.presentation(code)));
      await this.connection.joinAsParticipant(code);
    } catch {
      this.failed.set(true);
    }
  }
}
