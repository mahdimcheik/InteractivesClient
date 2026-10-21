import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  PLATFORM_ID,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ButtonModule } from '@syncfusion/ej2-angular-buttons';
import { debounceTime, filter, fromEvent } from 'rxjs';

import { AuthMirrorService } from '@core/utilities/services/auth-mirror.service';
import { StorageService } from '@core/utilities/services/storage.service';

import { ThemeToggle } from '../theme-toggle/theme-toggle';

interface SidebarLink {
  readonly path: string;
  readonly label: string;
  readonly icon: string;
  readonly exact: boolean;
}

const SIDEBAR_COLLAPSED_STORAGE_KEY = 'sidebarCollapsed';
const MOBILE_BREAKPOINT_PX = 768; // aligné avec le media query `48rem` de dashboard-layout.scss

@Component({
  selector: 'app-dashboard-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ButtonModule, ThemeToggle],
  templateUrl: './dashboard-layout.html',
  styleUrl: './dashboard-layout.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'onEscapeKeydown()',
  },
})
export class DashboardLayout {
  private readonly auth = inject(AuthMirrorService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly storage = inject(StorageService);
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private readonly navPanel = viewChild<ElementRef<HTMLElement>>('navPanel');
  // `read` est requis : le bouton porte le composant `ejs-button`, que la référence viserait sinon.
  private readonly toggleButtonEl = viewChild('toggleButtonEl', {
    read: ElementRef<HTMLButtonElement>,
  });

  protected readonly fullName = this.auth.fullName;

  /** Écran < 768px : le menu devient une superposition plutôt qu'une colonne. */
  protected readonly isMobile = signal(false);
  /** Préférence bureau réduit/étendu, persistée entre les sessions. */
  protected readonly desktopCollapsed = signal(this.readStoredCollapsed());
  /** Superposition mobile ouverte/fermée, jamais persistée. */
  protected readonly mobileOpen = signal(false);

  protected readonly isOverlayVisible = computed(() => this.isMobile() && this.mobileOpen());
  protected readonly isNavVisible = computed(() => !this.isMobile() || this.isOverlayVisible());
  protected readonly isIconOnly = computed(() => !this.isMobile() && this.desktopCollapsed());

  protected readonly toggleAriaExpanded = computed(() =>
    this.isMobile() ? this.mobileOpen() : !this.desktopCollapsed(),
  );
  protected readonly toggleAriaLabel = computed(() => {
    if (this.isMobile()) {
      return this.mobileOpen() ? 'Fermer le menu' : 'Ouvrir le menu';
    }
    return this.desktopCollapsed() ? 'Étendre le menu' : 'Réduire le menu';
  });

  protected readonly links: readonly SidebarLink[] = [
    { path: '/dashboard', label: "Vue d'ensemble", icon: 'pi-home', exact: true },
    { path: '/dashboard/profil', label: 'Profil', icon: 'pi-user', exact: false },
    { path: '/dashboard/presentations', label: 'Éditeur', icon: 'pi-th-large ', exact: false },
    { path: '/dashboard/parametres', label: 'Paramètres', icon: 'pi-cog', exact: false },
  ];

  constructor() {
    if (this.isBrowser) {
      this.updateViewport();
      fromEvent(window, 'resize')
        .pipe(debounceTime(150), takeUntilDestroyed(this.destroyRef))
        .subscribe(() => this.updateViewport());
    }

    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.mobileOpen.set(false));

    effect(() => {
      if (!this.isBrowser) {
        return;
      }
      this.document.body.style.overflow = this.isOverlayVisible() ? 'hidden' : '';
    });

    effect(() => {
      if (!this.isBrowser) {
        return;
      }
      if (this.isOverlayVisible()) {
        this.navPanel()?.nativeElement.focus();
      }
    });
  }

  protected toggleSidebar(): void {
    if (this.isMobile()) {
      this.mobileOpen.update((open) => !open);
    } else {
      this.setDesktopCollapsed(!this.desktopCollapsed());
    }
  }

  protected closeMobileMenu(returnFocusToToggle: boolean): void {
    this.mobileOpen.set(false);
    if (returnFocusToToggle && this.isBrowser) {
      this.toggleButtonEl()?.nativeElement.focus();
    }
  }

  protected onEscapeKeydown(): void {
    if (this.mobileOpen()) {
      this.closeMobileMenu(true);
    }
  }

  private updateViewport(): void {
    const nextIsMobile = window.innerWidth < MOBILE_BREAKPOINT_PX;
    this.isMobile.set(nextIsMobile);
    if (!nextIsMobile) {
      this.mobileOpen.set(false);
    }
  }

  private setDesktopCollapsed(collapsed: boolean): void {
    this.desktopCollapsed.set(collapsed);
    this.storage.set(SIDEBAR_COLLAPSED_STORAGE_KEY, String(collapsed));
  }

  private readStoredCollapsed(): boolean {
    return this.storage.get(SIDEBAR_COLLAPSED_STORAGE_KEY) === 'true';
  }

