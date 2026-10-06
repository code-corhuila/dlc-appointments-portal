import {
  getCalendarRange,
  type CalendarView,
} from './calendar-range';

describe('getCalendarRange', () => {
  it('returns the full month range with clinic offset', () => {
    const range = getCalendarRange(
      '2026-10-15',
      'month',
    );

    expect(range).toEqual({
      from: '2026-10-01T00:00:00-05:00',
      to: '2026-11-01T00:00:00-05:00',
    });
  });

  it('handles a month range that crosses the year boundary', () => {
    const range = getCalendarRange(
      '2026-12-20',
      'month',
    );

    expect(range).toEqual({
      from: '2026-12-01T00:00:00-05:00',
      to: '2027-01-01T00:00:00-05:00',
    });
  });

  it('returns a Sunday-to-Sunday week range', () => {
    const range = getCalendarRange(
      '2026-10-06',
      'week',
    );

    expect(range).toEqual({
      from: '2026-10-04T00:00:00-05:00',
      to: '2026-10-11T00:00:00-05:00',
    });
  });

  it('handles a week that crosses a month boundary', () => {
    const range = getCalendarRange(
      '2026-11-02',
      'week',
    );

    expect(range).toEqual({
      from: '2026-11-01T00:00:00-05:00',
      to: '2026-11-08T00:00:00-05:00',
    });
  });

  it.each<CalendarView>([
    'month',
    'week',
  ])('rejects an invalid anchor date for %s view', (view) => {
    expect(() =>
      getCalendarRange('2026-02-30', view),
    ).toThrow('Invalid calendar anchor date');
  });
});