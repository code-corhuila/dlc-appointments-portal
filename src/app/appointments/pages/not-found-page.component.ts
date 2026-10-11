import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';

import { CompositionNavigationService } from '../../composition-navigation.service';
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
        {{ returnLabel }}
      </button>
    </section>
  `,
})
export class NotFoundPageComponent {
  private readonly compositionNavigation = inject(
    CompositionNavigationService,
    { optional: true },
  );

  readonly returnLabel = this.compositionNavigation
    ? 'Ir al calendario'
    : 'Volver';

  goBack(): void {
    if (this.compositionNavigation) {
      void this.compositionNavigation.request({ localPath: '/calendar' });
      return;
    }
    history.back();
  }
}
