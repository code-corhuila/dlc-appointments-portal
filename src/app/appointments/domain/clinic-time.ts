export const CLINIC_TIME_ZONE = 'America/Bogota';
export const CLINIC_UTC_OFFSET = '-05:00';

export function toClinicOffsetDateTime(localDateTime: string): string {
  const hasSeconds =
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(localDateTime);

  const normalizedDateTime = hasSeconds
    ? localDateTime
    : `${localDateTime}:00`;

  return `${normalizedDateTime}${CLINIC_UTC_OFFSET}`;
}