import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { FoundSlotsComponent } from './found-slots.component';

describe('FoundSlotsComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FoundSlotsComponent],
    }).compileComponents();
  });

  it('should create found slots component', () => {
    const fixture = TestBed.createComponent(FoundSlotsComponent);
    fixture.componentRef.setInput('days', ['2026-10-15']);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should format location text properly', () => {
    const fixture = TestBed.createComponent(FoundSlotsComponent);
    fixture.componentRef.setInput('days', ['2026-10-15']);
    fixture.componentRef.setInput('centerName', 'Мадрид, Blvr. de José Prat, 35');
    fixture.detectChanges();

    expect(fixture.componentInstance.formattedLocationText()).toBe(
      'Доступна дата(и) за адресою Мадрид, Blvr. de José Prat, 35',
    );
  });

  it('should render chips for all dates', () => {
    const fixture = TestBed.createComponent(FoundSlotsComponent);
    fixture.componentRef.setInput('days', ['2026-10-15', '2026-10-16']);
    fixture.detectChanges();

    const chips = fixture.nativeElement.querySelectorAll('.day-chip');
    expect(chips.length).toBe(2);
    expect(chips[0].textContent).toContain('2026-10-15');
    expect(chips[1].textContent).toContain('2026-10-16');
  });
});
