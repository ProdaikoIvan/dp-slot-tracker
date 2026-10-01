import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { ActiveCenterCardComponent } from './active-center.component';
import { ActiveTabService } from '../../core/services/active-tab.service';
import { SlotTrackerService } from '../../core/services/slot-tracker.service';

describe('ActiveCenterCardComponent', () => {
  let mockTracker: { toggle: ReturnType<typeof vi.fn>; isRunning: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    mockTracker = {
      toggle: vi.fn(),
      isRunning: vi.fn().mockReturnValue(false),
    };

    await TestBed.configureTestingModule({
      imports: [ActiveCenterCardComponent],
      providers: [
        ActiveTabService,
        { provide: SlotTrackerService, useValue: mockTracker },
      ],
    }).compileComponents();
  });

  it('should create active-center component', () => {
    const fixture = TestBed.createComponent(ActiveCenterCardComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should toggle tracker when onToggleTracker is called', () => {
    const fixture = TestBed.createComponent(ActiveCenterCardComponent);
    const component = fixture.componentInstance;
    component.onToggleTracker();
    expect(mockTracker.toggle).toHaveBeenCalledTimes(1);
  });
});
