export const CLINIC_TIME_ZONE = 'America/Bogota';
export const CLINIC_UTC_OFFSET = '-05:00';

const LOCAL_DATE_TIME_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})T([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/;

export function toClinicOffsetDateTime(localDateTime: string): string {
  const match = LOCAL_DATE_TIME_PATTERN.exec(localDateTime);

  if (!match) {
    throw new Error('Invalid clinic local date-time');
  }

  const [, year, month, day, hour, minute, second = '00'] = match;

  const parsedDate = new Date(
    Date.UTC(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      Number(second),
    ),
  );

  const isValidCalendarDate =
    parsedDate.getUTCFullYear() === Number(year) &&
    parsedDate.getUTCMonth() === Number(month) - 1 &&
    parsedDate.getUTCDate() === Number(day) &&
    parsedDate.getUTCHours() === Number(hour) &&
    parsedDate.getUTCMinutes() === Number(minute) &&
    parsedDate.getUTCSeconds() === Number(second);

  if (!isValidCalendarDate) {
    throw new Error('Invalid clinic local date-time');
  }

  return `${year}-${month}-${day}T${hour}:${minute}:${second}${CLINIC_UTC_OFFSET}`;
}