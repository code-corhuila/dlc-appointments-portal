import {
  DEFAULT_SLOT_DURATION_MINUTES,
  DEFAULT_WEEKLY_AVAILABILITY,
  mapAvailabilityIntervalsToWeek,
} from './availability-schedule';
import { CLINIC_TIME_ZONE } from './clinic-time';

describe('availability schedule defaults', () => {
  it('defines the default monday schedule', () => {
    const monday = DEFAULT_WEEKLY_AVAILABILITY.find(
      (day) => day.key === 'monday',
    );

    expect(monday).toEqual({
      key: 'monday',
      label: 'Lunes',
      enabled: true,
      shiftOne: {
        start: '08:00',
        end: '12:00',
      },
      shiftTwo: {
        enabled: true,
        start: '14:00',
        end: '18:00',
      },
    });
  });

  it('defines the default slot duration', () => {
    expect(DEFAULT_SLOT_DURATION_MINUTES).toBe(30);
  });

  it('uses the clinic timezone as the canonical timezone', () => {
    expect(CLINIC_TIME_ZONE).toBe('America/Bogota');
  });

  it('converts UTC availability to clinic local time', () => {
    const schedule = mapAvailabilityIntervalsToWeek([
      {
        startAt: '2026-10-05T14:30:00Z',
        endAt: '2026-10-05T16:30:00Z',
      },
    ]);

    expect(schedule.monday).toEqual([
      {
        start: '09:30',
        end: '11:30',
      },
    ]);
  });

  it('uses the clinic local weekday when UTC crosses midnight', () => {
    const schedule = mapAvailabilityIntervalsToWeek([
      {
        startAt: '2026-10-06T02:30:00Z',
        endAt: '2026-10-06T03:30:00Z',
      },
    ]);

    expect(schedule.monday).toEqual([
      {
        start: '21:30',
        end: '22:30',
      },
    ]);

    expect(schedule.tuesday).toBeUndefined();
  });
});