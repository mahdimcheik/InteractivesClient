import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

type PropertiesTab = 'properties' | 'interactions';

@Component({
  selector: 'app-properties-panel',
  templateUrl: './properties-panel.html',
  styleUrl: './properties-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PropertiesPanel {
  protected readonly activeTab = signal<PropertiesTab>('properties');

  protected readonly backgroundSwatches = ['blanc', 'gris', 'sombre', 'degrade'] as const;

  protected setActiveTab(tab: PropertiesTab): void {
    this.activeTab.set(tab);
  }
}
