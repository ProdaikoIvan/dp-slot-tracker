import { TestBed } from '@angular/core/testing';
import { UnsupportedCenterComponent } from './unsupported-center.component';
import { ActiveTabService } from '../../core/services/active-tab.service';

describe('UnsupportedCenterComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UnsupportedCenterComponent],
      providers: [ActiveTabService],
    }).compileComponents();
  });

  it('should create unsupported-center component', () => {
    const fixture = TestBed.createComponent(UnsupportedCenterComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should show selection prompt when not on target site', () => {
    const tabService = TestBed.inject(ActiveTabService);
    tabService.isOnTargetSite.set(false);
    tabService.isMainPage.set(false);

    const fixture = TestBed.createComponent(UnsupportedCenterComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance.isSelectionPrompt()).toBe(true);
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.alert-title')?.textContent).toContain('Доступні відділення');
  });

  it('should show unsupported warning when on unsupported center subdomain', () => {
    const tabService = TestBed.inject(ActiveTabService);
    tabService.isOnTargetSite.set(true);
    tabService.isMainPage.set(false);

    const fixture = TestBed.createComponent(UnsupportedCenterComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance.isSelectionPrompt()).toBe(false);
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.alert-title')?.textContent).toContain(
      'Оберіть підтримуване місто',
    );
  });
});
