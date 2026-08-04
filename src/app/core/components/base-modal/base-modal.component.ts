import { Component, input, model } from '@angular/core';
import { ButtonModule } from '@syncfusion/ej2-angular-buttons';
import { DialogModule } from '@syncfusion/ej2-angular-popups';

@Component({
    selector: 'bp-base-modal',
    imports: [DialogModule, ButtonModule],

    templateUrl: './base-modal.component.html',
    styleUrl: './base-modal.component.scss'
})
export class BaseModalComponent {
    visible = model(false);
    title = input<string>('Titre');
    iconClass = model<string>('pi pi-info-circle');

    onHide = () => {
        this.visible.set(false);
    };
}
