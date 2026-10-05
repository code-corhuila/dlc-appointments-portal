export type AppointmentStatus =
  | 'PROGRAMADA'
  | 'CONFIRMADA'
  | 'EN_ATENCION'
  | 'FINALIZADA'
  | 'CANCELADA'
  | 'NO_ASISTIO';

export type AppointmentConfirmationStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'NOT_CONFIRMED';

export interface Appointment {
  readonly id: string;
  readonly patientId: string;
  readonly dentistId: string;
  readonly startAt: string;
  readonly endAt: string;
  readonly reason?: string;
  readonly status: AppointmentStatus;
  readonly confirmationStatus?: AppointmentConfirmationStatus;
  readonly reminderDueAt?: string;
  readonly createdAt?: string;
  readonly updatedAt?: string;
  readonly version: number;
}

export interface CreateAppointmentRequest {
  readonly patientId: string;
  readonly dentistId: string;
  readonly startAt: string;
  readonly endAt: string;
  readonly reason: string;
}