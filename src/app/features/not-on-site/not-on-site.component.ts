import { Component, inject } from '@angular/core';
import { ActiveTabService } from '../../core/services/active-tab.service';
import { TARGET_SITE } from '../../core/constants/app.constants';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-not-on-site',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './not-on-site.component.html',
  styleUrl: './not-on-site.component.scss',
})
export class NotOnSiteComponent {
  private readonly tabService = inject(ActiveTabService);
  protected readonly targetSite = TARGET_SITE;

  openSite(): void {
    this.tabService.openTargetSite();
  }
}
