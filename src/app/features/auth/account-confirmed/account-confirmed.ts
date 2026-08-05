import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { AuthMirrorService } from '@app/core/utilities/services/auth-mirror.service';

type ConfirmationStatus = 'loading' | 'success' | 'error';

@Component({
  selector: 'app-account-confirmed',
  imports: [RouterLink],
  templateUrl: './account-confirmed.html',
  styleUrl: '../auth-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountConfirmed {
  private readonly auth = inject(AuthMirrorService);
  private readonly route = inject(ActivatedRoute);

  protected readonly status = signal<ConfirmationStatus>('loading');

  constructor() {
    const userId = this.route.snapshot.queryParamMap.get('userId');
    const token = this.route.snapshot.queryParamMap.get('token');

    if (!userId || !token) {
      this.status.set('error');
      return;
    }

    this.auth.confirmEmail(userId, token).subscribe({
      next: () => this.status.set('success'),
      error: () => this.status.set('error'),
    });
  }
}
