import { Component, inject, signal } from '@angular/core';
import { HeaderComponent } from './shared/components/header/header.component';
import { NotOnSiteComponent } from './features/not-on-site/not-on-site.component';
import { ActiveCenterCardComponent } from './features/active-center/active-center.component';
import { UnsupportedCenterComponent } from './features/unsupported-center/unsupported-center.component';
import { ActiveTabService } from './core/services/active-tab.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    HeaderComponent,
    NotOnSiteComponent,
    ActiveCenterCardComponent,
    UnsupportedCenterComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  private readonly tabService = inject(ActiveTabService);

  readonly isOnTargetSite = this.tabService.isOnTargetSite;
  readonly isCenterSupported = this.tabService.isCenterSupported;
  readonly isRunning = signal<boolean>(false);

  toggleRunning(): void {
    this.isRunning.update((v) => !v);
  }
}
