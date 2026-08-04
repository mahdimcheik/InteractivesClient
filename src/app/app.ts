import { ChangeDetectionStrategy, Component, inject, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterOutlet } from '@angular/router';
import { ToastComponent, ToastModule } from '@syncfusion/ej2-angular-notifications';

import { NotificationService } from '@core/utilities/services/notification.service';

const SEVERITY_CSS_CLASS: Record<string, string> = {
  success: 'e-toast-success',
  info: 'e-toast-info',
  warn: 'e-toast-warning',
  error: 'e-toast-danger',
};

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly toast = viewChild<ToastComponent>('toast');
  private readonly notifications = inject(NotificationService);

  constructor() {
    this.notifications.messages.pipe(takeUntilDestroyed()).subscribe((message) => {
      this.toast()?.show({
        title: message.summary,
        content: message.detail,
        cssClass: SEVERITY_CSS_CLASS[message.severity] ?? '',
        timeOut: message.life ?? 5000,
      });
    });
  }
}
