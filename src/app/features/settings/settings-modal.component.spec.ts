import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SettingsModalComponent } from './settings-modal.component';
import { SettingsService } from '../../core/services/settings.service';

describe('SettingsModalComponent', () => {
  let component: SettingsModalComponent;
  let mockSettingsService: {
    email: ReturnType<typeof vi.fn>;
    emailNotificationsEnabled: ReturnType<typeof vi.fn>;
    saveSettings: ReturnType<typeof vi.fn>;
    isValidEmail: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    mockSettingsService = {
      email: vi.fn().mockReturnValue(''),
      emailNotificationsEnabled: vi.fn().mockReturnValue(false),
      saveSettings: vi.fn().mockResolvedValue(undefined),
      isValidEmail: vi.fn().mockReturnValue(true),
    };

    await TestBed.configureTestingModule({
      imports: [SettingsModalComponent],
      providers: [{ provide: SettingsService, useValue: mockSettingsService }],
    }).compileComponents();

    const fixture = TestBed.createComponent(SettingsModalComponent);
    component = fixture.componentInstance;
  });

  it('should create settings modal component', () => {
    expect(component).toBeTruthy();
  });

  it('should emit closeModal when onClose is called', () => {
    let closed = false;
    component.closeModal.subscribe(() => {
      closed = true;
    });
    component.onClose();
    expect(closed).toBe(true);
  });

  it('should save settings when onSave is called with valid data', async () => {
    component.emailInput.set('valid@mail.com');
    component.emailNotifEnabled.set(true);

    await component.onSave();

    expect(mockSettingsService.saveSettings).toHaveBeenCalledWith('valid@mail.com', true);
    expect(component.errorMessage()).toBeNull();
  });
});
