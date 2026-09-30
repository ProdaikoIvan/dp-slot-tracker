import { Component, input, output } from '@angular/core';
import { APP_CONFIG } from '../../../core/constants/app.constants';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  readonly isRunning = input<boolean>(false);
  readonly toggleRun = output<void>();

  protected readonly config = APP_CONFIG;

  onToggle(): void {
    this.toggleRun.emit();
  }
}
