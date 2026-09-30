import { Component, computed, inject, input } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ICON_REGISTRY, IconName } from '../../icons';

@Component({
  selector: 'app-icon',
  standalone: true,
  template: `
    <svg
      [attr.width]="size()"
      [attr.height]="size()"
      viewBox="0 0 24 24"
      [attr.fill]="iconDef().fill ?? 'none'"
      [attr.stroke]="iconDef().stroke ?? 'currentColor'"
      [attr.stroke-width]="iconDef().strokeWidth ?? 2"
      stroke-linecap="round"
      stroke-linejoin="round"
      [innerHTML]="safeContent()"
    ></svg>
  `,
  styles: [
    `
      :host {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        line-height: 0;
      }
    `,
  ],
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
