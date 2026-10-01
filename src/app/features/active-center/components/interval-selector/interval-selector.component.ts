import { Component, input, output } from '@angular/core';
import {
  TRACKER_INTERVAL_OPTIONS,
  TrackerIntervalOption,
} from '../../../../core/models/tracker.model';

@Component({
  selector: 'app-interval-selector',
  standalone: true,
  templateUrl: './interval-selector.component.html',
  styleUrl: './interval-selector.component.scss',
})
export class IntervalSelectorComponent {
  readonly currentInterval = input.required<number>();
  readonly intervalChange = output<number>();

  readonly options: readonly TrackerIntervalOption[] = TRACKER_INTERVAL_OPTIONS;

  selectInterval(seconds: number): void {
    this.intervalChange.emit(seconds);
  }
}
