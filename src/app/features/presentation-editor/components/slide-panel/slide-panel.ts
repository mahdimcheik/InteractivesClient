import {
  ChangeDetectionStrategy,
  Component,
  input,
  linkedSignal,
  model,
  output,
} from '@angular/core';
import { PresentationDetails, SlideDetails } from '@client/models';

interface SlideThumbnail {
  kind: 'title' | 'content' | 'poll';
}

@Component({
  selector: 'app-slide-panel',
  templateUrl: './slide-panel.html',
  styleUrl: './slide-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SlidePanel {
  readonly selectedSlideIndex = input(0);
  presentation = model<PresentationDetails>();
  slides = linkedSignal<SlideDetails[]>(() => this.presentation()?.slides ?? []);
  readonly slideSelected = output<number>();
}
