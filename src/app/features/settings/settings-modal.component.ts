import { Component, effect, inject, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SettingsService } from '../../core/services/settings.service';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-settings-modal',
  standalone: true,
  imports: [FormsModule, IconComponent],
  templateUrl: './settings-modal.component.html',
  styleUrl: './settings-modal.component.scss',
})
export class SettingsModalComponent {
  private readonly settingsService = inject(SettingsService);

  readonly closeModal = output<void>();

  readonly emailInput = signal<string>('');
  readonly emailNotifEnabled = signal<boolean>(false);
  readonly isSaved = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  constructor() {
    effect(() => {
      this.emailInput.set(this.settingsService.email());
      this.emailNotifEnabled.set(this.settingsService.emailNotificationsEnabled());
    });
  }

  async onSave(): Promise<void> {
    const email = this.emailInput().trim();

    if (this.emailNotifEnabled() && !this.settingsService.isValidEmail(email)) {
      this.errorMessage.set('Введіть коректну email-адресу');
      this.isSaved.set(false);
      return;
    }

    this.errorMessage.set(null);
    await this.settingsService.saveSettings(email, this.emailNotifEnabled());

    this.isSaved.set(true);
    setTimeout(() => {
      this.isSaved.set(false);
      this.closeModal.emit();
    }, 800);
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.closeModal.emit();
    }
  }

  onClose(): void {
    this.closeModal.emit();
  }
}
