import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { PresentationMode } from '@core/utilities/models/enumerators';
import { SlideElementBase } from '@core/utilities/models/slide-element-base';

import { EditableText } from '../shared/editable-text';
import { defaultTextAppearance } from '../shared/text-appearance';
import { QUIZ_DEFAULT_CONFIG, QUIZ_LETTERS, QuizConfig } from './quiz-element.model';
import { QuizRuntime } from './quiz-runtime';

/**
 * QCM à réponse unique. Édition : question et réponses modifiables en place (la bonne réponse se
 * choisit dans le panneau). En séance (`QuizRuntime` fourni) : l'hôte ouvre, ferme puis révèle le
 * vote (mode `Presentation`), le participant répond (mode `Client`). Hors séance : affichage seul.
 */
@Component({
  selector: 'app-quiz-element',
  imports: [EditableText],
  templateUrl: './quiz-element.html',
  styleUrl: './quiz-element.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuizElement extends SlideElementBase<QuizConfig> {
  private readonly runtime = inject(QuizRuntime, { optional: true });

  protected readonly defaultConfig = QUIZ_DEFAULT_CONFIG;
  protected readonly letters = QUIZ_LETTERS;
  protected readonly questionAppearance = { ...defaultTextAppearance('title'), fontSize: 44 };
  protected readonly answerAppearance = { ...defaultTextAppearance('body'), fontSize: 28 };

  private readonly elementId = computed(() => this.element().id ?? '');
  protected readonly isHost = computed(
    () => this.mode() === PresentationMode.Presentation && this.runtime?.role() === 'host',
  );
  protected readonly isParticipant = computed(
    () => this.mode() === PresentationMode.Client && this.runtime?.role() === 'participant',
  );
  protected readonly hostState = computed(() =>
    this.isHost() ? this.runtime?.hostState(this.elementId()) : undefined,
  );
  protected readonly participantState = computed(() =>
    this.isParticipant() ? this.runtime?.participantState(this.elementId()) : undefined,
  );
  protected readonly status = computed(
    () => this.hostState()?.status ?? this.participantState()?.status ?? 'Pending',
  );
  protected readonly myAnswer = computed(() => this.participantState()?.myAnswer ?? null);

  /** Bonne réponse affichable : en édition (config), sinon seulement une fois révélée. */
  protected readonly correct = computed(() => {
    if (this.isEditable()) {
      return this.config().correct;
    }
    return this.hostState()?.correct ?? this.participantState()?.correct ?? null;
  });

  /** Répartition : en continu pour l'hôte, après révélation pour le participant. */
  protected readonly counts = computed(
    () => this.hostState()?.counts ?? this.participantState()?.counts ?? null,
  );
  protected readonly total = computed(() => (this.counts() ?? []).reduce((a, b) => a + b, 0));
  protected readonly showDistribution = computed(
    () => this.counts() !== null && (this.isParticipant() || this.status() !== 'Pending'),
  );

  protected readonly participantMessage = computed(() => {
    const status = this.status();
    if (status === 'Pending') {
      return 'Le vote n’est pas encore ouvert.';
    }
    if (status === 'Open') {
      return this.myAnswer() === null
        ? 'Vote ouvert : choisissez une réponse.'
        : 'Réponse enregistrée. Vous pouvez la changer tant que le vote est ouvert.';
    }
    if (status === 'Closed') {
      return 'Vote fermé. En attente de la réponse.';
    }
    if (this.myAnswer() === null) {
      return 'Vous n’avez pas répondu.';
    }
    return this.myAnswer() === this.correct() ? 'Bonne réponse !' : 'Mauvaise réponse.';
  });

  protected percent(index: number): number {
    const total = this.total();
    return total ? Math.round(((this.counts()?.[index] ?? 0) * 100) / total) : 0;
  }

  protected answer(index: number): void {
    this.runtime?.answerQuiz(this.elementId(), index);
  }

  /** Les boutons de l'hôte ne doivent pas faire avancer le lecteur (clic = diapositive suivante). */
  protected hostAction(event: Event, action: 'open' | 'close' | 'reveal'): void {
    event.stopPropagation();
    const id = this.elementId();
    if (action === 'open') {
      this.runtime?.openQuiz(id);
    } else if (action === 'close') {
      this.runtime?.closeQuiz(id);
    } else {
      this.runtime?.revealQuiz(id);
    }
  }

  protected saveAnswer(index: number, text: string): void {
    this.saveConfig({ answers: this.config().answers.map((a, i) => (i === index ? text : a)) });
  }
}
