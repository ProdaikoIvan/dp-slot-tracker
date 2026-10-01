import { Component, inject } from '@angular/core';
import { SlotTrackerService } from '../../../../core/services/slot-tracker.service';
import { FoundSlotsComponent } from '../found-slots/found-slots.component';
import { IntervalSelectorComponent } from '../interval-selector/interval-selector.component';

@Component({
  selector: 'app-tracker-panel',
  standalone: true,
  imports: [FoundSlotsComponent, IntervalSelectorComponent],
  templateUrl: './tracker-panel.component.html',
  styleUrl: './tracker-panel.component.scss',
})
export class TrackerPanelComponent {
  private readonly trackerService = inject(SlotTrackerService);

  readonly currentInterval = this.trackerService.intervalSeconds;
  readonly remainingSeconds = this.trackerService.remainingSeconds;
  readonly isRunning = this.trackerService.isRunning;
  readonly status = this.trackerService.status;
  readonly foundDays = this.trackerService.foundDays;
  readonly lastMessage = this.trackerService.lastMessage;
  readonly centerName = this.trackerService.centerName;

  setInterval(seconds: number): void {
    this.trackerService.setIntervalSeconds(seconds);
  }
}
