import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';
import { TooltipModule } from '@syncfusion/ej2-angular-popups';

@Component({
    selector: 'bp-base-card',
    standalone: true,
    imports: [CommonModule, TooltipModule],
    templateUrl: './base-card.component.html'
})
export class BaseCardComponent {
    // Optional inputs for customization
    readonly headerClass = input<string>('');
    readonly bodyClass = input<string>('');
    readonly footerClass = input<string>('');
    readonly cardClass = input<string>('');
    readonly headerTooltip = input<string>('');
    readonly tooltipPosition = input<'left' | 'right' | 'top' | 'bottom'>('right');

    protected readonly syncfusionTooltipPosition: Record<
        'left' | 'right' | 'top' | 'bottom',
        string
    > = {
        left: 'LeftCenter',
        right: 'RightCenter',
        top: 'TopCenter',
        bottom: 'BottomCenter',
    };
}
