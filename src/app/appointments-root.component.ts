import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Minimal root used only by the composition lifecycle until route rendering is integrated. */
@Component({
  selector: 'apt-root',
  standalone: true,
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppointmentsRootComponent {}
