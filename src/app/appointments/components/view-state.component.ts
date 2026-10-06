import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';

export type ViewState = 'loading' | 'error' | 'empty' | 'data';

@Component({
  selector: 'app-view-state',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @switch (state()) {
      @case ('loading') {
        <div
          data-view-state="loading"
          aria-busy="true"
          aria-live="polite"
        >
          <p>Cargando...</p>
        </div>
      }

      @case ('error') {
        <div
          data-view-state="error"
          role="alert"
        >
          <p>{{ errorMessage() }}</p>

          <button
            type="button"
            data-action="retry"
            (click)="retry.emit()"
          >
            Reintentar
          </button>
        </div>
      }

      @case ('empty') {
        <div data-view-state="empty">
          <p>{{ emptyMessage() }}</p>
        </div>
      }

      @case ('data') {
        <div data-view-state="data">
          <ng-content />
        </div>
      }
    }
  `,
})
export class ViewStateComponent {
  readonly state = input.required<ViewState>();

  readonly errorMessage = input(
    'No fue posible cargar la información.',
  );

  readonly emptyMessage = input(
    'No hay información disponible.',
  );

  readonly retry = output<void>();
}