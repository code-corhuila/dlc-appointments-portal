export interface AppointmentTimeRangeInput {
  readonly startAt: string;
  readonly endAt: string;
  readonly now: string;
}

export type AppointmentTimeValidationResult =
  | {
      readonly valid: true;
    }
  | {
      readonly valid: false;
      readonly code:
        | 'INVALID_TIMESTAMP'
        | 'EXPLICIT_OFFSET_REQUIRED'
        | 'END_NOT_AFTER_START'
        | 'START_NOT_IN_FUTURE';
    };

const EXPLICIT_OFFSET_PATTERN = /(Z|[+-]\d{2}:\d{2})$/;

export function validateAppointmentTimeRange(
  input: AppointmentTimeRangeInput,
): AppointmentTimeValidationResult {
  const startAt = new Date(input.startAt);
  const endAt = new Date(input.endAt);
  const now = new Date(input.now);

  if (
    Number.isNaN(startAt.getTime()) ||
    Number.isNaN(endAt.getTime()) ||
    Number.isNaN(now.getTime())
  ) {
    return {
      valid: false,
      code: 'INVALID_TIMESTAMP',
    };
  }

  if (
    !EXPLICIT_OFFSET_PATTERN.test(input.startAt) ||
    !EXPLICIT_OFFSET_PATTERN.test(input.endAt) ||
    !EXPLICIT_OFFSET_PATTERN.test(input.now)
  ) {
    return {
      valid: false,
      code: 'EXPLICIT_OFFSET_REQUIRED',
    };
  }

  if (endAt.getTime() <= startAt.getTime()) {
    return {
      valid: false,
      code: 'END_NOT_AFTER_START',
    };
  }

  if (startAt.getTime() <= now.getTime()) {
    return {
      valid: false,
      code: 'START_NOT_IN_FUTURE',
    };
  }

  return {
    valid: true,
  };
}