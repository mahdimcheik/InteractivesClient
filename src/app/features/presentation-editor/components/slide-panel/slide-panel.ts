import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

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
  readonly slideSelected = output<number>();

  protected readonly slides: SlideThumbnail[] = [
    { kind: 'title' },
    { kind: 'content' },
    { kind: 'poll' },
  ];
}
