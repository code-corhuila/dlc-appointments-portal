import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { SHELL_CONTEXT } from '../../shell-contract';
import { AppointmentsApiService } from '../data/appointments-api.service';
import { ApiError } from '../model/api-error';
import { toApiError } from '../model/to-api-error';
import { AppointmentType, WaitingListEntry } from '../model/waiting-list';
import { ApiErrorAlertComponent } from './api-error-alert.component';

/**
 * Calendar side panel with Appointments data only: the appointment-type legend (HU-APT-006, every staff role) and
 * the waiting list (HU-APT-005, Administrator and Secretary/Assistant).
 */
@Component({
  selector: 'app-calendar-side-panel',
  imports: [ApiErrorAlertComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host { display: grid; gap: 16px; align-content: start; }
    section { border: 1px solid var(--border, #dbe3ea); border-radius: 8px; padding: 14px; background: var(--surface, #fff); }
    h2 { margin: 0 0 10px; font-size: 14px; display: flex; justify-content: space-between; gap: 8px; }
    ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
    li { display: flex; align-items: center; gap: 8px; font-size: 12px; }
    [data-type-swatch] { width: 12px; height: 12px; border-radius: 3px; flex: none; }
    [data-waiting-entry] { flex-direction: column; align-items: stretch; gap: 4px; padding: 8px; border-radius: 6px; background: var(--surface-muted, #f5f7f9); }
    [data-waiting-entry] small { color: var(--text-secondary, #5b6b79); }
    [data-waiting-entry] button { align-self: flex-start; font-size: 11px; }
    [data-waiting-count] { min-width: 22px; text-align: center; border-radius: 999px; background: var(--accent-soft, #e6f4f1); }
  `,
  template: `
    @if (types().length) {
      <section data-type-legend aria-labelledby="legend-title">
        <h2 id="legend-title">Tipos de cita</h2>
        <ul>
          @for (type of types(); track type.code) {
            <li><span data-type-swatch [style.background-color]="type.color" aria-hidden="true"></span>{{ type.label }}</li>
          }
        </ul>
      </section>
    }
    @if (isStaff) {
      <section data-waiting-list aria-labelledby="waiting-title">
        <h2 id="waiting-title">Lista de espera <span data-waiting-count>{{ entries().length }}</span></h2>
        @if (error(); as failure) { <app-api-error-alert [error]="failure" /> }
        @if (!entries().length) {
          <p>No hay pacientes en espera.</p>
        } @else {
          <ul>
            @for (entry of entries(); track entry.id) {
              <li [attr.data-waiting-entry]="entry.id">
                <strong>{{ entry.reason }}</strong>
                <small>Paciente {{ entry.patientId.slice(0, 8) }} · desde {{ entry.createdAt.slice(0, 10) }}</small>
                @if (entry.preferredFrom || entry.preferredTo) {
                  <small>Preferencia: {{ entry.preferredFrom ?? '…' }} a {{ entry.preferredTo ?? '…' }}</small>
                }
                <button type="button" [attr.data-waiting-withdraw]="entry.id" [disabled]="busy() === entry.id"
                  (click)="withdraw(entry)">Retirar de la lista</button>
              </li>
            }
          </ul>
        }
      </section>
    }
  `,
})
export class CalendarSidePanelComponent {
  private readonly api = inject(AppointmentsApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly roles = inject(SHELL_CONTEXT, { optional: true })?.session.getSnapshot().user?.roles ?? [];

  readonly isStaff = this.roles.some((role) => role === 'ADMINISTRATOR' || role === 'SECRETARY_ASSISTANT');
  readonly types = signal<readonly AppointmentType[]>([]);
  readonly entries = signal<readonly WaitingListEntry[]>([]);
  readonly error = signal<ApiError | null>(null);
  readonly busy = signal<string | null>(null);

  constructor() {
    this.api.listAppointmentTypes().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (catalog) => this.types.set(catalog.data),
      error: () => this.types.set([]),
    });
    if (this.isStaff) this.loadWaitingList();
  }

  withdraw(entry: WaitingListEntry): void {
    this.busy.set(entry.id);
    this.api
      .resolveWaitingListEntry(entry.id, { outcome: 'WITHDRAWN', expectedVersion: entry.version }, crypto.randomUUID())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.busy.set(null);
          this.entries.update((all) => all.filter((item) => item.id !== entry.id));
        },
        error: (failure: unknown) => {
          this.busy.set(null);
          this.error.set(toApiError(failure));
        },
      });
  }

  private loadWaitingList(): void {
    this.api.listWaitingList().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (page) => {
        this.error.set(null);
        this.entries.set(page.data);
      },
      error: (failure: unknown) => this.error.set(toApiError(failure)),
    });
  }
}
