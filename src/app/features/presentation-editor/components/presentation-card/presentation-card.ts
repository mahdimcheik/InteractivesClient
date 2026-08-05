import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { PresentationSummary } from '@client';

@Component({
  selector: 'app-presentation-card',
  imports: [RouterLink, DatePipe],
  templateUrl: './presentation-card.html',
  styleUrl: './presentation-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PresentationCard {
  readonly presentation = input.required<PresentationSummary>();
}