  protected logout(): void {
    // Révocation best-effort : la session locale est vidée quoi qu'il arrive.
    this.auth.logout().subscribe({
      next: () => void this.router.navigateByUrl('/'),
      error: () => {
        this.auth.clearSession();
        void this.router.navigateByUrl('/');
      },
    });
  }
}

// The block below is the Syncfusion "dock sidebar" sample that had temporarily replaced the
// real layout above. It relies on an `@Inject('sourceFiles')` token that no provider in this
// app supplies (it only exists in Syncfusion's own sample browser), so instantiating it throws
// a NullInjectorError — kept here, disabled, for reference rather than deleted outright.

// import { Component, ViewEncapsulation, Inject, ViewChild } from '@angular/core';
// import { ListViewModule } from '@syncfusion/ej2-angular-lists';
// import {
//   SidebarComponent,
//   ClickEventArgs,
//   ToolbarModule,
//   SidebarModule,
// } from '@syncfusion/ej2-angular-navigations';

// @Component({
//   selector: 'app-dashboard-layout',
//   templateUrl: './dashboard-layout.html',
//   styleUrls: ['./dashboard-layout.scss'],
//   encapsulation: ViewEncapsulation.None,
//   standalone: true,
//   imports: [ToolbarModule, SidebarModule, ListViewModule],
// })
// export class DashboardLayout {
//   // keep the sample's ViewChild reference; fixed to use Angular's @ViewChild
//   @ViewChild('dockBar')
//   public dockBar?: SidebarComponent;

//   public enableDock: boolean = true;
//   public showIcon: boolean = true;
//   public ListData: { [key: string]: Object }[] = [
//     {
//       id: '1',
//       text: 'Grid',
//       iconcss: 'sb-icons icon-grid e-sb-icon control-icon',
//       description:
//         'The Angular DataGrid is a feature-rich component useful for' +
//         ' displaying data in a tabular format. Its wide range of functionalities' +
//         ' includes data binding, editing, Excel-like filtering, custom sorting,' +
//         ' aggregating rows, selection, and support for Excel, CSV, and PDF formats.' +
//         ' It loads millions of records in just a second. It has flexible editing and intuitive record selection modes.' +
//         ' Also, it has seamless data exporting options like PDF, CSV, and Excel.',
//     },
//     {
//       id: '2',
//       text: 'Chart',
//       iconcss: 'sb-icons icon-chart e-sb-icon control-icon',
//       description:
//         'The Angular Charts is a well-crafted charting component to visualize data.' +
//         ' It contains a rich UI gallery of 30+ charts and graphs, ranging from line to financial' +
//         ' that cater to all charting scenarios. Its high performance helps to render large amounts of data quickly.' +
//         ' It also comes with features such as zooming, panning, tooltip, crosshair, trackball, highlight, and selection.',
//     },
//     {
//       id: '3',
//       text: 'Datepicker',
//       iconcss: 'sb-icons icon-datepicker e-sb-icon control-icon',
//       description:
//         'The Angular DatePicker is a lightweight and mobile-friendly component that allows' +
//         ' end-users to enter or select a date value. It has month, year, and decade view options to quickly' +
//         ' navigate to the desired date. It supports minimum dates, maximum dates, and disabled dates to restrict the date selection.' +
//         ' It has built-in features such as validation, custom date formats, range restriction, and disable dates to enhance the progressive usage.',
//     },
//     {
//       id: '4',
//       text: 'Dialog',
//       iconcss: 'sb-icons icon-dialog e-sb-icon control-icon',
//       description:
//         'The Angular Dialog is a useful user interface (UI) component for informing users' +
//         ' about critical information, errors, warnings, and questions, as well as confirming decisions and collecting' +
//         ' input from users. The component has a rich set of built-in features such as action buttons, positioning, animations,' +
//         ' dragging, resizing, templating, and more with mobile dialog support. The Angular dialog provides two different types:' +
//         ' modal dialogs and non-modal dialogs (modeless) based on interactions.',
//     },
//     {
//       id: '5',
//       text: 'Dropdown List',
//       iconcss: 'sb-icons icon-dropdownlist e-sb-icon control-icon',
//       description:
//         'The Angular Dropdown List is a quick replacement of the HTML select tags.' +
//         ' It has a rich appearance and allows users to select a single value that is non-editable' +
//         ' from a list of predefined values. It has several out-of-the-box features, such as data binding,' +
//         ' filtering, grouping, UI customization, accessibility, and preselected values.',
//     },
//   ];
//   public listFields: { [key: string]: Object } = { id: 'id', text: 'text', iconCss: 'iconcss' };
//   public selectedIndex = 0;
//   // only for sample browser use
//   constructor(@Inject('sourceFiles') private sourceFiles: any) {
//     sourceFiles.files = ['dock-style.css'];
//   }
//   toolbarCliked(args: ClickEventArgs) {
//     if (args.item && args.item.tooltipText == 'Menu') {
//       this.dockBar?.toggle();
//     }
//   }
//   onSelect(args: any) {
//     this.selectedIndex = args.index;
//   }
// }
