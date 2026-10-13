export interface AppointmentListQuery {
  readonly page?: number;
  readonly limit?: number;
  readonly patientId?: string;
  readonly dentistId?: string;
  readonly from?: string;
  readonly to?: string;
}

export type ConfirmationChannel = 'PHONE' | 'IN_PERSON' | 'EMAIL';

export interface ConfirmAppointmentRequest {
  readonly expectedVersion: number;
  readonly channel: ConfirmationChannel;
}

export interface CancelAppointmentRequest {
  readonly expectedVersion: number;
  readonly reason: string;
  readonly override?: boolean;
}

export interface RescheduleAppointmentRequest {
  readonly expectedVersion: number;
  readonly startAt: string;
  readonly endAt: string;
  readonly reason: string;
  readonly override?: boolean;
}

export interface ExpectedVersionRequest {
  readonly expectedVersion: number;
}

export interface NoShowAppointmentRequest {
  readonly expectedVersion: number;
  readonly reason: string;
}

export interface PublicConfirmationRequest {
  readonly token: string;
}

export interface ConfirmationReceipt {
  readonly confirmed: boolean;
}

export interface EndClinicalAssignmentRequest {
  readonly reason: string;
  readonly expectedVersion: number;
}