import { describe, expect, it } from 'vitest';

import {
  CLINIC_TIME_ZONE,
  toClinicOffsetDateTime,
} from './clinic-time';

describe('clinic time helpers', () => {
  it('uses America/Bogota as the clinic time zone', () => {
    expect(CLINIC_TIME_ZONE).toBe('America/Bogota');
  });

  it('adds the clinic UTC offset to a local appointment time', () => {
    expect(toClinicOffsetDateTime('2026-10-06T09:30')).toBe(
      '2026-10-06T09:30:00-05:00',
    );
  });

  it('preserves seconds when the local appointment time includes them', () => {
    expect(toClinicOffsetDateTime('2026-10-06T09:30:45')).toBe(
      '2026-10-06T09:30:45-05:00',
    );
  });

  it('rejects a malformed local appointment time', () => {
    expect(() =>
      toClinicOffsetDateTime('not-a-date'),
    ).toThrow('Invalid clinic local date-time');
  });

  it('rejects an appointment time that already contains an offset', () => {
    expect(() =>
      toClinicOffsetDateTime('2026-10-06T09:30:00-05:00'),
    ).toThrow('Invalid clinic local date-time');
  });

  it('rejects an impossible calendar date', () => {
    expect(() =>
      toClinicOffsetDateTime('2026-02-31T09:30'),
    ).toThrow('Invalid clinic local date-time');
  });
});