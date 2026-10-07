import {
  DEFAULT_SLOT_DURATION_MINUTES,
  DEFAULT_WEEKLY_AVAILABILITY,
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
});