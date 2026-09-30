import { Component, inject, signal } from '@angular/core';
import { HeaderComponent } from './shared/components/header/header.component';
import { NotOnSiteComponent } from './features/not-on-site/not-on-site.component';
import { ActiveTabService } from './core/services/active-tab.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [HeaderComponent, NotOnSiteComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  private readonly tabService = inject(ActiveTabService);

  readonly isOnTargetSite = this.tabService.isOnTargetSite;
  readonly isRunning = signal<boolean>(false);

  toggleRunning(): void {
    this.isRunning.update((v) => !v);
  }
}
