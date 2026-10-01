import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { SettingsService } from './settings.service';
import { STORAGE_KEYS } from '../constants/app.constants';

describe('SettingsService', () => {
  let service: SettingsService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [SettingsService],
    });
    service = TestBed.inject(SettingsService);
  });

  it('should be created with initial empty settings', () => {
    expect(service).toBeTruthy();
    expect(service.email()).toBe('');
    expect(service.emailNotificationsEnabled()).toBe(false);
  });

  it('should save and persist settings', async () => {
    await service.saveSettings('test@example.com', true);

    expect(service.email()).toBe('test@example.com');
    expect(service.emailNotificationsEnabled()).toBe(true);

    const raw = localStorage.getItem(STORAGE_KEYS.settings);
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!);
    expect(parsed.email).toBe('test@example.com');
    expect(parsed.emailNotificationsEnabled).toBe(true);
  });

  it('should validate email format correctly', () => {
    expect(service.isValidEmail('valid@example.com')).toBe(true);
    expect(service.isValidEmail('user.name+tag@domain.co.uk')).toBe(true);
    expect(service.isValidEmail('invalid-email')).toBe(false);
    expect(service.isValidEmail('no@domain')).toBe(false);
    expect(service.isValidEmail('')).toBe(false);
  });
});
