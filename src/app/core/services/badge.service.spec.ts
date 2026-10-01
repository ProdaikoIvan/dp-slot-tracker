import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { BadgeService } from './badge.service';

describe('BadgeService', () => {
  let service: BadgeService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [BadgeService],
    });
    service = TestBed.inject(BadgeService);
  });

  it('should format seconds into unified badge string (e.g. 2s, 1:00, 2:05)', () => {
    expect(service.formatTime(2)).toBe('2s');
    expect(service.formatTime(59)).toBe('59s');
    expect(service.formatTime(60)).toBe('1:00');
    expect(service.formatTime(125)).toBe('2:05');
  });

  it('should safely execute clear, setTimer, and setFound without throwing', () => {
    expect(() => service.clear()).not.toThrow();
    expect(() => service.setTimer(45)).not.toThrow();
    expect(() => service.setFound()).not.toThrow();
  });
});
