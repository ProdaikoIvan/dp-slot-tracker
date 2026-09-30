import { TestBed } from '@angular/core/testing';
import { ActiveCenterCardComponent } from './active-center.component';
import { ActiveTabService } from '../../core/services/active-tab.service';

describe('ActiveCenterCardComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActiveCenterCardComponent],
      providers: [ActiveTabService],
    }).compileComponents();
  });

  it('should create active-center component', () => {
    const fixture = TestBed.createComponent(ActiveCenterCardComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });
});
