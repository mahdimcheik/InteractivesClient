export type TextRole = 'title' | 'body';

/** `role` absent dans les éléments créés avant son ajout : la fusion avec les défauts donne `'body'`. */
export interface TextElementConfig {
  content: string;
  role: TextRole;
}

export const TEXT_DEFAULT_CONFIG: TextElementConfig = {
  content: '',
  role: 'body',
};
