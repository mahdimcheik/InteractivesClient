import { Directive, computed, input } from '@angular/core';
import { ElementDetails } from '@client';

import { PresentationMode } from './enumerators';

@Directive()
export abstract class SlideElementBase {
  element = input.required<ElementDetails>();
  mode = input.required<PresentationMode>();

  protected readonly isEditable = computed(() => this.mode() === PresentationMode.Edit);
  protected readonly config = computed(
    () => JSON.parse(this.element().configuration ?? '{}') as unknown,
  );
}
