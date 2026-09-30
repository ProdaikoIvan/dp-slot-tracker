import { Component, computed, inject } from '@angular/core';
import { ActiveTabService } from '../../core/services/active-tab.service';
import { IconComponent } from '../../shared/components/icon';
import { SupportedCenter } from '../../core/models/center.model';

@Component({
  selector: 'app-unsupported-center',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './unsupported-center.component.html',
  styleUrl: './unsupported-center.component.scss',
})
export class UnsupportedCenterComponent {
  private readonly tabService = inject(ActiveTabService);

  readonly isSelectionPrompt = computed(
    () => !this.tabService.isOnTargetSite() || this.tabService.isMainPage(),
  );
  readonly centers: readonly SupportedCenter[] = this.tabService.availableCenters;

  openQueue(queueUrl: string): void {
    this.tabService.openTargetSite(queueUrl);
  }
}
