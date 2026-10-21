import { toSignal } from '@angular/core/rxjs-interop';
import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Injector,
  afterNextRender,
  Component,
  computed,
  effect,
  inject,
  linkedSignal,
  signal,
  untracked,
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
import { SlideshowPlayer } from './components/slideshow-player/slideshow-player';

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
    SlideshowPlayer,
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
  private readonly document = inject(DOCUMENT);
  private readonly injector = inject(Injector);

  protected readonly selectedSlideIndex = signal(0);
  protected readonly isPresenting = signal(false);
  protected readonly isNameModalOpen = signal(false);
  protected readonly savingName = signal(false);

  private readonly presentationId = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('presentationId'))),
    { initialValue: null },
  );

  protected readonly isNewPresentation = computed(
    () => this.presentationId() === NEW_PRESENTATION_ID,
  );

  /** Lu dans le Store : toutes les modifications passent par les services miroir. */
  protected readonly presentation = computed<PresentationDetails | undefined>(() => {
    const id = this.presentationId();
    return id && id !== NEW_PRESENTATION_ID
      ? this.presentationsMirror.presentationDetails().get(id)
      : undefined;
  });

  protected readonly selectedSlide = computed(
    () => this.presentation()?.slides?.[this.selectedSlideIndex()],
  );
  /** Effacée quand on change de diapositive. */
  protected readonly selectedElementId = linkedSignal<string | undefined, string | null>({
    source: () => this.selectedSlide()?.id,
    computation: () => null,
  });
  protected readonly selectedElement = computed(() => {
    const id = this.selectedElementId();
    return id ? this.selectedSlide()?.elements?.find((e) => e.id === id) : undefined;
  });

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
      if (id === NEW_PRESENTATION_ID) {
        this.isNameModalOpen.set(true);
        return;
      }
      if (id) {
        untracked(() => this.presentationsMirror.get(id).subscribe());
      }
    });
  }

  protected stopPresenting(lastIndex: number): void {
    this.isPresenting.set(false);
    this.selectedSlideIndex.set(lastIndex);
    // Le focus revient au bouton qui a lancé la présentation.
    afterNextRender(() => this.document.getElementById('editor-present-button')?.focus(), {
      injector: this.injector,
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
        this.isNameModalOpen.set(false);

        // Diapositive de départ ajoutée en best-effort : une présentation vide reste
        // utilisable, et le bouton "Nouvelle diapositive" permet de réessayer.
        try {
          await firstValueFrom(this.slidesMirror.create(details.id));
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
      next: () => {
        this.savingName.set(false);
        this.isNameModalOpen.set(false);
      },
      error: () => this.savingName.set(false),
    });
  }
}
