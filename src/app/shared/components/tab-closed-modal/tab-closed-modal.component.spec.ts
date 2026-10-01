import { TestBed } from '@angular/core/testing';
import { TabClosedModalComponent } from './tab-closed-modal.component';

describe('TabClosedModalComponent', () => {
  let component: TabClosedModalComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TabClosedModalComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(TabClosedModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create tab closed modal component', () => {
    expect(component).toBeTruthy();
  });

  it('should emit closeModal when onClose is called', () => {
    let emitted = false;
    component.closeModal.subscribe(() => {
      emitted = true;
    });

    component.onClose();
    expect(emitted).toBe(true);
  });

  it('should emit closeModal when backdrop is clicked', () => {
    let emitted = false;
    component.closeModal.subscribe(() => {
      emitted = true;
    });

    const mockEvent = {
      target: {
        classList: {
          contains: (cls: string) => cls === 'modal-backdrop',
        },
      },
    } as unknown as MouseEvent;

    component.onBackdropClick(mockEvent);
    expect(emitted).toBe(true);
  });
});
