import { CLINIC_UTC_OFFSET } from './clinic-time';

export type CalendarView = 'month' | 'week';

export interface CalendarRange {
  readonly from: string;
  readonly to: string;
}

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export function getCalendarRange(
  anchorDate: string,
  view: CalendarView,
): CalendarRange {
  const anchor = parseDate(anchorDate);

  if (view === 'month') {
    const from = new Date(
      Date.UTC(
        anchor.getUTCFullYear(),
        anchor.getUTCMonth(),
        1,
      ),
    );

    const to = new Date(
      Date.UTC(
        anchor.getUTCFullYear(),
        anchor.getUTCMonth() + 1,
        1,
      ),
    );

    return {
      from: formatClinicMidnight(from),
      to: formatClinicMidnight(to),
    };
  }

  const from = new Date(anchor);
  from.setUTCDate(
    anchor.getUTCDate() - anchor.getUTCDay(),
  );

  const to = new Date(from);
  to.setUTCDate(from.getUTCDate() + 7);

  return {
    from: formatClinicMidnight(from),
    to: formatClinicMidnight(to),
  };
}

function parseDate(value: string): Date {
  const match = DATE_PATTERN.exec(value);

  if (!match) {
    throw new Error('Invalid calendar anchor date');
  }

  const [, year, month, day] = match;

  const parsed = new Date(
    Date.UTC(
      Number(year),
      Number(month) - 1,
      Number(day),
    ),
  );

  const isValid =
    parsed.getUTCFullYear() === Number(year) &&
    parsed.getUTCMonth() === Number(month) - 1 &&
    parsed.getUTCDate() === Number(day);

  if (!isValid) {
    throw new Error('Invalid calendar anchor date');
  }

  return parsed;
}

function formatClinicMidnight(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');

  return `${year}-${month}-${day}T00:00:00${CLINIC_UTC_OFFSET}`;
}