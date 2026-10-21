import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { ElementDetails } from '@client';
import {
  RESIZE_HANDLES,
  ResizeHandle,
  SlideRect,
  elementRect,
  moveRect,
  resizeRect,
} from '@core/utilities/models/slide-geometry';

/** Actions de la barre de l'élément sélectionné. */
export type ElementAction = 'front' | 'back' | 'lock' | 'hide' | 'remove';

/** Pas du clavier, en unités logiques : flèches seules, et avec Maj pour un réglage fin. */
const KEY_STEP = 10;
const FINE_KEY_STEP = 1;
/** En deçà (px d'écran), un appui suivi d'un relâchement reste un simple clic. */
const DRAG_THRESHOLD_PX = 3;

const ARROWS: Record<string, readonly [number, number]> = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
};

interface Gesture {
  pointerId: number;
  handle: ResizeHandle | null;
  startX: number;
  startY: number;
  startRect: SlideRect;
  moved: boolean;
}

/**
 * Cadre d'un élément dans l'éditeur : sélection, déplacement, redimensionnement, clavier et barre
 * d'actions. Le contenu projeté reste `inert` tant qu'on n'y est pas entré (double-clic ou
 * Entrée) : un clic sélectionne et un glisser déplace, comme dans un logiciel de présentation.
 * La géométrie en cours de geste est locale ; elle n'est émise (`rectCommitted`) qu'à la fin.
 */
@Component({
  selector: 'app-element-frame',
  templateUrl: './element-frame.html',
  styleUrl: './element-frame.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'group',
    '[attr.tabindex]': '0',
    '[attr.aria-label]': 'ariaLabel()',
    'aria-describedby': 'element-frame-help',
    '[class.is-selected]': 'selected()',
    '[class.is-editing]': 'editing()',
    '[class.is-hidden]': 'element().visible === false',
    '[class.is-locked]': 'locked()',
    '[style.left.px]': 'rect().x',
    '[style.top.px]': 'rect().y',
    '[style.width.px]': 'rect().width',
    '[style.height.px]': 'rect().height',
    '[style.zIndex]': 'element().zIndex ?? 0',
    '(pointerdown)': 'onPointerDown($event)',
    '(pointermove)': 'onPointerMove($event)',
    '(pointerup)': 'onPointerUp($event)',
    '(pointercancel)': 'cancelGesture()',
    '(dblclick)': 'startEditing()',
    '(keydown)': 'onKeyDown($event)',
    '(keyup)': 'onKeyUp($event)',
  },
})
export class ElementFrame {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  readonly element = input.required<ElementDetails>();
  readonly label = input.required<string>();
  readonly selected = input(false);
  /** Pixels d'écran par unité logique, pour convertir les déplacements du pointeur. */
  readonly scale = input(1);

  readonly selectRequested = output<void>();
  readonly deselectRequested = output<void>();
  readonly rectCommitted = output<SlideRect>();
  readonly action = output<ElementAction>();

  protected readonly handles = RESIZE_HANDLES;
  protected readonly editing = signal(false);
  private readonly draft = signal<SlideRect | null>(null);
  private gesture: Gesture | null = null;

  protected readonly locked = computed(() => this.element().locked === true);
  protected readonly rect = computed(() => this.draft() ?? elementRect(this.element()));
  protected readonly ariaLabel = computed(() => {
    const states = [
      this.locked() ? 'verrouillé' : null,
      this.element().visible === false ? 'masqué' : null,
    ].filter(Boolean);
    return states.length ? `${this.label()} (${states.join(', ')})` : this.label();
  });

  constructor() {
    effect(() => {
      if (!this.selected() || this.locked()) {
        this.editing.set(false);
      }
    });
  }

