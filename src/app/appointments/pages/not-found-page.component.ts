import {
  ChangeDetectionStrategy,
  Component,
} from '@angular/core';

@Component({
  selector: 'app-not-found-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section aria-labelledby="not-found-title">
      <p>404</p>

      <h1 id="not-found-title">
        Página no encontrada
      </h1>

      <p>
        No encontramos la página que buscas.
      </p>

      <button
        type="button"
        data-action="back"
        (click)="goBack()"
      >
        Volver
      </button>
    </section>
  `,
})
export class NotFoundPageComponent {
  goBack(): void {
    history.back();
  }
}