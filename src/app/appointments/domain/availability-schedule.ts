import { AvailabilityInterval } from '../model/availability';
import { CLINIC_TIME_ZONE } from './clinic-time';

export interface AvailabilityDayDefaults {
  readonly key: string;
  readonly label: string;
  readonly enabled: boolean;
  readonly shiftOne: {
    readonly start: string;
    readonly end: string;
  };
  readonly shiftTwo: {
    readonly enabled: boolean;
    readonly start: string;
    readonly end: string;
  };
}

export interface AvailabilityShift {
  readonly start: string;
  readonly end: string;
}

const WEEK_DAYS = [
  ['monday', 'Lunes'],
  ['tuesday', 'Martes'],
  ['wednesday', 'Miércoles'],
  ['thursday', 'Jueves'],
  ['friday', 'Viernes'],
] as const;

export type AvailabilityDayKey =
  (typeof WEEK_DAYS)[number][0];

export type WeeklyAvailabilitySchedule = Readonly<
  Partial<
    Record<
      AvailabilityDayKey,
      readonly AvailabilityShift[]
    >
  >
>;

const SUPPORTED_WEEK_DAYS: readonly AvailabilityDayKey[] =
  WEEK_DAYS.map(([key]) => key);

const CLINIC_DATE_TIME_FORMATTER =
  new Intl.DateTimeFormat('en-US', {
    timeZone: CLINIC_TIME_ZONE,
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });

export const DEFAULT_SLOT_DURATION_MINUTES = 30;

export const DEFAULT_WEEKLY_AVAILABILITY: readonly AvailabilityDayDefaults[] =
  WEEK_DAYS.map(([key, label]) => ({
    key,
    label,
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
  }));

export function mapAvailabilityIntervalsToWeek(
  intervals: readonly AvailabilityInterval[],
): WeeklyAvailabilitySchedule {
  const schedule: Partial<
    Record<
      AvailabilityDayKey,
      AvailabilityShift[]
    >
  > = {};

  for (const interval of intervals) {
    const start =
      toClinicSchedulePoint(interval.startAt);

    const end =
      toClinicSchedulePoint(interval.endAt);

    if (!isAvailabilityDayKey(start.dayKey)) {
      continue;
    }

    schedule[start.dayKey] ??= [];

    schedule[start.dayKey]?.push({
      start: start.time,
      end: end.time,
    });
  }

  for (const shifts of Object.values(schedule)) {
    shifts?.sort((left, right) =>
      left.start.localeCompare(right.start),
    );
  }

  return schedule;
}

function toClinicSchedulePoint(
  value: string,
): {
  readonly dayKey: string;
  readonly time: string;
} {
  const instant = new Date(value);

  if (Number.isNaN(instant.getTime())) {
    throw new Error(
      'Invalid availability interval date-time',
    );
  }

  const parts = Object.fromEntries(
    CLINIC_DATE_TIME_FORMATTER
      .formatToParts(instant)
      .map((part) => [
        part.type,
        part.value,
      ]),
  );

  return {
    dayKey: parts['weekday'].toLowerCase(),
    time: `${parts['hour']}:${parts['minute']}`,
  };
}

function isAvailabilityDayKey(
  value: string,
): value is AvailabilityDayKey {
  return (
    SUPPORTED_WEEK_DAYS as readonly string[]
  ).includes(value);
}