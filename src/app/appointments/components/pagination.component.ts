import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';

@Component({
  selector: 'app-pagination',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav aria-label="Paginación">
      <button
        type="button"
        data-action="previous"
        [disabled]="page() <= 1"
        (click)="goToPrevious()"
      >
        Anterior
      </button>

      <span aria-live="polite">
        Página {{ page() }} de {{ totalPages() }}
      </span>

      <button
        type="button"
        data-action="next"
        [disabled]="page() >= totalPages()"
        (click)="goToNext()"
      >
        Siguiente
      </button>
    </nav>
  `,
})
export class PaginationComponent {
  readonly page = input.required<number>();
  readonly totalPages = input.required<number>();

  readonly pageChange = output<number>();

  goToPrevious(): void {
    if (this.page() > 1) {
      this.pageChange.emit(this.page() - 1);
    }
  }

  goToNext(): void {
    if (this.page() < this.totalPages()) {
      this.pageChange.emit(this.page() + 1);
    }
  }
}