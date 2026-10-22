import { Signal } from '@angular/core';

/** Déroulé d'un QCM en séance (`QuizStatusEnum` côté API). */
export type QuizStatus = 'Pending' | 'Open' | 'Closed' | 'Revealed';

/** Vu par un participant : répartition et bonne réponse seulement après la révélation. */
export interface ParticipantQuizState {
  elementId: string;
  status: QuizStatus;
  myAnswer?: number | null;
  counts?: number[] | null;
  correct?: number | null;
}

/** Vu par l'hôte : répartition et réponses nominatives en continu. */
export interface HostQuizState {
  elementId: string;
  status: QuizStatus;
  counts: number[];
  correct?: number | null;
  responses: { participantName: string; answer: number }[];
}

export type LiveRole = 'host' | 'participant';

/**
 * Ce qu'un élément interactif reçoit d'une séance en direct. Fourni par l'écran qui tient la
 * connexion (éditeur de l'hôte, page du participant) ; absent hors séance, où le QCM s'affiche
 * sans interaction. C'est l'extension du contrat des éléments pour remonter une interaction.
 */
export abstract class QuizRuntime {
  /** `null` tant qu'aucune séance n'est rejointe. */
  abstract readonly role: Signal<LiveRole | null>;
  abstract participantState(elementId: string): ParticipantQuizState | undefined;
  abstract hostState(elementId: string): HostQuizState | undefined;
  abstract answerQuiz(elementId: string, answer: number): void;
  abstract openQuiz(elementId: string): void;
  abstract closeQuiz(elementId: string): void;
  abstract revealQuiz(elementId: string): void;
}
