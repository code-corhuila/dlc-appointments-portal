export interface AvailabilityInterval {
  readonly startAt: string;
  readonly endAt: string;
}

export interface DentistAvailability {
  readonly id: string;
  readonly dentistId: string;
  readonly intervals: readonly AvailabilityInterval[];
  readonly blockedIntervals: readonly AvailabilityInterval[];
  readonly version: number;
}

export interface UpdateDentistAvailabilityRequest {
  readonly intervals: readonly AvailabilityInterval[];
  readonly blockedIntervals: readonly AvailabilityInterval[];
  readonly expectedVersion: number;
}