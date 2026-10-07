export interface AvailabilityDayDefaults {
  readonly key: string;
  readonly label: string;
  readonly enabled: boolean;
  readonly shiftOne: { readonly start: string; readonly end: string };
  readonly shiftTwo: {
    readonly enabled: boolean;
    readonly start: string;
    readonly end: string;
  };
}

const WEEK_DAYS = [
  ['monday', 'Lunes'],
  ['tuesday', 'Martes'],
  ['wednesday', 'Miércoles'],
  ['thursday', 'Jueves'],
  ['friday', 'Viernes'],
] as const;

export const DEFAULT_SLOT_DURATION_MINUTES = 30;

export const DEFAULT_WEEKLY_AVAILABILITY: readonly AvailabilityDayDefaults[] =
  WEEK_DAYS.map(([key, label]) => ({
    key,
    label,
    enabled: true,
    shiftOne: { start: '08:00', end: '12:00' },
    shiftTwo: { enabled: true, start: '14:00', end: '18:00' },
  }));