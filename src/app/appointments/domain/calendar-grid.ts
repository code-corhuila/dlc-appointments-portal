import {
  CalendarView,
  getCalendarRange,
} from './calendar-range';

export interface CalendarDay {
  readonly date: string;
  readonly isCurrentMonth: boolean;
}

export function buildCalendarDays(
  anchorDate: string,
  view: CalendarView,
): readonly CalendarDay[] {
  const range = getCalendarRange(anchorDate, view);
  const anchorMonth = anchorDate.slice(0, 7);

  const start =
    view === 'month'
      ? getMonthGridStart(range.from)
      : parseRangeDate(range.from);

  const dayCount = view === 'month' ? 42 : 7;

  return Array.from(
    { length: dayCount },
    (_, index) => {
      const date = new Date(start);
      date.setUTCDate(start.getUTCDate() + index);

      const value = formatDate(date);

      return {
        date: value,
        isCurrentMonth: value.startsWith(anchorMonth),
      };
    },
  );
}

function getMonthGridStart(from: string): Date {
  const monthStart = parseRangeDate(from);
  const gridStart = new Date(monthStart);

  gridStart.setUTCDate(
    monthStart.getUTCDate() - monthStart.getUTCDay(),
  );

  return gridStart;
}

function parseRangeDate(value: string): Date {
  const date = value.slice(0, 10);

  return new Date(`${date}T00:00:00Z`);
}

function formatDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(
    date.getUTCMonth() + 1,
  ).padStart(2, '0');
  const day = String(
    date.getUTCDate(),
  ).padStart(2, '0');

  return `${year}-${month}-${day}`;
}