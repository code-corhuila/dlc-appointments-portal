import {
  ChangeDetectionStrategy,
  Component,
  input,
} from '@angular/core';

import { ApiError } from '../model/api-error';

@Component({
  selector: 'app-api-error-alert',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      role="alert"
      aria-live="assertive"
    >
      <p>{{ error().message }}</p>

      <small data-trace-id>
        Referencia de soporte: {{ error().traceId }}
      </small>
    </div>
  `,
})
export class ApiErrorAlertComponent {
  readonly error = input.required<ApiError>();
}