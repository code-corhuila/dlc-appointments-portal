
export const CLINIC_TIME_ZONE = 'America/Bogota';
export const CLINIC_UTC_OFFSET = '-05:00';

const LOCAL_DATE_TIME_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})T([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/;

const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;
const MINUTE_IN_MILLISECONDS = 60 * 1000;

interface DateTimeParts {
  readonly year: number;
  readonly month: number;
  readonly day: number;
  readonly hour: number;
  readonly minute: number;
  readonly second: number;
}

export function toClinicOffsetDateTime(
  localDateTime: string,
  timeZone: string = CLINIC_TIME_ZONE,
): string {
  const match = LOCAL_DATE_TIME_PATTERN.exec(
    localDateTime,
  );

  if (!match) {
    throw new Error('Invalid clinic local date-time');
  }

  const [
    ,
    year,
    month,
    day,
    hour,
    minute,
    second = '00',
  ] = match;

  const requestedDate: DateTimeParts = {
    year: Number(year),
    month: Number(month),
    day: Number(day),
    hour: Number(hour),
    minute: Number(minute),
    second: Number(second),
  };

  const utcMilliseconds = Date.UTC(
    requestedDate.year,
    requestedDate.month - 1,
    requestedDate.day,
    requestedDate.hour,
    requestedDate.minute,
    requestedDate.second,
  );

  const parsedDate = new Date(utcMilliseconds);

  const isValidCalendarDate =
    parsedDate.getUTCFullYear() === requestedDate.year &&
    parsedDate.getUTCMonth() === requestedDate.month - 1 &&
    parsedDate.getUTCDate() === requestedDate.day &&
    parsedDate.getUTCHours() === requestedDate.hour &&
    parsedDate.getUTCMinutes() === requestedDate.minute &&
    parsedDate.getUTCSeconds() === requestedDate.second;

  if (!isValidCalendarDate) {
    throw new Error('Invalid clinic local date-time');
  }

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });

  const possibleOffsets = new Set<number>();

  for (const dayOffset of [-1, 0, 1]) {
    const sampleInstant =
      utcMilliseconds +
      dayOffset * DAY_IN_MILLISECONDS;

    const localParts = getDateTimeParts(
      formatter,
      sampleInstant,
    );

    const localAsUtc = Date.UTC(
      localParts.year,
      localParts.month - 1,
      localParts.day,
      localParts.hour,
      localParts.minute,
      localParts.second,
    );

    possibleOffsets.add(
      (localAsUtc - sampleInstant) /
        MINUTE_IN_MILLISECONDS,
    );
  }

  for (const offsetMinutes of possibleOffsets) {
    const candidateInstant =
      utcMilliseconds -
      offsetMinutes * MINUTE_IN_MILLISECONDS;

    const candidateParts = getDateTimeParts(
      formatter,
      candidateInstant,
    );

    if (
      candidateParts.year === requestedDate.year &&
      candidateParts.month === requestedDate.month &&
      candidateParts.day === requestedDate.day &&
      candidateParts.hour === requestedDate.hour &&
      candidateParts.minute === requestedDate.minute &&
      candidateParts.second === requestedDate.second
    ) {
      return (
        `${year}-${month}-${day}T` +
        `${hour}:${minute}:${second}` +
        formatUtcOffset(offsetMinutes)
      );
    }
  }

  // Reject local times that do not exist due to DST transitions.
  throw new Error('Invalid clinic local date-time');
}

function getDateTimeParts(
  formatter: Intl.DateTimeFormat,
  instant: number,
): DateTimeParts {
  const parts = formatter
    .formatToParts(new Date(instant))
    .reduce<Record<string, string>>(
      (result, part) => {
        result[part.type] = part.value;
        return result;
      },
      {},
    );

  return {
    year: Number(parts['year']),
    month: Number(parts['month']),
    day: Number(parts['day']),
    hour: Number(parts['hour']),
    minute: Number(parts['minute']),
    second: Number(parts['second']),
  };
}

function formatUtcOffset(
  offsetMinutes: number,
): string {
  const sign = offsetMinutes < 0 ? '-' : '+';

  const absoluteMinutes = Math.abs(offsetMinutes);

  const hours = Math.floor(
    absoluteMinutes / 60,
  );

  const minutes = absoluteMinutes % 60;

  return (
    sign +
    String(hours).padStart(2, '0') +
    ':' +
    String(minutes).padStart(2, '0')
  );
}
