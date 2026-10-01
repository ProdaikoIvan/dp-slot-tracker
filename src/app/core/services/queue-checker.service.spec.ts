import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { QueueCheckerService, inPageCheckDays } from './queue-checker.service';

describe('QueueCheckerService', () => {
  let service: QueueCheckerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(QueueCheckerService);
    document.body.innerHTML = '';
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('inPageCheckDays', () => {
    it('should return error if form is not found', async () => {
      const result = await inPageCheckDays();
      expect(result.success).toBe(false);
      expect(result.error).toContain('Форму черги');
    });

    it('should return error if x-data has no csrf or center', async () => {
      const form = document.createElement('form');
      form.id = 'services';
      form.setAttribute('x-data', '{}');
      document.body.appendChild(form);

      const result = await inPageCheckDays();
      expect(result.success).toBe(false);
      expect(result.error).toContain('Не знайдено токени');
    });

    it('should default to ServiceId 4 if service is not explicitly selected', async () => {
      const form = document.createElement('form');
      form.id = 'services';
      form.setAttribute('x-data', 'qlogickFormHaku({"csrf":"test-csrf-123","center":"41"})');
      document.body.appendChild(form);

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ days: [] }),
      });

      const result = await inPageCheckDays();
      expect(result.success).toBe(true);
      expect(result.serviceId).toBe('4');
      expect(result.centerId).toBe('41');
    });

    it('should send POST request and return days on success', async () => {
      const form = document.createElement('form');
      form.id = 'services';
      form.setAttribute('x-data', 'qlogickFormHaku({"csrf":"test-csrf-123","center":"41"})');

      const select = document.createElement('select');
      select.id = 'service';
      const option = document.createElement('option');
      option.value = '4';
      option.selected = true;
      select.appendChild(option);
      form.appendChild(select);
      document.body.appendChild(form);

      const mockResponse = { days: ['2026-10-15', '2026-10-16'] };
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await inPageCheckDays();
      expect(result.success).toBe(true);
      expect(result.days).toEqual(['2026-10-15', '2026-10-16']);
      expect(result.centerId).toBe('41');
      expect(result.serviceId).toBe('4');
      expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    });

    it('should handle server error response', async () => {
      const form = document.createElement('form');
      form.id = 'services';
      form.setAttribute('x-data', 'qlogickFormHaku({"csrf":"test-csrf-123","center":"6"})');

      const select = document.createElement('select');
      select.id = 'service';
      const option = document.createElement('option');
      option.value = '4';
      option.selected = true;
      select.appendChild(option);
      form.appendChild(select);
      document.body.appendChild(form);

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      });

      const result = await inPageCheckDays();
      expect(result.success).toBe(false);
      expect(result.error).toContain('500');
    });

    it('should return friendly message on 503 server error', async () => {
      const form = document.createElement('form');
      form.id = 'services';
      form.setAttribute('x-data', 'qlogickFormHaku({"csrf":"test-csrf-123","center":"6"})');
      document.body.appendChild(form);

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
      });

      const result = await inPageCheckDays();
      expect(result.success).toBe(false);
      expect(result.error).toBe('Помилка сервера (можливе тимчасове блокування запитів)');
    });
  });
});
