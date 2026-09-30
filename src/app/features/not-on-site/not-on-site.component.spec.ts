import { TestBed } from '@angular/core/testing';
import { NotOnSiteComponent } from './not-on-site.component';

describe('NotOnSiteComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotOnSiteComponent],
    }).compileComponents();
  });

  it('should create not-on-site component', () => {
    const fixture = TestBed.createComponent(NotOnSiteComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });
});
