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
});