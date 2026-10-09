
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { AppointmentsApiService } from '../data/appointments-api.service';
import { Appointment } from '../model/appointment';
import { ConfirmationChannel } from '../model/appointment-operations';

@Component({
  selector: 'app-appointment-actions',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section aria-label="Acciones de la cita">
      @if (canManage() && currentAppointment().status === 'PROGRAMADA') {
        <button
          type="button"
          data-appointment-confirm
          [disabled]="isSubmitting()"
          (click)="startConfirmation()"
        >
          Confirmar cita
        </button>

        @if (isChoosingChannel()) {
          <label for="confirmation-channel">
            Canal de confirmación
          </label>

          <select
            id="confirmation-channel"
            data-confirmation-channel
            [value]="selectedChannel()"
            [disabled]="isSubmitting()"
            (change)="onChannelChange($event)"
          >
            <option value="PHONE">Teléfono</option>
            <option value="IN_PERSON">Presencial</option>
            <option value="EMAIL">Correo electrónico</option>
          </select>

          <button
            type="button"
            data-appointment-submit-confirmation
            [disabled]="isSubmitting()"
            (click)="submitConfirmation()"
          >
            Guardar confirmación
          </button>
        }
      }

      @if (feedback()) {
        <p role="status">{{ feedback() }}</p>
      }

      @if (errorMessage()) {
        <p role="alert">{{ errorMessage() }}</p>
      }
    </section>
  `,
})
export class AppointmentActionsComponent {
  private readonly api = inject(AppointmentsApiService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly confirmationFormAppointmentId =
    signal<string | null>(null);

  readonly appointment = input.required<Appointment>();
  readonly canManage = input(false);

  readonly confirmedAppointment = signal<Appointment | null>(null);

  readonly currentAppointment = computed(() => {
    const original = this.appointment();
    const confirmed = this.confirmedAppointment();

    if (
      confirmed !== null &&
      confirmed.id === original.id &&
      confirmed.version > original.version
    ) {
      return confirmed;
    }

    return original;
  });

  readonly isChoosingChannel = computed(
    () =>
      this.confirmationFormAppointmentId() ===
      this.appointment().id,
  );

  readonly isSubmitting = signal(false);
  readonly selectedChannel = signal<ConfirmationChannel>('PHONE');

  readonly feedback = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);

  startConfirmation(): void {
    if (
      !this.canManage() ||
      this.currentAppointment().status !== 'PROGRAMADA' ||
      this.isSubmitting()
    ) {
      return;
    }

    this.confirmationFormAppointmentId.set(
      this.appointment().id,
    );
  }

  onChannelChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;

    if (
      value === 'PHONE' ||
      value === 'IN_PERSON' ||
      value === 'EMAIL'
    ) {
      this.selectedChannel.set(value);
    }
  }

  submitConfirmation(): void {
    const appointment = this.currentAppointment();

    if (
      !this.canManage() ||
      appointment.status !== 'PROGRAMADA' ||
      !this.isChoosingChannel() ||
      this.isSubmitting()
    ) {
      return;
    }

    this.isSubmitting.set(true);
    this.feedback.set(null);
    this.errorMessage.set(null);

    this.api
      .confirmAppointment(
        appointment.id,
        {
          expectedVersion: appointment.version,
          channel: this.selectedChannel(),
        },
        crypto.randomUUID(),
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updatedAppointment: Appointment) => {
          this.confirmedAppointment.set(updatedAppointment);
          this.isSubmitting.set(false);

          if (
            this.confirmationFormAppointmentId() ===
            appointment.id
          ) {
            this.confirmationFormAppointmentId.set(null);
          }

          this.feedback.set(
            'Confirmación registrada correctamente.',
          );
        },
        error: (error: unknown) => {
          this.isSubmitting.set(false);

          const status =
            error instanceof HttpErrorResponse
              ? error.status
              : null;

          if (status === 403) {
            this.errorMessage.set(
              'No tienes permisos para confirmar esta cita.',
            );
          } else if (status === 409) {
            this.errorMessage.set(
              'La cita cambió o ya no permite esta acción.',
            );
          } else {
            this.errorMessage.set(
              'No se pudo confirmar la cita.',
            );
          }
        },
      });
  }
}
