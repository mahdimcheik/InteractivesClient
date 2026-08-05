import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

import { ThemeToggle } from '../theme-toggle/theme-toggle';

@Component({
  selector: 'app-auth-shell',
  imports: [RouterLink, RouterOutlet, ThemeToggle],
  templateUrl: './auth-shell.html',
  styleUrl: './auth-shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthShell {}
