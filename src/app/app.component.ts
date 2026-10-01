import { Component, computed, inject, signal } from '@angular/core';
import { HeaderComponent } from './shared/components/header/header.component';
import { ActiveCenterCardComponent } from './features/active-center/active-center.component';
import { UnsupportedCenterComponent } from './features/unsupported-center/unsupported-center.component';
import { SettingsModalComponent } from './features/settings/settings-modal.component';
import { TabClosedModalComponent } from './shared/components/tab-closed-modal/tab-closed-modal.component';
import { ActiveTabService } from './core/services/active-tab.service';
import { SlotTrackerService } from './core/services/slot-tracker.service';
import { SoundNotificationService } from './core/services/sound-notification.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    HeaderComponent,
    ActiveCenterCardComponent,
    UnsupportedCenterComponent,
    SettingsModalComponent,
    TabClosedModalComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  private readonly tabService = inject(ActiveTabService);
  private readonly trackerService = inject(SlotTrackerService);
  private readonly soundService = inject(SoundNotificationService);

  readonly isCenterSupported = this.tabService.isCenterSupported;
  readonly isRunning = this.trackerService.isRunning;
  readonly isSoundEnabled = this.soundService.isEnabled;
  readonly isSettingsOpen = signal<boolean>(false);
  readonly showTabClosedModal = this.trackerService.showTabClosedModal;

  readonly shouldShowTracker = computed(() => {
    return (
      this.trackerService.status() === 'found' ||
      this.trackerService.isRunning() ||
      this.isCenterSupported()
    );
  });

  toggleSound(): void {
    this.soundService.toggle();
  }

  toggleSettings(): void {
    this.isSettingsOpen.update((v) => !v);
  }

  dismissTabClosedModal(): void {
    this.trackerService.dismissTabClosedModal();
  }

  resetTracker(): void {
    this.trackerService.reset();
  }
}
