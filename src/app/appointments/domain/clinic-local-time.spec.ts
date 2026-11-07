import { clinicToday, toClinicLocalDateTime } from './clinic-time';

describe('clinic local time', () => {
  it('renders a UTC instant from the API at the clinic offset', () => {
    expect(toClinicLocalDateTime('2026-11-10T19:00:00Z')).toBe('2026-11-10T14:00:00-05:00');
  });

  it('moves late UTC instants back to the previous clinic day', () => {
    expect(toClinicLocalDateTime('2026-11-11T03:30:00Z')).toBe('2026-11-10T22:30:00-05:00');
  });

  it('keeps an instant that already carries the clinic offset', () => {
    expect(toClinicLocalDateTime('2026-11-10T14:00:00-05:00')).toBe('2026-11-10T14:00:00-05:00');
  });

  it('rejects a value that is not an instant', () => {
    expect(() => toClinicLocalDateTime('mañana')).toThrow();
  });

  it('gives the clinic date of a moment', () => {
    expect(clinicToday(new Date('2026-11-08T02:00:00Z'))).toBe('2026-11-07');
  });
});
