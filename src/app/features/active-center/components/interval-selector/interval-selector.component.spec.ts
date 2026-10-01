import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { IntervalSelectorComponent } from './interval-selector.component';

describe('IntervalSelectorComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IntervalSelectorComponent],
    }).compileComponents();
  });

  it('should create interval selector component', () => {
    const fixture = TestBed.createComponent(IntervalSelectorComponent);
    fixture.componentRef.setInput('currentInterval', 60);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render all interval options and mark active', () => {
    const fixture = TestBed.createComponent(IntervalSelectorComponent);
    fixture.componentRef.setInput('currentInterval', 120);
    fixture.detectChanges();

    const buttons = fixture.nativeElement.querySelectorAll('.chip-btn');
    expect(buttons.length).toBe(5);
    expect(buttons[2].classList.contains('chip-active')).toBe(true);
  });

  it('should emit intervalChange on click', () => {
    const fixture = TestBed.createComponent(IntervalSelectorComponent);
    fixture.componentRef.setInput('currentInterval', 60);
    fixture.detectChanges();

    let emitted = 0;
    fixture.componentInstance.intervalChange.subscribe((sec) => {
      emitted = sec;
    });

    const buttons = fixture.nativeElement.querySelectorAll('.chip-btn');
    buttons[3].click();
    expect(emitted).toBe(180);
  });
});
