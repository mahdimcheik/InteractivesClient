import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ElementTypeEnum } from '@client';
import { PresentationMode } from '@core/utilities/models/enumerators';
import { ElementsMirrorService } from '@core/utilities/services/elements-mirror.service';
import { NotificationService } from '@core/utilities/services/notification.service';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { QuizElement } from './quiz-element';
import { QuizElementPanel } from './quiz-element-panel';
import { HostQuizState, LiveRole, ParticipantQuizState, QuizRuntime } from './quiz-runtime';

class FakeRuntime extends QuizRuntime {
  readonly role = signal<LiveRole | null>(null);
  readonly participant = signal<ParticipantQuizState | undefined>(undefined);
  readonly host = signal<HostQuizState | undefined>(undefined);
  participantState = () => this.participant();
  hostState = () => this.host();
  answerQuiz = vi.fn();
  openQuiz = vi.fn();
  closeQuiz = vi.fn();
  revealQuiz = vi.fn();
}

const element = (configuration: object) => ({
  id: 'quiz-1',
  slideId: 'slide-1',
  type: ElementTypeEnum.Quiz,
  configuration: JSON.stringify(configuration),
});

describe('QuizElement', () => {
  let runtime: FakeRuntime;
  const patch = vi.fn();

  function render(mode: PresentationMode, configuration: object) {
    const fixture = TestBed.createComponent(QuizElement);
    fixture.componentRef.setInput('element', element(configuration));
    fixture.componentRef.setInput('mode', mode);
    fixture.componentRef.setInput('presentationId', 'pres-1');
    fixture.detectChanges();
    return { fixture, root: fixture.nativeElement as HTMLElement };
  }

  beforeEach(() => {
    runtime = new FakeRuntime();
    patch.mockReset();
    TestBed.configureTestingModule({
      providers: [
        { provide: QuizRuntime, useValue: runtime },
        { provide: ElementsMirrorService, useValue: { patch } },
        { provide: NotificationService, useValue: { add: vi.fn() } },
      ],
    });
  });

  // L'API retire `correct` de la configuration servie aux participants : la fusion avec les
  // défauts y remet 0. Ce test fixe la règle : hors édition, la config n'indique rien.
  it('participant : rien ne trahit la bonne réponse avant la révélation', () => {
    runtime.role.set('participant');
    runtime.participant.set({ elementId: 'quiz-1', status: 'Open' });
    const { root } = render(PresentationMode.Client, { question: 'Q', answers: ['a', 'b'] });

    expect(root.querySelector('.is-correct, .quiz-mark')).toBeNull();
    expect(root.textContent).toContain('Vote ouvert');
  });

  it('participant : répond quand le vote est ouvert, pas avant', () => {
    runtime.role.set('participant');
    runtime.participant.set({ elementId: 'quiz-1', status: 'Pending' });
    const { fixture, root } = render(PresentationMode.Client, {
      question: 'Q',
      answers: ['a', 'b'],
    });
    const choices = () => root.querySelectorAll<HTMLButtonElement>('.quiz-choice');
    expect(choices()[1].disabled).toBe(true);

    runtime.participant.set({ elementId: 'quiz-1', status: 'Open' });
    fixture.detectChanges();
    choices()[1].click();
    expect(runtime.answerQuiz).toHaveBeenCalledWith('quiz-1', 1);
  });

  it('participant : après révélation, sa réponse, la bonne et la répartition', () => {
    runtime.role.set('participant');
    runtime.participant.set({
      elementId: 'quiz-1',
      status: 'Revealed',
      myAnswer: 0,
      correct: 1,
      counts: [1, 3],
    });
    const { root } = render(PresentationMode.Client, { question: 'Q', answers: ['a', 'b'] });

    const answers = root.querySelectorAll('.quiz-answer');
    expect(answers[0].classList).toContain('is-wrong');
    expect(answers[1].classList).toContain('is-correct');
    expect(answers[1].textContent).toContain('75 %');
    expect(root.querySelector('[role="status"]')!.textContent).toContain('Mauvaise réponse');
  });

  it('hôte : pilote le vote sans faire avancer le lecteur', () => {
    runtime.role.set('host');
    runtime.host.set({ elementId: 'quiz-1', status: 'Pending', counts: [0, 0], responses: [] });
    const { fixture, root } = render(PresentationMode.Presentation, {
      question: 'Q',
      answers: ['a', 'b'],
      correct: 1,
    });
    const parentClick = vi.fn();
    root.addEventListener('click', parentClick);

    root.querySelector<HTMLButtonElement>('.quiz-host button')!.click();
    expect(runtime.openQuiz).toHaveBeenCalledWith('quiz-1');
    expect(parentClick).not.toHaveBeenCalled();

    runtime.host.set({ elementId: 'quiz-1', status: 'Open', counts: [2, 1], responses: [] });
    fixture.detectChanges();
    expect(root.textContent).toContain('3 réponses');
    expect(root.querySelector('.quiz-mark')).toBeNull();
  });

  it('édition : la bonne réponse vient de la configuration', () => {
    const { root } = render(PresentationMode.Edit, {
      question: 'Q',
      answers: ['a', 'b'],
      correct: 1,
    });
    expect(root.querySelectorAll('.quiz-answer')[1].classList).toContain('is-correct');
  });
});

describe('QuizElementPanel', () => {
  const patch = vi.fn(() => ({ subscribe: () => undefined }));

  it('retirer une réponse garde la bonne réponse sur son texte', () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: ElementsMirrorService, useValue: { patch } },
        { provide: NotificationService, useValue: { add: vi.fn() } },
      ],
    });
    const fixture = TestBed.createComponent(QuizElementPanel);
    fixture.componentRef.setInput(
      'element',
      element({ question: 'Q', answers: ['a', 'b', 'c'], correct: 2 }),
    );
    fixture.componentRef.setInput('presentationId', 'pres-1');
    fixture.detectChanges();

    fixture.nativeElement.querySelector('button[aria-label="Retirer la réponse A"]').click();

    const [, , , changes] = patch.mock.calls[0] as unknown as [
      string,
      string,
      string,
      { configuration: string },
    ];
    expect(JSON.parse(changes.configuration)).toEqual({
      question: 'Q',
      answers: ['b', 'c'],
      correct: 1,
    });
  });
});
