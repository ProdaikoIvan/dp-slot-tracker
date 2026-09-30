import { Component, computed, inject, input } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ICON_REGISTRY, IconName } from './index';

@Component({
  selector: 'app-icon',
  standalone: true,
  templateUrl: './icon.component.html',
  styleUrl: './icon.component.scss',
})
export class IconComponent {
  private readonly sanitizer = inject(DomSanitizer);

  readonly name = input.required<IconName>();
  readonly size = input<number>(20);

  protected readonly iconDef = computed(() => {
    return ICON_REGISTRY[this.name()] ?? ICON_REGISTRY.document;
  });

  protected readonly safeContent = computed<SafeHtml>(() => {
    return this.sanitizer.bypassSecurityTrustHtml(this.iconDef().content);
  });
}
