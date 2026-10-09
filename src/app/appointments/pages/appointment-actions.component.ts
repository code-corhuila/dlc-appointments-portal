
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { AppointmentsApiService } from '../data/appointments-api.service';
import { Appointment } from '../model/appointment';
import {
  ConfirmationChannel,
  RescheduleAppointmentRequest,
} from '../model/appointment-operations';

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

        @if (canCancel()) {
          <button
            type="button"
            data-appointment-cancel
            [disabled]="isSubmitting()"
            (click)="startCancellation()"
          >
            Cancelar cita
          </button>

          @if (isChoosingCancellation()) {
            <label for="cancellation-reason">
              Motivo de cancelación
            </label>

            <input
              id="cancellation-reason"
              data-cancellation-reason
              [value]="cancellationReason()"
              [disabled]="isSubmitting()"
              (input)="onCancellationReasonChange($event)"
            />

            <button
              type="button"
              data-appointment-submit-cancellation
              [disabled]="isSubmitting() || !cancellationReason().trim()"
              (click)="submitCancellation()"
            >
              Confirmar cancelación
            </button>

            <button
              type="button"
              data-appointment-dismiss-cancellation
              [disabled]="isSubmitting()"
              (click)="dismissCancellation()"
            >
              Volver
            </button>
          }
        } @else if (isCancellationRestricted()) {
          <p data-cancellation-restriction>
            La cancelación normal no está disponible dentro de las 24 horas previas a la cita.
          </p>
        }

        @if (canReschedule()) {
          <button type="button" data-appointment-reschedule [disabled]="isSubmitting()" (click)="startRescheduling()">Reprogramar cita</button>
          @if (isChoosingRescheduling()) {
            <label for="rescheduling-start">Nueva fecha y hora</label>
            <input id="rescheduling-start" data-rescheduling-start type="datetime-local" [value]="reschedulingStart()" [disabled]="isSubmitting()" (input)="reschedulingStart.set($any($event.target).value)" />
            <label for="rescheduling-reason">Motivo de reprogramación</label>
            <input id="rescheduling-reason" data-rescheduling-reason [value]="reschedulingReason()" [disabled]="isSubmitting()" (input)="reschedulingReason.set($any($event.target).value)" />
            <button type="button" data-appointment-submit-rescheduling [disabled]="isSubmitting() || !isValidRescheduling()" (click)="submitRescheduling()">Confirmar reprogramación</button>
            <button type="button" data-appointment-dismiss-rescheduling [disabled]="isSubmitting()" (click)="dismissRescheduling()">Volver</button>
          }
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

  private readonly cancellationFormAppointmentId =
    signal<string | null>(null);
  private readonly reschedulingFormAppointmentId = signal<string | null>(null);

  readonly appointment = input.required<Appointment>();
  readonly canManage = input(false);
  readonly now = input<Date>(new Date());
  readonly appointmentUpdated = output<Appointment>();

  readonly updatedAppointment = signal<Appointment | null>(null);

  readonly currentAppointment = computed(() => {
    const original = this.appointment();
    const updated = this.updatedAppointment();

    if (
      updated !== null &&
      updated.id === original.id &&
      updated.version > original.version
    ) {
      return updated;
    }

    return original;
  });

  readonly isChoosingChannel = computed(
    () =>
      this.confirmationFormAppointmentId() ===
      this.appointment().id,
  );

  readonly isChoosingCancellation = computed(
    () =>
      this.cancellationFormAppointmentId() ===
      this.appointment().id,
  );

  readonly canCancel = computed(() => {
    const appointment = this.currentAppointment();

    return this.canManage() &&
      appointment.status === 'PROGRAMADA' &&
      new Date(appointment.startAt).getTime() - this.now().getTime() >=
        24 * 60 * 60 * 1000;
  });

  readonly isCancellationRestricted = computed(() => {
    const appointment = this.currentAppointment();

    return this.canManage() &&
      appointment.status === 'PROGRAMADA' &&
      !this.canCancel();
  });

  readonly isSubmitting = signal(false);
  readonly selectedChannel = signal<ConfirmationChannel>('PHONE');
  readonly cancellationReason = signal('');
  readonly reschedulingStart = signal('');
  readonly reschedulingReason = signal('');

  readonly feedback = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);

  readonly isChoosingRescheduling = computed(() =>
    this.reschedulingFormAppointmentId() === this.appointment().id,
  );

  readonly canReschedule = computed(() => this.canCancel());

  readonly isValidRescheduling = computed(() => {
    const startAt = this.reschedulingStart();
    return !!this.reschedulingReason().trim() &&
      !!startAt && new Date(startAt).getTime() > this.now().getTime() &&
      new Date(startAt).getTime() !== new Date(this.currentAppointment().startAt).getTime();
  });

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
          this.updatedAppointment.set(updatedAppointment);
          this.appointmentUpdated.emit(updatedAppointment);
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

  startCancellation(): void {
    if (!this.canCancel() || this.isSubmitting()) {
      return;
    }

    this.cancellationFormAppointmentId.set(this.appointment().id);
  }

  onCancellationReasonChange(event: Event): void {
    this.cancellationReason.set(
      (event.target as HTMLInputElement).value,
    );
  }

  dismissCancellation(): void {
    if (!this.isSubmitting()) {
      this.cancellationFormAppointmentId.set(null);
      this.cancellationReason.set('');
    }
  }

  submitCancellation(): void {
    const appointment = this.currentAppointment();
    const reason = this.cancellationReason().trim();

    if (
      !this.canCancel() ||
      !this.isChoosingCancellation() ||
      !reason ||
      this.isSubmitting()
    ) {
      return;
    }

    this.isSubmitting.set(true);
    this.feedback.set(null);
    this.errorMessage.set(null);

    this.api
      .cancelAppointment(
        appointment.id,
        { expectedVersion: appointment.version, reason },
        crypto.randomUUID(),
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updatedAppointment: Appointment) => {
          this.updatedAppointment.set(updatedAppointment);
          this.appointmentUpdated.emit(updatedAppointment);
          this.isSubmitting.set(false);
          this.cancellationFormAppointmentId.set(null);
          this.feedback.set('Cancelación registrada correctamente.');
        },
        error: (error: unknown) => {
          this.isSubmitting.set(false);
          const status = error instanceof HttpErrorResponse ? error.status : null;

          if (status === 403) {
            this.errorMessage.set('No tienes permisos para cancelar esta cita.');
          } else if (status === 409) {
            this.errorMessage.set('La cita cambió o ya no permite esta acción.');
          } else {
            this.errorMessage.set('No se pudo cancelar la cita.');
          }
        },
      });
  }

  startRescheduling(): void {
    if (!this.canReschedule() || this.isSubmitting()) return;
    this.reschedulingFormAppointmentId.set(this.appointment().id);
  }

  dismissRescheduling(): void {
    if (!this.isSubmitting()) this.reschedulingFormAppointmentId.set(null);
  }

  submitRescheduling(): void {
    const appointment = this.currentAppointment();
    if (!this.canReschedule() || !this.isChoosingRescheduling() || !this.isValidRescheduling() || this.isSubmitting()) return;
    const startAt = new Date(this.reschedulingStart()).toISOString();
    const duration = new Date(appointment.endAt).getTime() - new Date(appointment.startAt).getTime();
    const request: RescheduleAppointmentRequest = {
      expectedVersion: appointment.version, startAt,
      endAt: new Date(new Date(startAt).getTime() + duration).toISOString(),
      reason: this.reschedulingReason().trim(),
    };
    this.isSubmitting.set(true); this.feedback.set(null); this.errorMessage.set(null);
    this.api.rescheduleAppointment(appointment.id, request, crypto.randomUUID())
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (updated: Appointment) => { this.updatedAppointment.set(updated); this.appointmentUpdated.emit(updated); this.isSubmitting.set(false); this.reschedulingFormAppointmentId.set(null); this.feedback.set('Reprogramación registrada correctamente.'); },
        error: () => { this.isSubmitting.set(false); this.errorMessage.set('No se pudo reprogramar la cita.'); },
      });
  }
}
