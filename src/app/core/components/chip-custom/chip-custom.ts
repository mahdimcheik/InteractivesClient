import { Component, input } from '@angular/core';

export interface ChipData {
    name?: string | null;
    color?: string | null;
    icon?: string | null;
}

@Component({
    selector: 'bp-chip-custom',
    templateUrl: './chip-custom.html',
    styleUrl: './chip-custom.scss',
})
export class ChipCustom {
    data = input<ChipData | null>(null);
}
