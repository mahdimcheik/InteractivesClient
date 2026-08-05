import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonModule } from '@syncfusion/ej2-angular-buttons';

import { PresentationsMirrorService } from '@core/utilities/services/presentations-mirror.service';

import { PresentationCard } from '../components/presentation-card/presentation-card';

@Component({
  selector: 'app-my-presentations',
  imports: [PresentationCard, ButtonModule],
  templateUrl: './my-presentations.html',
  styleUrl: './my-presentations.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyPresentations {
  private readonly presentationsMirror = inject(PresentationsMirrorService);
  private readonly router = inject(Router);

  protected readonly presentations = this.presentationsMirror.presentations;

  constructor() {
    this.presentationsMirror.list().subscribe();
  }

  protected createPresentation(): void {
    void this.router.navigate(['/dashboard/editeur', 'new']);
  }
}
