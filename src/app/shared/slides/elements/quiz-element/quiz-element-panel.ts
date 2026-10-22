import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ElementConfigEditor } from '@core/utilities/models/slide-element-base';

import {
  MAX_QUIZ_ANSWERS,
  MIN_QUIZ_ANSWERS,
  QUIZ_DEFAULT_CONFIG,
  QUIZ_LETTERS,
  QuizConfig,
} from './quiz-element.model';

/** Réponses du QCM : texte, bonne réponse (une seule), ajout et retrait. */
@Component({
  selector: 'app-quiz-element-panel',
  template: `
    <fieldset class="field quiz-fieldset">
      <legend class="field-label">Réponses (cochez la bonne)</legend>
      @for (answer of config().answers; track $index; let i = $index) {
        <div class="quiz-row">
          <input
            type="radio"
            name="prop-quiz-correct"
            [id]="'prop-quiz-correct-' + i"
            [checked]="config().correct === i"
            [attr.aria-label]="'Réponse ' + letters[i] + ' est la bonne réponse'"
            (change)="saveConfig({ correct: i })"
          />
          <label class="quiz-letter" [for]="'prop-quiz-answer-' + i">{{ letters[i] }}</label>
          <input
            type="text"
            class="quiz-input"
            [id]="'prop-quiz-answer-' + i"
            [value]="answer"
            (change)="saveAnswer(i, $any($event.target).value)"
          />
          <button
            type="button"
            class="toggle"
            [attr.aria-label]="'Retirer la réponse ' + letters[i]"
            [disabled]="config().answers.length <= minAnswers"
            (click)="removeAnswer(i)"
          >
            <i class="pi pi-times" aria-hidden="true"></i>
          </button>
        </div>
      }
    </fieldset>
    <button
      type="button"
      class="toggle"
      [disabled]="config().answers.length >= maxAnswers"
      (click)="addAnswer()"
    >
      <i class="pi pi-plus" aria-hidden="true"></i>&nbsp;Ajouter une réponse
    </button>
  `,
  styleUrls: ['../shared/panel-fields.scss', './quiz-element-panel.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuizElementPanel extends ElementConfigEditor<QuizConfig> {
  protected readonly defaultConfig = QUIZ_DEFAULT_CONFIG;
  protected readonly letters = QUIZ_LETTERS;
  protected readonly minAnswers = MIN_QUIZ_ANSWERS;
  protected readonly maxAnswers = MAX_QUIZ_ANSWERS;

  protected saveAnswer(index: number, text: string): void {
    this.saveConfig({ answers: this.config().answers.map((a, i) => (i === index ? text : a)) });
  }

  protected addAnswer(): void {
    const answers = this.config().answers;
    if (answers.length < MAX_QUIZ_ANSWERS) {
      this.saveConfig({ answers: [...answers, `Réponse ${QUIZ_LETTERS[answers.length]}`] });
    }
  }

  /** Retirer une réponse décale les suivantes : la bonne réponse suit son texte. */
  protected removeAnswer(index: number): void {
    const { answers, correct } = this.config();
    if (answers.length <= MIN_QUIZ_ANSWERS) {
      return;
    }
    this.saveConfig({
      answers: answers.filter((_, i) => i !== index),
      correct: correct === index ? 0 : correct > index ? correct - 1 : correct,
    });
  }
}
