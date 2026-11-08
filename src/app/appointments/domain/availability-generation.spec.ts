import { describe, expect, it } from 'vitest';

import { generateAvailabilityRange } from './availability-schedule';

const week = {
  monday: [
    { start: '08:00', end: '12:00' },
    { start: '14:00', end: '18:00' },
  ],
  tuesday: [{ start: '09:00', end: '11:00' }],
};

describe('generateAvailabilityRange', () => {
  it('creates the weekly shifts for every matching date in clinic time', () => {
    const result = generateAvailabilityRange([], '2026-11-15', '2026-11-17', week, 'America/Bogota');

    expect(result.added).toBe(3);
    expect(result.intervals.map((interval) => [new Date(interval.startAt).toISOString(),
      new Date(interval.endAt).toISOString()])).toEqual([
      ['2026-11-16T13:00:00.000Z', '2026-11-16T17:00:00.000Z'],
      ['2026-11-16T19:00:00.000Z', '2026-11-16T23:00:00.000Z'],
      ['2026-11-17T14:00:00.000Z', '2026-11-17T16:00:00.000Z'],
    ]);
  });

  it('keeps existing intervals and skips shifts that would overlap them', () => {
    const existing = [{ startAt: '2026-11-16T13:00:00Z', endAt: '2026-11-16T15:00:00Z' }];

    const result = generateAvailabilityRange(existing, '2026-11-16', '2026-11-16', week, 'America/Bogota');

    expect(result.added).toBe(1);
    expect(result.intervals[0]).toEqual(existing[0]);
    expect(result.intervals).toHaveLength(2);
  });

  it('rejects an inverted or too long range', () => {
    expect(() => generateAvailabilityRange([], '2026-11-17', '2026-11-16', week)).toThrow('range');
    expect(() => generateAvailabilityRange([], '2026-01-01', '2026-06-01', week)).toThrow('range');
    expect(() => generateAvailabilityRange([], '', '2026-06-01', week)).toThrow('range');
  });
});
