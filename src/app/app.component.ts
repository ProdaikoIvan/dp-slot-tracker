import { Component, signal } from '@angular/core';
import { APP_CONFIG } from './core/constants/app.constants';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  protected readonly config = APP_CONFIG;
  protected readonly status = signal<'ready' | 'active'>('ready');
}
