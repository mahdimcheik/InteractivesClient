import { toSignal } from '@angular/core/rxjs-interop';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom, map } from 'rxjs';

import { PresentationDetails } from '@client';
import { PresentationsMirrorService } from '@core/utilities/services/presentations-mirror.service';
import { SlidesMirrorService } from '@core/utilities/services/slides-mirror.service';

import { EditorHeader } from './components/editor-header/editor-header';
import { EditorToolbar } from './components/editor-toolbar/editor-toolbar';
import { PresentationNameModal } from './components/presentation-name-modal/presentation-name-modal';
import { PropertiesPanel } from './components/properties-panel/properties-panel';
import { SlideCanvas } from './components/slide-canvas/slide-canvas';
import { SlidePanel } from './components/slide-panel/slide-panel';

const NEW_PRESENTATION_ID = 'new';

@Component({
  selector: 'app-presentation-editor',
  imports: [
    EditorHeader,
    EditorToolbar,
    SlidePanel,
    SlideCanvas,
    PropertiesPanel,
    PresentationNameModal,
  ],
  templateUrl: './presentation-editor.html',
  styleUrl: './presentation-editor.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PresentationEditor {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly presentationsMirror = inject(PresentationsMirrorService);
  private readonly slidesMirror = inject(SlidesMirrorService);

  protected readonly selectedSlideIndex = signal(0);
  protected readonly isNameModalOpen = signal(false);
  protected readonly savingName = signal(false);

  private readonly presentationId = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('presentationId'))),
    { initialValue: null },
  );

  protected readonly isNewPresentation = computed(
    () => this.presentationId() === NEW_PRESENTATION_ID,
  );

  protected readonly presentation = signal<PresentationDetails | undefined>(undefined);

  protected readonly presentationTitle = computed(() => {
    const title = this.presentation()?.title;
    if (title) {
      return title;
    }
    return this.isNewPresentation() ? 'Nouvelle présentation' : '';
  });

  protected readonly nameModalInitialTitle = computed(() =>
    this.isNewPresentation() ? '' : (this.presentation()?.title ?? ''),
  );

  constructor() {
    // Pas de chargement pour `new` : l'éditeur démarre sur une présentation vide et
    // ouvre la modale de nommage pour la créer.
    effect(() => {
      const id = this.presentationId();
      if (!id || id === NEW_PRESENTATION_ID) {
        this.presentation.set(undefined);
        if (id === NEW_PRESENTATION_ID) {
          this.isNameModalOpen.set(true);
        }
        return;
      }

      this.presentationsMirror.get(id).subscribe((details) => this.presentation.set(details));
    });
  }

  protected openRenameModal(): void {
    this.isNameModalOpen.set(true);
  }

  protected async saveName(title: string): Promise<void> {
    this.savingName.set(true);

    if (this.isNewPresentation()) {
      try {
        const details = await firstValueFrom(this.presentationsMirror.create({ title }));
        this.savingName.set(false);
        if (!details?.id) {
          return;
        }
        this.presentation.set(details);
        this.isNameModalOpen.set(false);

        // Diapositive de départ ajoutée en best-effort : une présentation vide reste
        // utilisable, et le bouton "Nouvelle diapositive" permet de réessayer.
        try {
          const slide = await firstValueFrom(this.slidesMirror.create(details.id));
          if (slide) {
            this.presentation.update((p) =>
              p ? { ...p, slides: [...(p.slides ?? []), slide] } : p,
            );
          }
        } catch {
          // Ignoré : l'utilisateur peut ajouter une diapositive manuellement.
        }

        // Remplace `new` par l'id réel une fois la présentation créée côté serveur.
        void this.router.navigate(['/dashboard/editeur', details.id], { replaceUrl: true });
      } catch {
        this.savingName.set(false);
      }
      return;
    }

    const id = this.presentationId();
    if (!id) {
      this.savingName.set(false);
      return;
    }

    this.presentationsMirror.update(id, { title }).subscribe({
      next: (details) => {
        this.savingName.set(false);
        if (details) {
          this.presentation.set(details);
        }
        this.isNameModalOpen.set(false);
      },
      error: () => this.savingName.set(false),
    });
  }
}
