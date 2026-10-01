import { Component, output } from '@angular/core';

@Component({
  selector: 'app-tab-closed-modal',
  standalone: true,
  imports: [],
  templateUrl: './tab-closed-modal.component.html',
  styleUrl: './tab-closed-modal.component.scss',
})
export class TabClosedModalComponent {
  readonly closeModal = output<void>();

  onClose(): void {
    this.closeModal.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.closeModal.emit();
    }
  }
}
