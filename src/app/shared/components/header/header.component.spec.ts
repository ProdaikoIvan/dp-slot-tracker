import { TestBed } from '@angular/core/testing';
import { HeaderComponent } from './header.component';
import { APP_CONFIG } from '../../../core/constants/app.constants';

describe('HeaderComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
    }).compileComponents();
  });

  it('should create header component', () => {
    const fixture = TestBed.createComponent(HeaderComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should render brand name from constants', async () => {
    const fixture = TestBed.createComponent(HeaderComponent);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.brand-name')?.textContent).toContain(APP_CONFIG.name);
  });

  it('should emit toggleSound when onToggleSound is called', () => {
    const fixture = TestBed.createComponent(HeaderComponent);
    const component = fixture.componentInstance;
    let emitted = false;
    component.toggleSound.subscribe(() => {
      emitted = true;
    });
    component.onToggleSound();
    expect(emitted).toBe(true);
  });

  it('should emit openSettings when onOpenSettings is called', () => {
    const fixture = TestBed.createComponent(HeaderComponent);
    const component = fixture.componentInstance;
    let emitted = false;
    component.openSettings.subscribe(() => {
      emitted = true;
    });
    component.onOpenSettings();
    expect(emitted).toBe(true);
  });

  it('should emit reset when onReset is called', () => {
    const fixture = TestBed.createComponent(HeaderComponent);
    const component = fixture.componentInstance;
    let emitted = false;
    component.reset.subscribe(() => {
      emitted = true;
    });
    component.onReset();
    expect(emitted).toBe(true);
  });
});
