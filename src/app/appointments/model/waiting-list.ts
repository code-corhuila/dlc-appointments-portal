/** HU-APT-006: one entry of the migration-owned appointment-type catalog. */
export interface AppointmentType {
  readonly code: string;
  readonly label: string;
  readonly color: string;
}

export type WaitingListStatus = 'WAITING' | 'SCHEDULED' | 'WITHDRAWN';

/** HU-APT-005: waiting-list metadata, never clinical narrative. */
export interface WaitingListEntry {
  readonly id: string;
  readonly patientId: string;
  readonly dentistId?: string;
  readonly reason: string;
  readonly preferredFrom?: string;
  readonly preferredTo?: string;
  readonly status: WaitingListStatus;
  readonly appointmentId?: string;
  readonly createdAt: string;
  readonly createdBy: string;
  readonly resolvedAt?: string;
  readonly version: number;
}

export interface CreateWaitingListEntryRequest {
  readonly patientId: string;
  readonly dentistId?: string;
  readonly reason: string;
  readonly preferredFrom?: string;
  readonly preferredTo?: string;
}

export interface ResolveWaitingListEntryRequest {
  readonly outcome: 'SCHEDULED' | 'WITHDRAWN';
  readonly appointmentId?: string;
  readonly expectedVersion: number;
}
