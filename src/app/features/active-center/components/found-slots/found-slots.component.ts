import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-found-slots',
  standalone: true,
  templateUrl: './found-slots.component.html',
  styleUrl: './found-slots.component.scss',
})
export class FoundSlotsComponent {
  readonly days = input.required<string[]>();
  readonly centerName = input<string | null>(null);

  readonly formattedLocationText = computed<string>(() => {
    const raw = this.centerName();
    if (!raw) return 'Доступна дата(и) для запису';

    if (/^електронна черга/i.test(raw)) {
      return raw.replace(/^електронна черга/i, 'Доступна дата(и)').trim();
    }

    return `Доступна дата(и) за адресою ${raw}`;
  });
}
