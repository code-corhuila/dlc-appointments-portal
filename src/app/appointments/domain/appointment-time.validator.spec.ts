import { describe, expect, it } from 'vitest';

import { validateAppointmentTimeRange } from './appointment-time.validator';

describe('validateAppointmentTimeRange', () => {
  it('rejects an appointment whose end time is not after its start time', () => {
    const result = validateAppointmentTimeRange({
      startAt: '2026-10-06T09:00:00-05:00',
      endAt: '2026-10-06T09:00:00-05:00',
      now: '2026-10-05T09:00:00-05:00',
    });

    expect(result).toEqual({
      valid: false,
      code: 'END_NOT_AFTER_START',
    });
  });

  it('rejects an appointment whose start time is not in the future', () => {
    const result = validateAppointmentTimeRange({
      startAt: '2026-10-05T09:00:00-05:00',
      endAt: '2026-10-05T10:00:00-05:00',
      now: '2026-10-05T09:00:00-05:00',
    });

    expect(result).toEqual({
      valid: false,
      code: 'START_NOT_IN_FUTURE',
    });
  });

  it('rejects an appointment with an invalid timestamp', () => {
    const result = validateAppointmentTimeRange({
      startAt: 'not-a-date',
      endAt: '2026-10-06T10:00:00-05:00',
      now: '2026-10-05T09:00:00-05:00',
    });

    expect(result).toEqual({
      valid: false,
      code: 'INVALID_TIMESTAMP',
    });
  });
  it('rejects an appointment timestamp without an explicit offset', () => {
    const result = validateAppointmentTimeRange({
      startAt: '2026-10-06T09:00:00',
      endAt: '2026-10-06T10:00:00-05:00',
      now: '2026-10-05T09:00:00-05:00',
    });

    expect(result).toEqual({
      valid: false,
      code: 'EXPLICIT_OFFSET_REQUIRED',
    });
  });
  it('accepts a valid future appointment with explicit offsets', () => {
    const result = validateAppointmentTimeRange({
      startAt: '2026-10-06T09:00:00-05:00',
      endAt: '2026-10-06T10:00:00-05:00',
      now: '2026-10-05T09:00:00-05:00',
    });

    expect(result).toEqual({
      valid: true,
    });
  });
});