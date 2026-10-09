
import { AvailabilityInterval } from '../model/availability';
import {
  CLINIC_TIME_ZONE,
  toClinicOffsetDateTime,
} from './clinic-time';

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

export interface AvailabilitySlot {
  readonly startAt: string;
  readonly endAt: string;
  readonly label: string;
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

export type AvailabilityTimeField =
  | 'startAt'
  | 'endAt';

const SUPPORTED_WEEK_DAYS: readonly AvailabilityDayKey[] =
  WEEK_DAYS.map(([key]) => key);

const CLINIC_DATE_TIME_FORMATTERS =
  new Map<string, Intl.DateTimeFormat>();

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
  timeZone: string = CLINIC_TIME_ZONE,
): WeeklyAvailabilitySchedule {
  const schedule: Partial<
    Record<
      AvailabilityDayKey,
      AvailabilityShift[]
    >
  > = {};

  for (const interval of intervals) {
    const start =
      toClinicSchedulePoint(
        interval.startAt,
        timeZone,
      );

    const end =
      toClinicSchedulePoint(
        interval.endAt,
        timeZone,
      );

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

export function deriveAvailabilitySlotsForDate(
  intervals: readonly AvailabilityInterval[],
  clinicDate: string,
  blockedIntervals: readonly AvailabilityInterval[] = [],
  durationMinutes = DEFAULT_SLOT_DURATION_MINUTES,
  timeZone: string = CLINIC_TIME_ZONE,
): readonly AvailabilitySlot[] {
  const durationMilliseconds =
    durationMinutes * 60 * 1000;

  const slots: AvailabilitySlot[] = [];

  for (const interval of intervals) {
    const startInstant =
      new Date(interval.startAt);

    const endInstant =
      new Date(interval.endAt);

    if (
      Number.isNaN(startInstant.getTime()) ||
      Number.isNaN(endInstant.getTime())
    ) {
      throw new Error(
        'Invalid availability interval date-time',
      );
    }

    for (
      let slotStart = startInstant.getTime();
      slotStart + durationMilliseconds <=
      endInstant.getTime();
      slotStart += durationMilliseconds
    ) {
      const slotEnd =
        slotStart + durationMilliseconds;

      if (
        overlapsBlockedInterval(
          slotStart,
          slotEnd,
          blockedIntervals,
        )
      ) {
        continue;
      }

      const startPoint =
        toClinicSchedulePoint(
          new Date(slotStart).toISOString(),
          timeZone,
        );

      if (startPoint.date !== clinicDate) {
        continue;
      }

      const endPoint =
        toClinicSchedulePoint(
          new Date(slotEnd).toISOString(),
          timeZone,
        );

      if (endPoint.date !== clinicDate) {
        continue;
      }

      slots.push({
        startAt: toClinicOffsetDateTime(
          `${startPoint.date}T${startPoint.time}`,
          timeZone,
        ),
        endAt: toClinicOffsetDateTime(
          `${endPoint.date}T${endPoint.time}`,
          timeZone,
        ),
        label: startPoint.time,
      });
    }
  }

  return slots.sort((left, right) =>
    left.startAt.localeCompare(right.startAt),
  );
}

export function updateAvailabilityIntervalTime(
  intervals: readonly AvailabilityInterval[],
  dayKey: AvailabilityDayKey,
  shiftIndex: number,
  field: AvailabilityTimeField,
  time: string,
  timeZone: string = CLINIC_TIME_ZONE,
): readonly AvailabilityInterval[] {
  const matchingIndexes = intervals
    .map((interval, index) => ({
      index,
      point: toClinicSchedulePoint(
        interval.startAt,
        timeZone,
      ),
    }))
    .filter(
      ({ point }) =>
        point.dayKey === dayKey,
    )
    .sort((left, right) =>
      left.point.time.localeCompare(
        right.point.time,
      ),
    );

  const target =
    matchingIndexes[shiftIndex];

  if (!target) {
    return intervals;
  }

  return intervals.map((interval, index) => {
    if (index !== target.index) {
      return interval;
    }

    const localDate =
      toClinicSchedulePoint(
        interval[field],
        timeZone,
      ).date;

    return {
      ...interval,
      [field]: toClinicOffsetDateTime(
        `${localDate}T${time}`,
        timeZone,
      ),
    };
  });
}

function overlapsBlockedInterval(
  slotStart: number,
  slotEnd: number,
  blockedIntervals: readonly AvailabilityInterval[],
): boolean {
  return blockedIntervals.some((blockedInterval) => {
    const blockedStart =
      new Date(blockedInterval.startAt).getTime();

    const blockedEnd =
      new Date(blockedInterval.endAt).getTime();

    if (
      Number.isNaN(blockedStart) ||
      Number.isNaN(blockedEnd)
    ) {
      throw new Error(
        'Invalid availability interval date-time',
      );
    }

    return (
      slotStart < blockedEnd &&
      slotEnd > blockedStart
    );
  });
}

function toClinicSchedulePoint(
  value: string,
  timeZone: string = CLINIC_TIME_ZONE,
): {
  readonly dayKey: string;
  readonly date: string;
  readonly time: string;
} {
  const instant = new Date(value);

  if (Number.isNaN(instant.getTime())) {
    throw new Error(
      'Invalid availability interval date-time',
    );
  }

  const formatter =
    getClinicDateTimeFormatter(timeZone);

  const parts = Object.fromEntries(
    formatter
      .formatToParts(instant)
      .map((part) => [
        part.type,
        part.value,
      ]),
  );

  return {
    dayKey: parts['weekday'].toLowerCase(),
    date:
      `${parts['year']}-${parts['month']}-${parts['day']}`,
    time:
      `${parts['hour']}:${parts['minute']}`,
  };
}

function getClinicDateTimeFormatter(
  timeZone: string,
): Intl.DateTimeFormat {
  const existingFormatter =
    CLINIC_DATE_TIME_FORMATTERS.get(timeZone);

  if (existingFormatter) {
    return existingFormatter;
  }

  const formatter =
    new Intl.DateTimeFormat('en-US', {
      timeZone,
      weekday: 'long',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    });

  CLINIC_DATE_TIME_FORMATTERS.set(
    timeZone,
    formatter,
  );

  return formatter;
}

function isAvailabilityDayKey(
  value: string,
): value is AvailabilityDayKey {
  return (
    SUPPORTED_WEEK_DAYS as readonly string[]
  ).includes(value);
}
