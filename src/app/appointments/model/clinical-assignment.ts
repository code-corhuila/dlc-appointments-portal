export type ClinicalAssignmentStatus = 'ACTIVE' | 'ENDED';

export interface ClinicalAssignment {
  readonly id: string;
  readonly patientId: string;
  readonly dentistId: string;
  readonly status: ClinicalAssignmentStatus;
  readonly reason: string;
  readonly startedAt: string;
  readonly startedBy: string;
  readonly endedAt?: string;
  readonly endedBy?: string;
  readonly version: number;
}

export interface ClinicalAssignmentListQuery {
  readonly page?: number;
  readonly limit?: number;
  readonly patientId?: string;
  readonly dentistId?: string;
}

export interface CreateClinicalAssignmentRequest {
  readonly patientId: string;
  readonly dentistId: string;
  readonly reason: string;
}