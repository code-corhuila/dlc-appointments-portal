import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { AppointmentStatus } from '../model/appointment';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      class="status-badge"
      [attr.data-status]="status()"
    >
      {{ label }}
    </span>
  `,
})
export class StatusBadgeComponent {
  readonly status = input.required<AppointmentStatus>();

  get label(): string {
    switch (this.status()) {
      case 'PROGRAMADA':
        return 'Programada';
      case 'CONFIRMADA':
        return 'Confirmada';
      case 'EN_ATENCION':
        return 'En atención';
      case 'FINALIZADA':
        return 'Finalizada';
      case 'CANCELADA':
        return 'Cancelada';
      case 'NO_ASISTIO':
        return 'No asistió';
    }
  }
}