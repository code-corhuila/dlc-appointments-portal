
import { describe, expect, it } from 'vitest';

import {
  deriveAvailabilitySlotsForDate,
  mapAvailabilityIntervalsToWeek,
} from './availability-schedule';

describe('availability schedule time zone configuration', () => {
  it('maps availability using the configured clinic time zone', () => {
    const schedule = mapAvailabilityIntervalsToWeek(
      [
        {
          startAt: '2026-07-06T13:00:00Z',
          endAt: '2026-07-06T14:00:00Z',
        },
      ],
      'America/New_York',
    );

    expect(schedule.monday).toEqual([
      {
        start: '09:00',
        end: '10:00',
      },
    ]);
  });

  it('derives slots using the configured summer UTC offset', () => {
    const slots = deriveAvailabilitySlotsForDate(
      [
        {
          startAt: '2026-07-06T13:00:00Z',
          endAt: '2026-07-06T14:00:00Z',
        },
      ],
      '2026-07-06',
      [],
      30,
      'America/New_York',
    );

    expect(slots).toEqual([
      {
        startAt: '2026-07-06T09:00:00-04:00',
        endAt: '2026-07-06T09:30:00-04:00',
        label: '09:00',
      },
      {
        startAt: '2026-07-06T09:30:00-04:00',
        endAt: '2026-07-06T10:00:00-04:00',
        label: '09:30',
      },
    ]);
  });
});
