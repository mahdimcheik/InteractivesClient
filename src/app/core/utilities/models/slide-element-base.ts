import { Directive, computed, inject, input } from '@angular/core';
import { ElementDetails } from '@client';

import { ElementsMirrorService } from '../services/elements-mirror.service';
import { NotificationService } from '../services/notification.service';
import { PresentationMode } from './enumerators';

/** Fusionne la configuration JSON stockée avec les valeurs par défaut ; JSON invalide ⇒ défauts. */
export function parseElementConfig<TConfig extends object>(
  raw: string | null | undefined,
  defaults: TConfig,
): TConfig {
  if (!raw) {
    return { ...defaults };
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? { ...defaults, ...parsed } : { ...defaults };
  } catch {
    return { ...defaults };
  }
}

/**
 * Lecture et enregistrement de la configuration typée d'un élément. Partagé par le composant de
 * rendu ({@link SlideElementBase}) et par le panneau de propriétés de chaque élément.
 */
@Directive()
export abstract class ElementConfigEditor<TConfig extends object> {
  private readonly elementsMirror = inject(ElementsMirrorService);
  private readonly notifications = inject(NotificationService);

  readonly element = input.required<ElementDetails>();
  readonly presentationId = input.required<string>();

  protected abstract readonly defaultConfig: TConfig;

  protected readonly config = computed(() =>
    parseElementConfig(this.element().configuration, this.defaultConfig),
  );

  /**
   * Enregistre la configuration fusionnée. Le {@link Store} est mis à jour avant la réponse (et
   * rétabli en cas d'échec) : `element()`, rendu depuis le Store, suit sans copie locale.
   */
  protected saveConfig(patch: Partial<TConfig>): void {
    const el = this.element();
    if (!el.id || !el.slideId) {
      return;
    }

    const configuration = JSON.stringify({ ...this.config(), ...patch });
    this.elementsMirror
      .patch(this.presentationId(), el.slideId, el.id, { configuration })
      .subscribe({
        error: () =>
          this.notifications.add({
            severity: 'error',
            summary: 'Échec de l’enregistrement',
            detail: 'La modification n’a pas pu être enregistrée.',
          }),
      });
  }
}

/**
 * Contrat commun de tout élément de diapositive.
 *
 * Le rendu ne dépend que de `config()` et `mode()` : le même composant sert à l'éditeur (`Edit`),
 * à l'hôte (`Presentation`), aux participants (`Client`) et aux miniatures (`Thumbnail`).
 * Aucune affordance d'édition hors du mode `Edit`.
 */
@Directive()
export abstract class SlideElementBase<
  TConfig extends object,
> extends ElementConfigEditor<TConfig> {
  readonly mode = input.required<PresentationMode>();

  protected readonly isEditable = computed(() => this.mode() === PresentationMode.Edit);
}
