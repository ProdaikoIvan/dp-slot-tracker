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
});
