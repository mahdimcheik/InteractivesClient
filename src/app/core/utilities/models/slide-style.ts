/**
 * Apparence propre aux diapositives, indépendante du thème clair / sombre de l'application :
 * l'hôte et chaque participant voient la même diapositive. Les valeurs par défaut servent aux
 * diapositives et éléments qui n'en précisent pas.
 */
export const SLIDE_DEFAULT_BACKGROUND = '#ffffff';
export const SLIDE_DEFAULT_TEXT_COLOR = '#1f2937';

/**
 * Familles de polices proposées. Stockées par clé, pas en CSS : aucune police web n'est
 * chargée, ces piles génériques existent sur tous les postes.
 */
export type SlideFont = 'sans' | 'serif' | 'mono';

export const SLIDE_FONTS: Readonly<Record<SlideFont, { label: string; stack: string }>> = {
  sans: {
    label: 'Sans empattement',
    stack: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif",
  },
  serif: { label: 'Avec empattement', stack: "Georgia, Cambria, 'Times New Roman', serif" },
  mono: {
    label: 'Chasse fixe',
    stack: "ui-monospace, 'Cascadia Code', Menlo, Consolas, monospace",
  },
};
