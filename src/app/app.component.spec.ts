import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { AppComponent } from './app.component';
import { SlotTrackerService } from './core/services/slot-tracker.service';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should call trackerService.reset on resetTracker()', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    const trackerService = TestBed.inject(SlotTrackerService);
    const resetSpy = vi.spyOn(trackerService, 'reset');

    app.resetTracker();

    expect(resetSpy).toHaveBeenCalled();
  });
});
