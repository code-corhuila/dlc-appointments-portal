export type PatientStatus = 'ACTIVE' | 'INACTIVE';

export interface PatientView {
  readonly id: string;
  readonly name: string;
  readonly status: PatientStatus;
  readonly version: number;
  readonly documentType?: string;
  readonly documentNumber?: string;
  readonly birthDate?: string;
  readonly phone?: string;
  readonly email?: string;
  readonly address?: string;
}

export interface PatientLookupQuery {
  readonly page?: number;
  readonly limit?: number;
  readonly search?: string;
  readonly status?: PatientStatus;
}