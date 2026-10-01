import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { SoundNotificationService } from './sound-notification.service';
import { STORAGE_KEYS } from '../constants/app.constants';

describe('SoundNotificationService', () => {
  let service: SoundNotificationService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [SoundNotificationService],
    });
    service = TestBed.inject(SoundNotificationService);
  });

  it('should be created and default to enabled', () => {
    expect(service).toBeTruthy();
    expect(service.isEnabled()).toBe(true);
  });

  it('should toggle sound state and save to localStorage', () => {
    const nextState = service.toggle();
    expect(nextState).toBe(false);
    expect(service.isEnabled()).toBe(false);
    expect(localStorage.getItem(STORAGE_KEYS.sound)).toBe('false');

    const toggledBack = service.toggle();
    expect(toggledBack).toBe(true);
    expect(service.isEnabled()).toBe(true);
    expect(localStorage.getItem(STORAGE_KEYS.sound)).toBe('true');
  });

  it('should safely execute playSuccess and playTestBeep without throwing', () => {
    expect(() => service.playSuccess()).not.toThrow();
    expect(() => service.playTestBeep()).not.toThrow();
  });
});
