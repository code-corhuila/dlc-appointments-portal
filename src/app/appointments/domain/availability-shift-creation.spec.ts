
import { describe, expect, it } from 'vitest';

import { AvailabilityInterval } from '../model/availability';
import { addAvailabilityShift } from './availability-schedule';

describe('addAvailabilityShift', () => {
  const existingInterval: AvailabilityInterval = {
    startAt: '2026-10-12T08:00:00-05:00',
    endAt: '2026-10-12T12:00:00-05:00',
  };

  it('creates a shift for a specific clinic date', () => {
    const result = addAvailabilityShift(
      [existingInterval],
      '2026-10-12',
      '14:00',
      '18:00',
      'America/Bogota',
    );

    expect(result).toEqual([
      existingInterval,
      {
        startAt: '2026-10-12T14:00:00-05:00',
        endAt: '2026-10-12T18:00:00-05:00',
      },
    ]);
  });

  it('uses the configured clinic time zone', () => {
    const result = addAvailabilityShift(
      [],
      '2026-10-12',
      '09:00',
      '10:00',
      'America/New_York',
    );

    expect(result).toEqual([
      {
        startAt: '2026-10-12T09:00:00-04:00',
        endAt: '2026-10-12T10:00:00-04:00',
      },
    ]);
  });

  it('rejects a shift with an invalid time range', () => {
    expect(() =>
      addAvailabilityShift(
        [],
        '2026-10-12',
        '18:00',
        '14:00',
      ),
    ).toThrow();

    expect(() =>
      addAvailabilityShift(
        [],
        '2026-10-12',
        '09:00',
        '09:00',
      ),
    ).toThrow();
  });

  it('rejects overlapping availability intervals', () => {
    expect(() =>
      addAvailabilityShift(
        [existingInterval],
        '2026-10-12',
        '11:00',
        '14:00',
      ),
    ).toThrow();

    expect(() =>
      addAvailabilityShift(
        [existingInterval],
        '2026-10-12',
        '08:00',
        '12:00',
      ),
    ).toThrow();
  });

  it('allows consecutive shifts without overlap', () => {
    const result = addAvailabilityShift(
      [existingInterval],
      '2026-10-12',
      '12:00',
      '14:00',
    );

    expect(result).toHaveLength(2);
    expect(result[1]).toEqual({
      startAt: '2026-10-12T12:00:00-05:00',
      endAt: '2026-10-12T14:00:00-05:00',
    });
  });

  it('rejects invalid clinic dates', () => {
    expect(() =>
      addAvailabilityShift(
        [],
        '2026-02-30',
        '08:00',
        '10:00',
      ),
    ).toThrow();
  });

  it('keeps the original intervals unchanged', () => {
    const intervals = [existingInterval];

    addAvailabilityShift(
      intervals,
      '2026-10-13',
      '08:00',
      '12:00',
    );

    expect(intervals).toEqual([existingInterval]);
  });
});
