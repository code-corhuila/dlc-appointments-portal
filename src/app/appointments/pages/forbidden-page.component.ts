import {
  ChangeDetectionStrategy,
  Component,
} from '@angular/core';

@Component({
  selector: 'app-forbidden-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section aria-labelledby="forbidden-title">
      <p>403</p>

      <h1 id="forbidden-title">
        Acceso denegado
      </h1>

      <p>
        No tienes permisos para acceder a esta sección.
      </p>
    </section>
  `,
})
export class ForbiddenPageComponent {}