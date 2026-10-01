import { Component, computed, inject } from '@angular/core';
import { ActiveTabService } from '../../core/services/active-tab.service';
import { SlotTrackerService } from '../../core/services/slot-tracker.service';
import { SUPPORTED_CENTERS } from '../../core/constants/centers.constants';
import { SupportedCenter } from '../../core/models/center.model';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { IntervalSelectorComponent } from './components/interval-selector/interval-selector.component';
import { FoundSlotsComponent } from './components/found-slots/found-slots.component';

@Component({
  selector: 'app-active-center',
  standalone: true,
  imports: [IconComponent, IntervalSelectorComponent, FoundSlotsComponent],
  templateUrl: './active-center.component.html',
  styleUrl: './active-center.component.scss',
})
export class ActiveCenterCardComponent {
  private readonly tabService = inject(ActiveTabService);
  private readonly trackerService = inject(SlotTrackerService);

  // --- Center info ---
  readonly isOnQueueTab = this.tabService.isCenterSupported;
  readonly targetTabId = this.trackerService.targetTabId;

  readonly center = computed<SupportedCenter>(() => {
    const direct = this.tabService.detectedCenter();
    if (direct) return direct;

    const name = this.trackerService.centerName();
    if (name) {
      const match = SUPPORTED_CENTERS.find(
        (c) =>
          name.toLowerCase().includes(c.name.toLowerCase()) ||
          name.toLowerCase().includes(c.subdomain),
      );
      if (match) return match;
    }

    return {
      id: 'tracked',
      subdomain: '',
      name: this.trackerService.centerName() || 'Електронна черга',
      country: 'ДП Документ',
      countryCode: 'UA',
      flag: '🇺🇦',
      address: 'Вкладка черги активна у фоні',
      queueUrl: 'https://pasport.org.ua/solutions/e-queue',
    };
  });

  // --- Tracker state (previously proxied through TrackerPanelComponent) ---
  readonly isRunning = this.trackerService.isRunning;
  readonly status = this.trackerService.status;
  readonly currentInterval = this.trackerService.intervalSeconds;
  readonly remainingSeconds = this.trackerService.remainingSeconds;
  readonly foundDays = this.trackerService.foundDays;
  readonly lastMessage = this.trackerService.lastMessage;
  readonly centerName = this.trackerService.centerName;

  // --- Actions ---
  onToggleTracker(): void {
    this.trackerService.toggle();
  }

  setInterval(seconds: number): void {
    this.trackerService.setIntervalSeconds(seconds);
  }

  focusQueueTab(): void {
    const tabId = this.targetTabId();
    if (tabId && typeof chrome !== 'undefined' && chrome.tabs?.update) {
      chrome.tabs.update(tabId, { active: true });
    }
  }
}
