import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { StoredFile } from '@client';

import { ImageConfig } from '../image-element/image-element.model';
import { ImagePicker } from './image-picker';

/**
 * Affiche une image configurée, ou le sélecteur si aucune image n'est encore choisie (édition) ;
 * hors édition, une image vide ne rend rien.
 * En édition : remplacement de l'image et saisie du texte alternatif.
 */
@Component({
  selector: 'app-image-view',
  imports: [NgOptimizedImage, ImagePicker],
  template: `
    @if (image().url; as url) {
      <img [ngSrc]="url" fill [alt]="image().alt" [style.object-fit]="image().fit" />
      @if (editable()) {
        <div class="image-edit-bar">
          <input
            class="alt-input"
            type="text"
            placeholder="Texte alternatif"
            aria-label="Texte alternatif de l’image"
            [value]="image().alt"
            (change)="onAltChange($event)"
          />
          <app-image-picker
            [presentationId]="presentationId()"
            label="Remplacer"
            [compact]="true"
            (picked)="picked.emit($event)"
          />
        </div>
      }
    } @else if (editable()) {
      <app-image-picker [presentationId]="presentationId()" (picked)="picked.emit($event)" />
    }
  `,
  styleUrl: './image-view.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageView {
  readonly image = input.required<ImageConfig>();
  readonly editable = input(false);
  readonly presentationId = input.required<string>();

  readonly picked = output<StoredFile>();
  readonly altChanged = output<string>();

  protected onAltChange(event: Event): void {
    this.altChanged.emit((event.target as HTMLInputElement).value.trim());
  }
}
