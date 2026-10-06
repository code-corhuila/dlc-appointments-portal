import { buildCalendarDays } from './calendar-grid';

describe('buildCalendarDays', () => {
  it('builds only the complete weeks required by the month', () => {
    const days = buildCalendarDays(
      '2026-10-15',
      'month',
    );

    expect(days).toHaveLength(35);
    expect(days[0]).toEqual({
      date: '2026-09-27',
      isCurrentMonth: false,
    });
    expect(days[4]).toEqual({
      date: '2026-10-01',
      isCurrentMonth: true,
    });
    expect(days[34]).toEqual({
      date: '2026-10-31',
      isCurrentMonth: true,
    });
  });

  it('uses six weeks when the month requires them', () => {
    const days = buildCalendarDays(
      '2026-08-15',
      'month',
    );

    expect(days).toHaveLength(42);
    expect(days[0]).toEqual({
      date: '2026-07-26',
      isCurrentMonth: false,
    });
    expect(days[6]).toEqual({
      date: '2026-08-01',
      isCurrentMonth: true,
    });
    expect(days[41]).toEqual({
      date: '2026-09-05',
      isCurrentMonth: false,
    });
  });

  it('builds a Sunday-to-Saturday week grid', () => {
    const days = buildCalendarDays(
      '2026-10-06',
      'week',
    );

    expect(days).toEqual([
      {
        date: '2026-10-04',
        isCurrentMonth: true,
      },
      {
        date: '2026-10-05',
        isCurrentMonth: true,
      },
      {
        date: '2026-10-06',
        isCurrentMonth: true,
      },
      {
        date: '2026-10-07',
        isCurrentMonth: true,
      },
      {
        date: '2026-10-08',
        isCurrentMonth: true,
      },
      {
        date: '2026-10-09',
        isCurrentMonth: true,
      },
      {
        date: '2026-10-10',
        isCurrentMonth: true,
      },
    ]);
  });

  it('marks week days outside the anchor month', () => {
    const days = buildCalendarDays(
      '2026-10-01',
      'week',
    );

    expect(days).toEqual([
      {
        date: '2026-09-27',
        isCurrentMonth: false,
      },
      {
        date: '2026-09-28',
        isCurrentMonth: false,
      },
      {
        date: '2026-09-29',
        isCurrentMonth: false,
      },
      {
        date: '2026-09-30',
        isCurrentMonth: false,
      },
      {
        date: '2026-10-01',
        isCurrentMonth: true,
      },
      {
        date: '2026-10-02',
        isCurrentMonth: true,
      },
      {
        date: '2026-10-03',
        isCurrentMonth: true,
      },
    ]);
  });

  it('rejects an invalid anchor date', () => {
    expect(() =>
      buildCalendarDays(
        '2026-02-30',
        'month',
      ),
    ).toThrow('Invalid calendar anchor date');
  });
});