import { QueueCheckResult } from '../models/queue-check.model';

/**
 * Ця функція виконується безпосередньо в контексті сторінки e-queue у вкладці браузера
 * через chrome.scripting.executeScript.
 */
export async function inPageCheckDays(defaultServiceId: string = '4'): Promise<QueueCheckResult> {
  console.log('[DP Slot Tracker Page] Початок перевірки форми черги...');

  try {
    const form = document.querySelector<HTMLFormElement>('form#services');
    if (!form) {
      console.warn('[DP Slot Tracker Page] Форму #services не знайдено на сторінці.');
      return {
        success: false,
        days: [],
        error: 'Форму черги (#services) не знайдено',
      };
    }

    const xData = form.getAttribute('x-data') || '';
    const csrfMatch = xData.match(/"csrf"\s*:\s*"([^"]+)"/);
    const centerMatch = xData.match(/"center"\s*:\s*"([^"]+)"/);

    if (!csrfMatch || !centerMatch) {
      console.warn('[DP Slot Tracker Page] Токени форми не знайдено в x-data:', xData);
      return {
        success: false,
        days: [],
        error: 'Не знайдено токени форми черги',
      };
    }

    const csrf = csrfMatch[1];
    const center = centerMatch[1];

    const select = document.querySelector<HTMLSelectElement>('select#service');
    const serviceId = select?.value && select.value.trim() !== '' ? select.value : defaultServiceId;
    const selectedOption = select?.selectedOptions?.[0] || (select && select.selectedIndex >= 0 ? select.options[select.selectedIndex] : undefined);
    const serviceName = selectedOption?.text?.trim() || 'Оформлення документів';

    const availableServices = select
      ? Array.from(select.options)
          .filter((opt) => opt.value && opt.value.trim() !== '')
          .map((opt) => ({ id: opt.value, name: opt.text.trim() }))
      : [];

    const pageHeading = document.querySelector('h1')?.textContent?.trim();
    const subdomain = window.location.hostname.split('.')[0] || '';
    const centerName = pageHeading || (subdomain ? subdomain.charAt(0).toUpperCase() + subdomain.slice(1) : undefined);

    console.log('[DP Slot Tracker Page] Параметри запиту:', {
      form: 'days',
      ServiceCenterId: center,
      ServiceId: serviceId,
      csrfToken: csrf,
    });

    const formData = new FormData();
    formData.append('form', 'days');
    formData.append('ServiceCenterId', center);
    formData.append('ServiceId', serviceId);
    formData.append(csrf, '1');

    const response = await fetch(window.location.href, {
      method: 'POST',
      body: formData,
    });

    console.log('[DP Slot Tracker Page] HTTP статус:', response.status);

    if (!response.ok) {
      return {
        success: false,
        days: [],
        centerId: center,
        centerName,
        serviceId,
        serviceName,
        error:
          response.status === 503 || response.status === 429
            ? 'Помилка сервера (можливе тимчасове блокування запитів)'
            : `Помилка сервера (${response.status})`,
      };
    }

    const data = await response.json();
    console.log('[DP Slot Tracker Page] Відповідь сервера:', data);
    const days = Array.isArray(data?.days) ? data.days : [];

    return {
      success: true,
      days,
      centerId: center,
      centerName,
      serviceId,
      serviceName,
      availableServices,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Помилка виконання на сторінці';
    console.error('[DP Slot Tracker Page] Помилка:', message);
    return {
      success: false,
      days: [],
      error: message,
    };
  }
}
