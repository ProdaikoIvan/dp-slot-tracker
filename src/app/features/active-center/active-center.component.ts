import { Component, inject } from '@angular/core';
import { ActiveTabService } from '../../core/services/active-tab.service';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-active-center',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './active-center.component.html',
  styleUrl: './active-center.component.scss',
})
export class ActiveCenterCardComponent {
  private readonly tabService = inject(ActiveTabService);

  readonly center = this.tabService.detectedCenter;

  openQueue(): void {
    const center = this.center();
    if (center?.queueUrl) {
      this.tabService.openTargetSite(center.queueUrl);
    }
  }
}
