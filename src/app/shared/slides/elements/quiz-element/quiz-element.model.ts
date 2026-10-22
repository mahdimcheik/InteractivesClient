/**
 * Configuration d'un QCM à réponse unique. Attention : la configuration servie aux participants
 * est expurgée de `correct` par l'API ; la fusion avec les défauts y remet `0`. Hors édition,
 * la bonne réponse ne se lit donc **jamais** dans la configuration, seulement dans l'état
 * révélé de la séance.
 */
export interface QuizConfig {
  question: string;
  answers: string[];
  correct: number;
}

export const MIN_QUIZ_ANSWERS = 2;
export const MAX_QUIZ_ANSWERS = 6;
export const QUIZ_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'] as const;

export const QUIZ_DEFAULT_CONFIG: QuizConfig = {
  question: 'Question',
  answers: ['Réponse A', 'Réponse B'],
  correct: 0,
};