  protected onPointerDown(event: PointerEvent): void {
    if (event.button !== 0 || this.editing()) {
      return;
    }
    event.preventDefault();
    this.host.nativeElement.focus();
    this.selectRequested.emit();
    const handle = (event.target as HTMLElement).closest<HTMLElement>('[data-handle]')?.dataset[
      'handle'
    ] as ResizeHandle | undefined;
    if (!this.locked()) {
      this.startGesture(event, handle ?? null);
    }
  }

  protected onPointerMove(event: PointerEvent): void {
    const gesture = this.gesture;
    if (!gesture || event.pointerId !== gesture.pointerId) {
      return;
    }
    const screenDx = event.clientX - gesture.startX;
    const screenDy = event.clientY - gesture.startY;
    if (!gesture.moved && Math.hypot(screenDx, screenDy) < DRAG_THRESHOLD_PX) {
      return;
    }
    gesture.moved = true;
    const dx = screenDx / this.scale();
    const dy = screenDy / this.scale();
    this.draft.set(
      gesture.handle
        ? resizeRect(gesture.startRect, gesture.handle, dx, dy)
        : moveRect(gesture.startRect, dx, dy),
    );
  }

  protected onPointerUp(event: PointerEvent): void {
    if (!this.gesture || event.pointerId !== this.gesture.pointerId) {
      return;
    }
    this.gesture = null;
    this.commitDraft();
  }

  protected cancelGesture(): void {
    this.gesture = null;
    this.draft.set(null);
  }

  protected startEditing(): void {
    if (this.locked() || this.editing()) {
      return;
    }
    this.selectRequested.emit();
    this.editing.set(true);
    // Le contenu n'est plus `inert` qu'après le rendu : on y place alors le focus.
    afterNextRender(
      () =>
        this.host.nativeElement
          .querySelector<HTMLElement>(
            '.frame-content [contenteditable="true"], .frame-content input, .frame-content button',
          )
          ?.focus(),
      { injector: this.injector },
    );
  }

  protected onKeyDown(event: KeyboardEvent): void {
    if (this.editing()) {
      if (event.key === 'Escape') {
        event.stopPropagation();
        this.editing.set(false);
        this.host.nativeElement.focus();
      }
      return;
    }
    if (event.target !== this.host.nativeElement) {
      return;
    }

    if (event.key === 'Escape') {
      event.stopPropagation();
      this.deselectRequested.emit();
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      this.startEditing();
      return;
    }
    if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();
      this.action.emit('remove');
      return;
    }

    const arrow = ARROWS[event.key];
    if (!arrow || this.locked()) {
      return;
    }
    event.preventDefault();
    this.selectRequested.emit();
    const step = event.shiftKey ? FINE_KEY_STEP : KEY_STEP;
    const [dx, dy] = [arrow[0] * step, arrow[1] * step];
    const current = this.rect();
    // Alt + flèches : redimensionne depuis le coin bas-droit, l'alternative clavier aux poignées.
    this.draft.set(event.altKey ? resizeRect(current, 'se', dx, dy) : moveRect(current, dx, dy));
  }

  protected onKeyUp(event: KeyboardEvent): void {
    if (event.key in ARROWS && !this.editing()) {
      this.commitDraft();
    }
  }

  protected onAction(event: Event, action: ElementAction): void {
    event.stopPropagation();
    this.action.emit(action);
  }

  private startGesture(event: PointerEvent, handle: ResizeHandle | null): void {
    this.host.nativeElement.setPointerCapture?.(event.pointerId);
    this.gesture = {
      pointerId: event.pointerId,
      handle,
      startX: event.clientX,
      startY: event.clientY,
      startRect: this.rect(),
      moved: false,
    };
  }

  /** Émet la géométrie du geste terminé ; le parent l'applique au Store avant la réponse. */
  private commitDraft(): void {
    const draft = this.draft();
    this.draft.set(null);
    const current = elementRect(this.element());
    if (
      draft &&
      (draft.x !== current.x ||
        draft.y !== current.y ||
        draft.width !== current.width ||
        draft.height !== current.height)
    ) {
      this.rectCommitted.emit(draft);
    }
  }
}
