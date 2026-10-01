import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { TrackerPanelComponent } from './tracker-panel.component';
import { SlotTrackerService } from '../../../../core/services/slot-tracker.service';

describe('TrackerPanelComponent', () => {
  let trackerService: SlotTrackerService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrackerPanelComponent],
      providers: [SlotTrackerService],
    }).compileComponents();

    trackerService = TestBed.inject(SlotTrackerService);
  });

  it('should create tracker panel component', () => {
    const fixture = TestBed.createComponent(TrackerPanelComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render all 4 interval options with first selected by default', () => {
    const fixture = TestBed.createComponent(TrackerPanelComponent);
    fixture.detectChanges();

    const buttons = fixture.nativeElement.querySelectorAll('.chip-btn');
    expect(buttons.length).toBe(4);
    expect(buttons[0].classList.contains('chip-active')).toBe(true);
  });

  it('should update interval when clicking a chip', () => {
    const fixture = TestBed.createComponent(TrackerPanelComponent);
    fixture.detectChanges();

    const buttons = fixture.nativeElement.querySelectorAll('.chip-btn');
    buttons[1].click(); // 2 хв (120s)
    fixture.detectChanges();

    expect(trackerService.intervalSeconds()).toBe(120);
    expect(buttons[1].classList.contains('chip-active')).toBe(true);
  });

  it('should render found days when available', () => {
    trackerService.foundDays.set(['2026-10-15', '2026-10-16']);
    trackerService.status.set('found');

    const fixture = TestBed.createComponent(TrackerPanelComponent);
    fixture.detectChanges();

    const chips = fixture.nativeElement.querySelectorAll('.day-chip');
    expect(chips.length).toBe(2);
    expect(chips[0].textContent).toContain('2026-10-15');
    expect(chips[1].textContent).toContain('2026-10-16');
  });
});
